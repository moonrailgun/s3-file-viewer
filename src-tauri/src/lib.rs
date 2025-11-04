// Desktop implementation below - only compiled for desktop platforms
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use std::sync::Arc;

#[cfg(not(any(target_os = "ios", target_os = "android")))]
use base64::{engine::general_purpose, Engine};
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use futures::future;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use regex::Regex;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use serde_json;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use std::time::Duration;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use tauri::Emitter;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use thiserror::Error;

// AWS SDK imports - only available on desktop platforms
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use aws_credential_types::Credentials;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use aws_sdk_s3 as s3;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use aws_sdk_s3::presigning::PresigningConfig;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use aws_smithy_types::error::metadata::ProvideErrorMetadata;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use s3::primitives::DateTime;

// Helper function to extract error code and message from AWS SDK errors
#[cfg(not(any(target_os = "ios", target_os = "android")))]
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
#[cfg(not(any(target_os = "ios", target_os = "android")))]
fn format_error_details<E: std::fmt::Display>(error: &E) -> String {
    error.to_string()
}

// ============================================================================
// DESKTOP-ONLY CODE BELOW
// All structures, functions, and commands below are only compiled for desktop platforms
// ============================================================================

// Shared state for S3 client and connection info
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[derive(Clone)]
struct AppState {
    s3_client: Arc<s3::Client>,
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[derive(Debug, Error)]
enum AppError {
    #[error("S3 error: {0}")]
    S3(String),
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
impl From<s3::error::SdkError<s3::operation::list_buckets::ListBucketsError>> for AppError {
    fn from(err: s3::error::SdkError<s3::operation::list_buckets::ListBucketsError>) -> Self {
        AppError::S3(err.to_string())
    }
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
impl From<s3::error::SdkError<s3::operation::list_objects_v2::ListObjectsV2Error>> for AppError {
    fn from(err: s3::error::SdkError<s3::operation::list_objects_v2::ListObjectsV2Error>) -> Self {
        AppError::S3(err.to_string())
    }
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ConnectionParams {
    endpoint: String,
    access_key: String,
    secret_key: String,
    region: String,
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[derive(Debug, Clone, Serialize, Deserialize)]
struct S3ObjectInfo {
    key: String,
    size: i64,
    last_modified: Option<String>,
    is_dir: bool,
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[derive(Debug, Clone, Serialize, Deserialize)]
struct BucketInfo {
    name: String,
    region: String,
    creation_date: Option<String>,
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[derive(Debug, Clone, Serialize, Deserialize)]
struct BucketDetails {
    // Versioning
    versioning_enabled: bool,
    versioning_status: Option<String>,

    // Encryption
    encryption_enabled: bool,
    encryption_type: Option<String>,

    // Public access block
    block_public_acls: Option<bool>,
    ignore_public_acls: Option<bool>,
    block_public_policy: Option<bool>,
    restrict_public_buckets: Option<bool>,

    // Lifecycle rules
    lifecycle_rules_count: usize,

    // Tags
    tags_count: usize,

    // CORS
    cors_enabled: bool,

    // Logging
    logging_enabled: bool,
    logging_target_bucket: Option<String>,
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

    // Collect bucket names and creation dates
    let bucket_data: Vec<(String, Option<String>)> = resp
        .buckets()
        .iter()
        .filter_map(|b| {
            b.name().map(|n| {
                let creation_date = b
                    .creation_date()
                    .and_then(|d| d.fmt(aws_smithy_types::date_time::Format::DateTime).ok());
                (n.to_string(), creation_date)
            })
        })
        .collect();

    // Concurrently fetch locations
    let futs = bucket_data
        .iter()
        .map(|(name, _)| app.s3_client.get_bucket_location().bucket(name).send());
    let results = future::join_all(futs).await;

    let infos = bucket_data
        .into_iter()
        .zip(results)
        .map(|((name, creation_date), res)| {
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
            BucketInfo {
                name,
                region,
                creation_date,
            }
        })
        .collect::<Vec<_>>();

    Ok(infos)
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[tauri::command]
async fn search_objects(
    bucket: String,
    prefix: Option<String>,
    search_query: String,
    search_mode: String, // "fuzzy" or "regex"
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<Vec<S3ObjectInfo>, String> {
    println!(
        "[search_objects] bucket: {}, prefix: {:?}, query: {}, mode: {}",
        bucket, prefix, search_query, search_mode
    );

    // If search query is empty, return empty results
    if search_query.trim().is_empty() {
        return Ok(Vec::new());
    }

    // First, get all objects in the current directory using list_objects logic
    let guard = state.lock().await;
    let app = match guard.as_ref() {
        Some(app) => app,
        None => {
            eprintln!("[search_objects] Not connected");
            return Err("Not connected".to_string());
        }
    };

    let mut req = app.s3_client.list_objects_v2().bucket(bucket.clone());
    if let Some(p) = &prefix {
        if !p.is_empty() {
            println!("[search_objects] Using prefix: {}", p);
            req = req.prefix(p);
        }
    }
    req = req.delimiter("/");

    let resp = match req.send().await {
        Ok(r) => {
            println!("[search_objects] list_objects_v2 request succeeded");
            r
        }
        Err(e) => {
            eprintln!("[search_objects] list_objects_v2 request failed: {e:#?}");
            return Err(format_s3_error(&e));
        }
    };

    let mut all_objects: Vec<S3ObjectInfo> = Vec::new();

    // Collect folders
    for cp in resp.common_prefixes() {
        if let Some(p) = cp.prefix() {
            all_objects.push(S3ObjectInfo {
                key: p.to_string(),
                size: 0,
                last_modified: None,
                is_dir: true,
            });
        }
    }

    // Collect files
    for obj in resp.contents() {
        let key = obj.key().unwrap_or_default().to_string();
        let size = obj.size().unwrap_or_default();
        let last_modified = obj
            .last_modified()
            .and_then(|d: &DateTime| d.fmt(aws_smithy_types::date_time::Format::DateTime).ok());
        all_objects.push(S3ObjectInfo {
            key,
            size,
            last_modified,
            is_dir: false,
        });
    }

    // Now filter based on search query and mode
    let filtered: Vec<S3ObjectInfo> = match search_mode.as_str() {
        "regex" => {
            // Regex mode
            match Regex::new(&search_query) {
                Ok(re) => all_objects
                    .into_iter()
                    .filter(|obj| {
                        // Extract filename from key
                        let filename = obj.key.split('/').last().unwrap_or(&obj.key);
                        re.is_match(filename)
                    })
                    .collect(),
                Err(e) => {
                    eprintln!("[search_objects] Invalid regex: {}", e);
                    return Err(format!("Invalid regex pattern: {}", e));
                }
            }
        }
        _ => {
            // Fuzzy mode (default) - case insensitive contains
            let query_lower = search_query.to_lowercase();
            all_objects
                .into_iter()
                .filter(|obj| {
                    // Extract filename from key
                    let filename = obj.key.split('/').last().unwrap_or(&obj.key);
                    filename.to_lowercase().contains(&query_lower)
                })
                .collect()
        }
    };

    println!("[search_objects] Found {} matching objects", filtered.len());
    Ok(filtered)
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[derive(Deserialize)]
struct UploadParams {
    bucket: String,
    key: String,
    // Base64 encoded content
    content_base64: String,
    content_type: Option<String>, // MIME type of the content
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[derive(Deserialize)]
struct UploadWithProgressParams {
    bucket: String,
    key: String,
    // Base64 encoded content
    content_base64: String,
    upload_id: String,            // Unique ID for this upload to track progress
    content_type: Option<String>, // MIME type of the content
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

// Desktop run function
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
    use tauri_plugin_opener::OpenerExt;

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
            search_objects,
            create_folder,
            delete_object,
            upload_object,
            upload_object_with_progress,
            get_object_url,
            download_object,
            get_bucket_details
        ])
        .setup(|app| {
            // Create Configuration Guide menu item
            let config_guide =
                MenuItemBuilder::with_id("config_guide", "Configuration Guide").build(app)?;

            // Create Help submenu with custom item
            let help_menu = SubmenuBuilder::new(app, "Help")
                .item(&config_guide)
                .build()?;

            // Build the menu bar with standard macOS menus
            #[cfg(target_os = "macos")]
            {
                // macOS standard menus
                let app_menu = SubmenuBuilder::new(app, "S3 File Viewer")
                    .item(&PredefinedMenuItem::about(app, None, None)?)
                    .separator()
                    .item(&PredefinedMenuItem::hide(app, None)?)
                    .item(&PredefinedMenuItem::hide_others(app, None)?)
                    .item(&PredefinedMenuItem::show_all(app, None)?)
                    .separator()
                    .item(&PredefinedMenuItem::quit(app, None)?)
                    .build()?;

                let edit_menu = SubmenuBuilder::new(app, "Edit")
                    .item(&PredefinedMenuItem::undo(app, None)?)
                    .item(&PredefinedMenuItem::redo(app, None)?)
                    .separator()
                    .item(&PredefinedMenuItem::cut(app, None)?)
                    .item(&PredefinedMenuItem::copy(app, None)?)
                    .item(&PredefinedMenuItem::paste(app, None)?)
                    .item(&PredefinedMenuItem::select_all(app, None)?)
                    .build()?;

                let view_menu = SubmenuBuilder::new(app, "View")
                    .item(&PredefinedMenuItem::fullscreen(app, None)?)
                    .build()?;

                let window_menu = SubmenuBuilder::new(app, "Window")
                    .item(&PredefinedMenuItem::minimize(app, None)?)
                    .item(&PredefinedMenuItem::maximize(app, None)?)
                    .separator()
                    .item(&PredefinedMenuItem::close_window(app, None)?)
                    .build()?;

                let menu = MenuBuilder::new(app)
                    .item(&app_menu)
                    .item(&edit_menu)
                    .item(&view_menu)
                    .item(&window_menu)
                    .item(&help_menu)
                    .build()?;

                app.set_menu(menu)?;
            }

            #[cfg(not(target_os = "macos"))]
            {
                // Windows/Linux menus
                let file_menu = SubmenuBuilder::new(app, "File")
                    .item(&PredefinedMenuItem::quit(app, None)?)
                    .build()?;

                let edit_menu = SubmenuBuilder::new(app, "Edit")
                    .item(&PredefinedMenuItem::undo(app, None)?)
                    .item(&PredefinedMenuItem::redo(app, None)?)
                    .separator()
                    .item(&PredefinedMenuItem::cut(app, None)?)
                    .item(&PredefinedMenuItem::copy(app, None)?)
                    .item(&PredefinedMenuItem::paste(app, None)?)
                    .item(&PredefinedMenuItem::select_all(app, None)?)
                    .build()?;

                let view_menu = SubmenuBuilder::new(app, "View")
                    .item(&PredefinedMenuItem::fullscreen(app, None)?)
                    .build()?;

                let menu = MenuBuilder::new(app)
                    .item(&file_menu)
                    .item(&edit_menu)
                    .item(&view_menu)
                    .item(&help_menu)
                    .build()?;

                app.set_menu(menu)?;
            }

            // Handle menu events
            app.on_menu_event(move |app_handle, event| {
                if event.id() == "config_guide" {
                    println!("[menu] Configuration Guide clicked");
                    // Use the opener plugin to open URL
                    let url = "https://s3-file-viewer.moonrailgun.com/configuration-guide.html";
                    if let Err(e) = app_handle.opener().open_url(url, None::<&str>) {
                        eprintln!("[menu] Failed to open URL: {}", e);
                    } else {
                        println!("[menu] Successfully opened URL: {}", url);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

#[cfg(not(any(target_os = "ios", target_os = "android")))]
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

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[tauri::command]
async fn get_bucket_details(
    bucket: String,
    state: tauri::State<'_, tokio::sync::Mutex<Option<AppState>>>,
) -> Result<BucketDetails, String> {
    println!(
        "[get_bucket_details] Fetching details for bucket: {}",
        bucket
    );

    let guard = state.lock().await;
    let app = guard.as_ref().ok_or("Not connected")?;

    // Get versioning status
    let (versioning_enabled, versioning_status) = match app
        .s3_client
        .get_bucket_versioning()
        .bucket(&bucket)
        .send()
        .await
    {
        Ok(resp) => {
            let status = resp.status().map(|s| s.as_str().to_string());
            let enabled = status.as_ref().map(|s| s == "Enabled").unwrap_or(false);
            (enabled, status)
        }
        Err(e) => {
            eprintln!("[get_bucket_details] get_bucket_versioning failed: {}", e);
            (false, None)
        }
    };

    // Get encryption configuration
    let (encryption_enabled, encryption_type) = match app
        .s3_client
        .get_bucket_encryption()
        .bucket(&bucket)
        .send()
        .await
    {
        Ok(resp) => {
            if let Some(rules) = resp
                .server_side_encryption_configuration()
                .and_then(|config| config.rules().first())
            {
                let enc_type = rules
                    .apply_server_side_encryption_by_default()
                    .map(|default| default.sse_algorithm().as_str().to_string());
                (true, enc_type)
            } else {
                (false, None)
            }
        }
        Err(e) => {
            eprintln!("[get_bucket_details] get_bucket_encryption failed: {}", e);
            (false, None)
        }
    };

    // Get public access block configuration
    let (block_public_acls, ignore_public_acls, block_public_policy, restrict_public_buckets) =
        match app
            .s3_client
            .get_public_access_block()
            .bucket(&bucket)
            .send()
            .await
        {
            Ok(resp) => {
                if let Some(config) = resp.public_access_block_configuration() {
                    (
                        config.block_public_acls(),
                        config.ignore_public_acls(),
                        config.block_public_policy(),
                        config.restrict_public_buckets(),
                    )
                } else {
                    (None, None, None, None)
                }
            }
            Err(e) => {
                eprintln!("[get_bucket_details] get_public_access_block failed: {}", e);
                (None, None, None, None)
            }
        };

    // Get lifecycle rules count
    let lifecycle_rules_count = match app
        .s3_client
        .get_bucket_lifecycle_configuration()
        .bucket(&bucket)
        .send()
        .await
    {
        Ok(resp) => resp.rules().len(),
        Err(e) => {
            eprintln!(
                "[get_bucket_details] get_bucket_lifecycle_configuration failed: {}",
                e
            );
            0
        }
    };

    // Get tags count
    let tags_count = match app
        .s3_client
        .get_bucket_tagging()
        .bucket(&bucket)
        .send()
        .await
    {
        Ok(resp) => resp.tag_set().len(),
        Err(e) => {
            eprintln!("[get_bucket_details] get_bucket_tagging failed: {}", e);
            0
        }
    };

    // Get CORS configuration
    let cors_enabled = match app.s3_client.get_bucket_cors().bucket(&bucket).send().await {
        Ok(resp) => resp.cors_rules().len() > 0,
        Err(e) => {
            eprintln!("[get_bucket_details] get_bucket_cors failed: {}", e);
            false
        }
    };

    // Get logging configuration
    let (logging_enabled, logging_target_bucket) = match app
        .s3_client
        .get_bucket_logging()
        .bucket(&bucket)
        .send()
        .await
    {
        Ok(resp) => {
            if let Some(logging) = resp.logging_enabled() {
                let target = Some(logging.target_bucket().to_string());
                (true, target)
            } else {
                (false, None)
            }
        }
        Err(e) => {
            eprintln!("[get_bucket_details] get_bucket_logging failed: {}", e);
            (false, None)
        }
    };

    let details = BucketDetails {
        versioning_enabled,
        versioning_status,
        encryption_enabled,
        encryption_type,
        block_public_acls,
        ignore_public_acls,
        block_public_policy,
        restrict_public_buckets,
        lifecycle_rules_count,
        tags_count,
        cors_enabled,
        logging_enabled,
        logging_target_bucket,
    };

    println!(
        "[get_bucket_details] Successfully fetched details for bucket: {}",
        bucket
    );
    Ok(details)
}

// Mobile platform simple run function
#[cfg(any(target_os = "ios", target_os = "android"))]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // No S3 commands on mobile - they would all fail anyway
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
