use tauri::{Manager, Emitter};
use tokio::sync::mpsc;

use crate::compression::{
    CompressionConfig,
    CompressResult,
    ImageInfo,
    ProgressUpdate,
    analyze_images as analyze_images_internal,
    compress_images as compress_images_internal,
};

/// Analyze images without compressing them
#[tauri::command]
pub async fn analyze_images(
    paths: Vec<String>,
    quality: Option<f32>,
    size_ratio: Option<f32>,
) -> Result<Vec<ImageInfo>, String> {
    // Use default values if not provided
    let quality = quality.unwrap_or(85.0);
    let size_ratio = size_ratio.unwrap_or(0.8);

    // Validate parameters
    if quality < 0.0 || quality > 100.0 {
        return Err(format!("Quality must be between 0 and 100, got {}", quality));
    }

    if size_ratio < 0.0 || size_ratio > 1.0 {
        return Err(format!("Size ratio must be between 0 and 1, got {}", size_ratio));
    }

    if paths.is_empty() {
        return Err("No paths provided for analysis".to_string());
    }

    // Run analysis in a blocking task
    let result = tokio::task::spawn_blocking(move || {
        analyze_images_internal(&paths, quality, size_ratio)
    })
    .await
    .map_err(|e| format!("Analysis task failed: {}", e))?;

    if result.is_empty() {
        Err("No valid images found in the provided paths".to_string())
    } else {
        Ok(result)
    }
}

/// Main compression function that emits progress events
#[tauri::command]
pub async fn compress_images(
    app: tauri::AppHandle,
    config: CompressionConfig,
) -> Result<CompressResult, String> {
    // Validate configuration
    config.validate()?;

    // Create progress channel
    let (tx, mut rx) = mpsc::channel::<ProgressUpdate>(100);

    // Clone app handle for the progress task
    let app_handle = app.clone();

    // Spawn task to forward progress updates as Tauri events
    let progress_task = tokio::spawn(async move {
        while let Some(progress) = rx.recv().await {
            // Emit progress event to frontend
            let _ = app_handle.emit("compression:progress", &progress);

            log::debug!(
                "Progress: {}/{} ({}%) - {}",
                progress.current,
                progress.total,
                progress.percent,
                progress.current_file
            );
        }
    });

    // Run compression
    let result = compress_images_internal(config, tx).await;

    // Wait for progress task to complete
    let _ = progress_task.await;

    // Emit completion event
    match &result {
        Ok(compress_result) => {
            app.emit("compression:complete", compress_result)
                .map_err(|e| format!("Failed to emit completion event: {}", e))?;

            log::info!(
                "Compression completed: {}/{} successful, {} bytes saved in {}ms",
                compress_result.successful,
                compress_result.total,
                compress_result.saved_bytes,
                compress_result.duration_ms
            );
        }
        Err(error) => {
            log::error!("Compression failed: {}", error);
        }
    }

    result
}

/// Estimate compression savings for a set of images
#[tauri::command]
pub async fn estimate_savings(
    paths: Vec<String>,
    quality: f32,
    size_ratio: f32,
) -> Result<SavingsEstimate, String> {
    // Analyze images to get current sizes and estimated sizes
    let images = analyze_images(paths, Some(quality), Some(size_ratio)).await?;

    if images.is_empty() {
        return Ok(SavingsEstimate {
            total_original: 0,
            total_estimated: 0,
            estimated_savings: 0,
            savings_percentage: 0.0,
            file_count: 0,
        });
    }

    let total_original: u64 = images.iter().map(|img| img.original_size).sum();
    let total_estimated: u64 = images.iter().map(|img| img.estimated_size).sum();
    let estimated_savings = total_original.saturating_sub(total_estimated);

    let savings_percentage = if total_original > 0 {
        (estimated_savings as f32 / total_original as f32) * 100.0
    } else {
        0.0
    };

    Ok(SavingsEstimate {
        total_original,
        total_estimated,
        estimated_savings,
        savings_percentage,
        file_count: images.len(),
    })
}

/// Savings estimate structure
#[derive(serde::Serialize)]
pub struct SavingsEstimate {
    pub total_original: u64,
    pub total_estimated: u64,
    pub estimated_savings: u64,
    pub savings_percentage: f32,
    pub file_count: usize,
}

/// Cancel compression operation (placeholder for future implementation)
#[tauri::command]
pub async fn cancel_compression() -> Result<(), String> {
    // TODO: Implement cancellation mechanism
    // This would involve storing a cancellation token and checking it during processing
    log::info!("Compression cancellation requested");
    Ok(())
}

/// Get default compression configuration
#[tauri::command]
pub fn get_default_config() -> CompressionConfig {
    CompressionConfig {
        source_paths: Vec::new(),
        output_folder: String::new(),
        quality: 85.0,
        size_ratio: 0.8,
        thread_count: num_cpus::get().max(1),
        preserve_structure: false,
    }
}

/// Get system information relevant to compression
#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        cpu_cores: num_cpus::get(),
        cpu_cores_physical: num_cpus::get_physical(),
        recommended_thread_count: calculate_recommended_threads(),
    }
}

/// System information structure
#[derive(serde::Serialize)]
pub struct SystemInfo {
    pub cpu_cores: usize,
    pub cpu_cores_physical: usize,
    pub recommended_thread_count: usize,
}

/// Calculate recommended thread count based on system capabilities
fn calculate_recommended_threads() -> usize {
    let cores = num_cpus::get();

    // Leave at least one core for the UI and system
    if cores > 4 {
        cores - 1
    } else if cores > 2 {
        cores - 1
    } else {
        1
    }
}