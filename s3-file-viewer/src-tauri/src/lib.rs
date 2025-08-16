use std::sync::Arc;

use futures::future;
use serde::{Deserialize, Serialize};
use thiserror::Error;

// AWS SDK imports
use aws_credential_types::Credentials;
use aws_sdk_s3 as s3;
use aws_sdk_s3::presigning::PresigningConfig;
use s3::primitives::DateTime;
use std::time::Duration;

// Shared state for S3 client and connection info
#[derive(Clone)]
struct AppState {
    s3_client: Arc<s3::Client>,
    bucket_cache: Arc<tokio::sync::RwLock<Vec<String>>>,
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
struct ConnectionParams {
    endpoint: String,
    access_key: String,
    secret_key: String,
    region: String,
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

#[tauri::command]
async fn connect(
    params: ConnectionParams,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<(), String> {
    // Build AWS SDK config with custom endpoint/credentials
    println!("[connect] region: {}", params.region);
    println!("[connect] endpoint: {}", params.endpoint);
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
        .endpoint_url(params.endpoint.clone())
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
}

#[tauri::command]
async fn upload_object(
    params: UploadParams,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<(), String> {
    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;
    let data = base64::decode(&params.content_base64).map_err(|e| e.to_string())?;
    let body = aws_sdk_s3::primitives::ByteStream::from(data);
    app.s3_client
        .put_object()
        .bucket(params.bucket)
        .key(params.key)
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(tokio::sync::Mutex::new(None::<AppState>))
        .invoke_handler(tauri::generate_handler![
            connect,
            list_buckets,
            list_objects,
            create_folder,
            delete_object,
            upload_object,
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
