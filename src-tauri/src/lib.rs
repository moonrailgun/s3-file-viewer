use std::sync::Arc;

use futures::future;
use serde::{Deserialize, Serialize};
use serde_json;
use tauri::Emitter;
use thiserror::Error;

// AWS SDK imports
use aws_credential_types::Credentials;
use aws_sdk_s3 as s3;
use aws_sdk_s3::presigning::PresigningConfig;
use base64::{engine::general_purpose, Engine};
use s3::primitives::DateTime;
use std::time::Duration;

// SSH tunnel imports
use ssh2::Session;
use std::net::TcpStream;
use std::path::PathBuf;
use tokio::net::TcpListener;
// use tokio::io::{AsyncReadExt, AsyncWriteExt}; // Not needed for ssh2

// SSH tunnel handle for cleanup
#[derive(Debug)]
struct SshTunnelHandle {
    local_port: u16,
    _handle: tokio::task::JoinHandle<()>,
}

// Shared state for S3 client and connection info
#[derive(Clone)]
struct AppState {
    s3_client: Arc<s3::Client>,
    bucket_cache: Arc<tokio::sync::RwLock<Vec<String>>>,
    ssh_tunnel: Arc<tokio::sync::RwLock<Option<SshTunnelHandle>>>,
}

#[derive(Debug, Error)]
enum AppError {
    #[error("S3 error: {0}")]
    S3(String),
    #[error("Invalid input: {0}")]
    InvalidInput(String),
}

impl From<s3::error::SdkError<s3::operation::list_buckets::ListBucketsError>> for AppError {
    fn from(err: s3::error::SdkError<s3::operation::list_buckets::ListBucketsError>) -> Self {
        AppError::S3(err.to_string())
    }
}

impl From<s3::error::SdkError<s3::operation::list_objects_v2::ListObjectsV2Error>> for AppError {
    fn from(err: s3::error::SdkError<s3::operation::list_objects_v2::ListObjectsV2Error>) -> Self {
        AppError::S3(err.to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SshTunnelConfig {
    enabled: bool,
    host: String,
    port: u16,
    username: String,
    auth_method: String, // "password" or "key"
    password: Option<String>,
    private_key_path: Option<String>,
    private_key_passphrase: Option<String>,
    local_port: Option<u16>, // Auto-assigned if not specified
    remote_host: String,     // Usually localhost or internal IP
    remote_port: u16,        // Minio port, usually 9000
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ConnectionParams {
    endpoint: String,
    access_key: String,
    secret_key: String,
    region: String,
    ssh_tunnel: Option<SshTunnelConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct S3ObjectInfo {
    key: String,
    size: i64,
    last_modified: Option<String>,
    is_dir: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct BucketInfo {
    name: String,
    region: String,
}

// SSH tunnel implementation using ssh2 (synchronous) in a blocking task
async fn create_ssh_tunnel(config: &SshTunnelConfig) -> Result<SshTunnelHandle, String> {
    println!(
        "[SSH] Creating SSH tunnel to {}@{}:{}",
        config.username, config.host, config.port
    );

    // Determine local port
    let local_port = if let Some(port) = config.local_port {
        port
    } else {
        // Find an available port
        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .map_err(|e| format!("Failed to bind to local port: {}", e))?;
        let addr = listener
            .local_addr()
            .map_err(|e| format!("Failed to get local address: {}", e))?;
        drop(listener); // Close the temporary listener
        addr.port()
    };

    println!("[SSH] Using local port: {}", local_port);

    // Clone config values for the blocking task
    let ssh_host = config.host.clone();
    let ssh_port = config.port;
    let ssh_username = config.username.clone();
    let ssh_auth_method = config.auth_method.clone();
    let ssh_password = config.password.clone();
    let ssh_private_key_path = config.private_key_path.clone();
    let ssh_private_key_passphrase = config.private_key_passphrase.clone();
    let remote_host = config.remote_host.clone();
    let remote_port = config.remote_port;

    // Create local listener
    let listener = TcpListener::bind(format!("127.0.0.1:{}", local_port))
        .await
        .map_err(|e| format!("Failed to bind to local port {}: {}", local_port, e))?;

    println!("[SSH] Local listener created on port {}", local_port);

    // Start tunnel task
    let tunnel_handle = tokio::spawn(async move {
        println!("[SSH] Starting tunnel loop");
        loop {
            match listener.accept().await {
                Ok((local_stream, addr)) => {
                    println!("[SSH] Accepted connection from {}", addr);

                    // Clone values for this connection
                    let ssh_host = ssh_host.clone();
                    let ssh_username = ssh_username.clone();
                    let ssh_auth_method = ssh_auth_method.clone();
                    let ssh_password = ssh_password.clone();
                    let ssh_private_key_path = ssh_private_key_path.clone();
                    let ssh_private_key_passphrase = ssh_private_key_passphrase.clone();
                    let remote_host_for_spawn = remote_host.clone();

                    // Handle each connection in a separate task
                    tokio::spawn(async move {
                        // Use spawn_blocking for synchronous SSH operations
                        let remote_host_for_print = remote_host_for_spawn.clone();
                        let result = tokio::task::spawn_blocking(move || {
                            // Connect to SSH server
                            let tcp = TcpStream::connect((ssh_host.as_str(), ssh_port))
                                .map_err(|e| format!("Failed to connect to SSH server: {}", e))?;
                            let mut sess = Session::new()
                                .map_err(|e| format!("Failed to create SSH session: {}", e))?;
                            sess.set_tcp_stream(tcp);
                            sess.handshake()
                                .map_err(|e| format!("SSH handshake failed: {}", e))?;

                            // Authenticate
                            match ssh_auth_method.as_str() {
                                "password" => {
                                    let password = ssh_password.ok_or(
                                        "Password is required for password authentication",
                                    )?;
                                    sess.userauth_password(&ssh_username, &password).map_err(
                                        |e| format!("Password authentication failed: {}", e),
                                    )?;
                                }
                                "key" => {
                                    let key_path = ssh_private_key_path.ok_or(
                                        "Private key path is required for key authentication",
                                    )?;

                                    if let Some(passphrase) = ssh_private_key_passphrase {
                                        sess.userauth_pubkey_file(
                                            &ssh_username,
                                            None,
                                            PathBuf::from(key_path).as_path(),
                                            Some(&passphrase),
                                        )
                                        .map_err(|e| {
                                            format!(
                                                "Key authentication with passphrase failed: {}",
                                                e
                                            )
                                        })?;
                                    } else {
                                        sess.userauth_pubkey_file(
                                            &ssh_username,
                                            None,
                                            PathBuf::from(key_path).as_path(),
                                            None,
                                        )
                                        .map_err(|e| format!("Key authentication failed: {}", e))?;
                                    }
                                }
                                _ => return Err("Invalid authentication method".to_string()),
                            };

                            if !sess.authenticated() {
                                return Err("SSH authentication failed".to_string());
                            }

                            println!("[SSH] SSH authentication successful");

                            // Create a direct TCP/IP channel (port forwarding)
                            let channel = sess
                                .channel_direct_tcpip(&remote_host_for_spawn, remote_port, None)
                                .map_err(|e| format!("Failed to create SSH channel: {}", e))?;

                            Ok::<_, String>((sess, channel))
                        })
                        .await;

                        match result {
                            Ok(Ok((sess, mut channel))) => {
                                println!(
                                    "[SSH] Established tunnel to {}:{}",
                                    remote_host_for_print, remote_port
                                );

                                // Convert tokio stream to std stream for ssh2
                                let std_stream = local_stream.into_std().unwrap();

                                // Handle the forwarding in a blocking task
                                tokio::task::spawn_blocking(move || {
                                    use std::io::{Read, Write};

                                    // Set non-blocking mode for the channel
                                    sess.set_blocking(false);

                                    let mut local_stream = std_stream;
                                    let mut buffer = vec![0u8; 8192];

                                    loop {
                                        // Try to read from local stream and write to SSH channel
                                        match local_stream.read(&mut buffer) {
                                            Ok(0) => {
                                                println!("[SSH] Local stream closed");
                                                break;
                                            }
                                            Ok(n) => {
                                                if let Err(e) = channel.write_all(&buffer[..n]) {
                                                    if e.kind() != std::io::ErrorKind::WouldBlock {
                                                        eprintln!(
                                                            "[SSH] Failed to write to channel: {}",
                                                            e
                                                        );
                                                        break;
                                                    }
                                                }
                                            }
                                            Err(e) => {
                                                if e.kind() != std::io::ErrorKind::WouldBlock {
                                                    eprintln!("[SSH] Failed to read from local stream: {}", e);
                                                    break;
                                                }
                                            }
                                        }

                                        // Try to read from SSH channel and write to local stream
                                        match channel.read(&mut buffer) {
                                            Ok(0) => {
                                                println!("[SSH] SSH channel closed");
                                                break;
                                            }
                                            Ok(n) => {
                                                if let Err(e) = local_stream.write_all(&buffer[..n])
                                                {
                                                    if e.kind() != std::io::ErrorKind::WouldBlock {
                                                        eprintln!("[SSH] Failed to write to local stream: {}", e);
                                                        break;
                                                    }
                                                }
                                            }
                                            Err(e) => {
                                                if e.kind() != std::io::ErrorKind::WouldBlock {
                                                    eprintln!(
                                                        "[SSH] Failed to read from channel: {}",
                                                        e
                                                    );
                                                    break;
                                                }
                                            }
                                        }

                                        // Small delay to prevent busy waiting
                                        std::thread::sleep(std::time::Duration::from_millis(1));
                                    }
                                });
                            }
                            Ok(Err(e)) => {
                                eprintln!("[SSH] Failed to establish SSH connection: {}", e);
                            }
                            Err(e) => {
                                eprintln!("[SSH] Task failed: {}", e);
                            }
                        }
                    });
                }
                Err(e) => {
                    eprintln!("[SSH] Failed to accept connection: {}", e);
                    break;
                }
            }
        }
    });

    println!("[SSH] Tunnel created successfully on port {}", local_port);

    Ok(SshTunnelHandle {
        local_port,
        _handle: tunnel_handle,
    })
}

#[tauri::command]
async fn connect(
    params: ConnectionParams,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<(), String> {
    println!("[connect] Starting connection process");

    // Handle SSH tunnel if configured
    let ssh_tunnel_handle = if let Some(ssh_config) = &params.ssh_tunnel {
        if ssh_config.enabled {
            println!("[connect] SSH tunnel is enabled, creating tunnel...");
            Some(create_ssh_tunnel(ssh_config).await?)
        } else {
            None
        }
    } else {
        None
    };

    // Determine the actual endpoint to use
    let actual_endpoint = if let Some(tunnel) = &ssh_tunnel_handle {
        // Use localhost with the tunnel port
        format!("http://127.0.0.1:{}", tunnel.local_port)
    } else {
        params.endpoint.clone()
    };

    println!("[connect] Using endpoint: {}", actual_endpoint);
    println!("[connect] region: {}", params.region);
    println!("[connect] access_key: {}", params.access_key);
    // Do not print secret_key for security

    let region = aws_config::Region::new(params.region.clone());
    let credentials = Credentials::new(
        params.access_key.clone(),
        params.secret_key.clone(),
        None,
        None,
        "s3-file-viewer",
    );
    println!("[connect] Credentials created");

    let conf = aws_sdk_s3::config::Builder::new()
        .region(region)
        .credentials_provider(credentials)
        .endpoint_url(actual_endpoint)
        .behavior_version(s3::config::BehaviorVersion::latest())
        .force_path_style(true)
        .build();

    println!("[connect] S3 config built");

    let client = s3::Client::from_conf(conf);

    println!("[connect] S3 client created, testing list_buckets...");

    // Simple test call
    let test_result = client.list_buckets().send().await;
    match &test_result {
        Ok(resp) => {
            let bucket_count = resp.buckets().len();
            println!(
                "[connect] list_buckets succeeded, found {} buckets",
                bucket_count
            );
        }
        Err(e) => {
            eprintln!("[connect] list_buckets error: {e:#?}"); // Print detailed error
            return Err(e.to_string());
        }
    }

    let app_state = AppState {
        s3_client: Arc::new(client),
        bucket_cache: Arc::new(tokio::sync::RwLock::new(Vec::new())),
        ssh_tunnel: Arc::new(tokio::sync::RwLock::new(ssh_tunnel_handle)),
    };

    println!("[connect] AppState created, acquiring lock...");

    let mut guard = state.lock().await;
    *guard = Some(app_state);

    println!("[connect] AppState stored in global state");

    Ok(())
}

#[tauri::command]
async fn list_buckets(
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<Vec<BucketInfo>, String> {
    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;

    let resp = app
        .s3_client
        .list_buckets()
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let names: Vec<String> = resp
        .buckets()
        .iter()
        .filter_map(|b| b.name().map(|n| n.to_string()))
        .collect();

    // Concurrently fetch locations
    let futs = names
        .iter()
        .map(|name| app.s3_client.get_bucket_location().bucket(name).send());
    let results = future::join_all(futs).await;

    let infos = names
        .into_iter()
        .zip(results)
        .map(|(name, res)| {
            let region = match res {
                Ok(loc_resp) => loc_resp
                    .location_constraint()
                    .map(|lc| lc.as_str().to_string())
                    .unwrap_or_else(|| "us-east-1".to_string()),
                Err(err) => {
                    eprintln!(
                        "[list_buckets] get_bucket_location failed for {}: {}",
                        name, err
                    );
                    "us-east-1".to_string()
                }
            };
            BucketInfo { name, region }
        })
        .collect::<Vec<_>>();

    Ok(infos)
}

#[tauri::command]
async fn list_objects(
    bucket: String,
    prefix: Option<String>,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<Vec<S3ObjectInfo>, String> {
    // Log: received list_objects request
    println!("[list_objects] bucket: {}, prefix: {:?}", bucket, prefix);

    let guard = state.lock().await;
    let app = match guard.as_ref() {
        Some(app) => app,
        None => {
            eprintln!("[list_objects] Not connected");
            return Err("Not connected".to_string());
        }
    };

    // Log: preparing list_objects_v2 request
    let mut req = app.s3_client.list_objects_v2().bucket(bucket.clone());
    if let Some(p) = &prefix {
        if !p.is_empty() {
            println!("[list_objects] Using prefix: {}", p);
            req = req.prefix(p);
        }
    }
    req = req.delimiter("/");

    // Log: sending list_objects_v2 request
    let resp = match req.send().await {
        Ok(r) => {
            println!("[list_objects] list_objects_v2 request succeeded");
            r
        }
        Err(e) => {
            eprintln!("[list_objects] list_objects_v2 request failed: {e:#?}");
            return Err(e.to_string());
        }
    };

    let mut result: Vec<S3ObjectInfo> = Vec::new();

    // Log: processing common_prefixes (folders)
    for cp in resp.common_prefixes() {
        if let Some(p) = cp.prefix() {
            println!("[list_objects] Found folder: {}", p);
            result.push(S3ObjectInfo {
                key: p.to_string(),
                size: 0,
                last_modified: None,
                is_dir: true,
            });
        }
    }

    // Log: processing contents (files)
    for obj in resp.contents() {
        let key = obj.key().unwrap_or_default().to_string();
        let size = obj.size().unwrap_or_default();
        let last_modified = obj
            .last_modified()
            .and_then(|d: &DateTime| d.fmt(aws_smithy_types::date_time::Format::DateTime).ok());
        println!(
            "[list_objects] Found file: key={}, size={}, last_modified={:?}",
            key, size, last_modified
        );
        result.push(S3ObjectInfo {
            key,
            size,
            last_modified,
            is_dir: false,
        });
    }

    println!("[list_objects] Returning {} objects", result.len());
    Ok(result)
}

#[tauri::command]
async fn create_folder(
    bucket: String,
    folder_key: String,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<(), String> {
    if !folder_key.ends_with('/') {
        return Err("Folder key must end with '/'".into());
    }
    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;
    app.s3_client
        .put_object()
        .bucket(bucket)
        .key(folder_key)
        .body(aws_sdk_s3::primitives::ByteStream::from_static(&[]))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn delete_object(
    bucket: String,
    key: String,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<(), String> {
    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;
    app.s3_client
        .delete_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Deserialize)]
struct UploadParams {
    bucket: String,
    key: String,
    // Base64 encoded content
    content_base64: String,
    content_type: Option<String>, // MIME type of the content
}

#[derive(Deserialize)]
struct UploadWithProgressParams {
    bucket: String,
    key: String,
    // Base64 encoded content
    content_base64: String,
    upload_id: String,            // Unique ID for this upload to track progress
    content_type: Option<String>, // MIME type of the content
}

#[tauri::command]
async fn upload_object(
    params: UploadParams,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<(), String> {
    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;
    let data = general_purpose::STANDARD
        .decode(&params.content_base64)
        .map_err(|e| e.to_string())?;
    let body = aws_sdk_s3::primitives::ByteStream::from(data);

    let mut put_request = app
        .s3_client
        .put_object()
        .bucket(params.bucket)
        .key(params.key)
        .body(body);

    // Set content type if provided
    if let Some(content_type) = &params.content_type {
        put_request = put_request.content_type(content_type);
    }

    put_request.send().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn upload_object_with_progress(
    params: UploadWithProgressParams,
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<(), String> {
    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;

    // Decode the base64 content
    let data = general_purpose::STANDARD
        .decode(&params.content_base64)
        .map_err(|e| e.to_string())?;
    let total_size = data.len();

    // Send initial progress event
    let _ = app_handle.emit(
        &format!("upload-progress-{}", params.upload_id),
        serde_json::json!({
            "progress": 0,
            "uploaded": 0,
            "total": total_size
        }),
    );

    // For small files, upload directly
    if total_size <= 5 * 1024 * 1024 {
        // 5MB
        let body = aws_sdk_s3::primitives::ByteStream::from(data);

        // Send 50% progress before upload
        let _ = app_handle.emit(
            &format!("upload-progress-{}", params.upload_id),
            serde_json::json!({
                "progress": 50,
                "uploaded": total_size / 2,
                "total": total_size
            }),
        );

        let mut put_request = app
            .s3_client
            .put_object()
            .bucket(&params.bucket)
            .key(&params.key)
            .body(body);

        // Set content type if provided
        if let Some(content_type) = &params.content_type {
            put_request = put_request.content_type(content_type);
        }

        put_request.send().await.map_err(|e| e.to_string())?;

        // Send completion progress
        let _ = app_handle.emit(
            &format!("upload-progress-{}", params.upload_id),
            serde_json::json!({
                "progress": 100,
                "uploaded": total_size,
                "total": total_size
            }),
        );
    } else {
        // For larger files, simulate chunked upload with progress updates
        const CHUNK_SIZE: usize = 1024 * 1024; // 1MB chunks
        let chunks: Vec<&[u8]> = data.chunks(CHUNK_SIZE).collect();
        let _total_chunks = chunks.len();

        for (i, _chunk) in chunks.iter().enumerate() {
            // Simulate upload delay
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

            let uploaded = std::cmp::min((i + 1) * CHUNK_SIZE, total_size);
            let progress = (uploaded as f64 / total_size as f64 * 100.0) as u32;

            let _ = app_handle.emit(
                &format!("upload-progress-{}", params.upload_id),
                serde_json::json!({
                    "progress": progress,
                    "uploaded": uploaded,
                    "total": total_size
                }),
            );
        }

        // Actually upload the file
        let body = aws_sdk_s3::primitives::ByteStream::from(data);
        let mut put_request = app
            .s3_client
            .put_object()
            .bucket(&params.bucket)
            .key(&params.key)
            .body(body);

        // Set content type if provided
        if let Some(content_type) = &params.content_type {
            put_request = put_request.content_type(content_type);
        }

        put_request.send().await.map_err(|e| e.to_string())?;

        // Send final completion
        let _ = app_handle.emit(
            &format!("upload-progress-{}", params.upload_id),
            serde_json::json!({
                "progress": 100,
                "uploaded": total_size,
                "total": total_size
            }),
        );
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(tokio::sync::Mutex::new(None::<AppState>))
        .invoke_handler(tauri::generate_handler![
            connect,
            list_buckets,
            list_objects,
            create_folder,
            delete_object,
            upload_object,
            upload_object_with_progress,
            get_object_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn get_object_url(
    bucket: String,
    key: String,
    expires_secs: Option<u64>,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<String, String> {
    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;
    let secs = expires_secs.unwrap_or(900);
    let capped = secs.min(7 * 24 * 60 * 60);
    let cfg =
        PresigningConfig::expires_in(Duration::from_secs(capped)).map_err(|e| e.to_string())?;
    let req = app
        .s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .presigned(cfg)
        .await
        .map_err(|e| e.to_string())?;
    Ok(req.uri().to_string())
}
