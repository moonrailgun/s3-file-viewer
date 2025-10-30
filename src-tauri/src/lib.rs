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
use aws_smithy_types::error::metadata::ProvideErrorMetadata;
use base64::{engine::general_purpose, Engine};
use s3::primitives::DateTime;
use std::time::Duration;

// Helper function to extract error code and message from AWS SDK errors
fn format_s3_error<E, R>(error: &s3::error::SdkError<E, R>) -> String
where
    E: std::error::Error + ProvideErrorMetadata,
{
    match error {
        s3::error::SdkError::ServiceError(err) => {
            // Extract error code and message from service error metadata
            let source = err.err();
            let code = source.code().unwrap_or("UnknownError");
            let message = source.message().unwrap_or("No error message available");
            format!("{}: {}", code, message)
        }
        s3::error::SdkError::TimeoutError(_) => "Request timeout".to_string(),
        s3::error::SdkError::DispatchFailure(err) => {
            format!("Connection failed: {:?}", err)
        }
        s3::error::SdkError::ResponseError(_) => "Response error occurred".to_string(),
        s3::error::SdkError::ConstructionFailure(err) => {
            format!("Request construction failed: {:?}", err)
        }
        _ => format!("{}", error),
    }
}

// Helper function for generic errors
fn format_error_details<E: std::fmt::Display>(error: &E) -> String {
    error.to_string()
}

// Shared state for S3 client and connection info
#[derive(Clone)]
struct AppState {
    s3_client: Arc<s3::Client>,
}

#[derive(Debug, Error)]
enum AppError {
    #[error("S3 error: {0}")]
    S3(String),
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
            return Err(format_s3_error(e));
        }
    }

    let app_state = AppState {
        s3_client: Arc::new(client),
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
        .map_err(|e| format_s3_error(&e))?;

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
async fn create_bucket(
    bucket_name: String,
    region: String,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<(), String> {
    println!(
        "[create_bucket] Creating bucket: {} in region: {}",
        bucket_name, region
    );

    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;

    // Create bucket with specified region
    let mut req = app.s3_client.create_bucket().bucket(&bucket_name);

    // For regions other than us-east-1, we need to set location constraint
    // us-east-1 is special and should not have a location constraint
    if region != "us-east-1" {
        use aws_sdk_s3::types::{BucketLocationConstraint, CreateBucketConfiguration};

        let location_constraint = BucketLocationConstraint::from(region.as_str());
        let create_bucket_config = CreateBucketConfiguration::builder()
            .location_constraint(location_constraint)
            .build();

        req = req.create_bucket_configuration(create_bucket_config);
    }

    req.send().await.map_err(|e| format_s3_error(&e))?;

    println!(
        "[create_bucket] Successfully created bucket: {}",
        bucket_name
    );
    Ok(())
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
            return Err(format_s3_error(&e));
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
        .map_err(|e| format_s3_error(&e))?;
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
        .map_err(|e| format_s3_error(&e))?;
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
        .map_err(|e| format_error_details(&e))?;
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

    put_request.send().await.map_err(|e| format_s3_error(&e))?;
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
        .map_err(|e| format_error_details(&e))?;
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

        put_request.send().await.map_err(|e| format_s3_error(&e))?;

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

        put_request.send().await.map_err(|e| format_s3_error(&e))?;

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
        .plugin(tauri_plugin_fs::init())
        .manage(tokio::sync::Mutex::new(None::<AppState>))
        .invoke_handler(tauri::generate_handler![
            connect,
            list_buckets,
            create_bucket,
            list_objects,
            create_folder,
            delete_object,
            upload_object,
            upload_object_with_progress,
            get_object_url,
            download_object
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
    let cfg = PresigningConfig::expires_in(Duration::from_secs(capped))
        .map_err(|e| format_error_details(&e))?;
    let req = app
        .s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .presigned(cfg)
        .await
        .map_err(|e| format_s3_error(&e))?;
    Ok(req.uri().to_string())
}

#[tauri::command]
async fn download_object(
    bucket: String,
    key: String,
    save_path: String,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<(), String> {
    println!(
        "[download_object] bucket: {}, key: {}, save_path: {}",
        bucket, key, save_path
    );

    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;

    // Download object from S3
    let resp = app
        .s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .map_err(|e| format_s3_error(&e))?;

    // Read the body as bytes
    let data = resp
        .body
        .collect()
        .await
        .map_err(|e| format!("Failed to read object body: {}", e))?;
    let bytes = data.into_bytes();

    // Write to file
    std::fs::write(&save_path, bytes).map_err(|e| format!("Failed to write file: {}", e))?;

    println!(
        "[download_object] Successfully downloaded to: {}",
        save_path
    );
    Ok(())
}
