use std::path::{Path, PathBuf};
use std::fs;
use std::time::Instant;
use tokio::sync::mpsc;
use image_compressor::{Factor, FolderCompressor, compressor::Compressor};
use walkdir::WalkDir;

use super::types::{CompressionConfig, CompressResult, ImageError, ProgressUpdate};
use super::analyzer::{has_valid_extension, is_valid_image};

/// Compress images based on configuration
pub async fn compress_images(
    config: CompressionConfig,
    progress_tx: mpsc::Sender<ProgressUpdate>,
) -> Result<CompressResult, String> {
    // Validate configuration
    config.validate()?;

    let start_time = Instant::now();
    let mut result = CompressResult::new();

    // Create output directory if it doesn't exist
    let output_path = Path::new(&config.output_folder);
    fs::create_dir_all(output_path)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    // Collect all image files to process
    let files_to_process = collect_image_files(&config.source_paths)?;
    result.total = files_to_process.len();

    if files_to_process.is_empty() {
        return Err("No valid image files found to compress".to_string());
    }

    // Create compression factor
    let factor = Factor::new(config.quality, config.size_ratio);

    // Process files in batches using thread pool
    let chunk_size = (files_to_process.len() / config.thread_count).max(1);
    let chunks: Vec<_> = files_to_process.chunks(chunk_size).collect();

    // Process each chunk
    for (chunk_idx, chunk) in chunks.iter().enumerate() {
        for (file_idx, file_path) in chunk.iter().enumerate() {
            let current_index = chunk_idx * chunk_size + file_idx + 1;

            // Send progress update
            let filename = file_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            let _ = progress_tx.send(ProgressUpdate::new(
                current_index,
                result.total,
                filename.clone(),
            )).await;

            // Determine output path
            let output_file_path = get_output_path(
                file_path,
                &output_path,
                config.preserve_structure,
                &config.source_paths,
            )?;

            // Ensure output directory exists
            if let Some(parent) = output_file_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create output subdirectory: {}", e))?;
            }

            // Get original file size
            let original_size = fs::metadata(file_path)
                .map(|m| m.len())
                .unwrap_or(0);

            // Compress the image
            match compress_single_image(file_path, &output_file_path, factor) {
                Ok(compressed_size) => {
                    let saved = original_size.saturating_sub(compressed_size);
                    result.add_success(saved);

                    log::info!(
                        "Compressed {} -> {} (saved {} bytes)",
                        file_path.display(),
                        output_file_path.display(),
                        saved
                    );
                }
                Err(e) => {
                    let error = ImageError::new(
                        file_path.display().to_string(),
                        e,
                    );
                    result.add_error(error.clone());

                    log::error!(
                        "Failed to compress {}: {}",
                        file_path.display(),
                        error.error
                    );
                }
            }
        }
    }

    result.duration_ms = start_time.elapsed().as_millis();

    Ok(result)
}

/// Compress a single image file
fn compress_single_image(
    input_path: &Path,
    output_path: &Path,
    factor: Factor,
) -> Result<u64, String> {
    // Validate input
    is_valid_image(input_path)?;

    // Ensure output directory exists
    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;
    }

    // Create compressor - note the API requires the destination to be a directory
    let output_dir = output_path.parent().unwrap_or_else(|| Path::new("."));
    let mut compressor = Compressor::new(input_path.to_path_buf(), output_dir.to_path_buf());

    // Set the factor
    compressor.set_factor(factor);

    // Perform compression
    compressor
        .compress_to_jpg()
        .map_err(|e| format!("Compression failed: {:?}", e))?;

    // The compressor creates the file with the same name but .jpg extension in the output dir
    // We need to rename it to our desired output path if different
    let expected_output = output_dir.join(
        input_path.file_stem()
            .ok_or("Invalid input filename")?
    ).with_extension("jpg");

    if expected_output != output_path {
        fs::rename(&expected_output, output_path)
            .map_err(|e| format!("Failed to rename output file: {}", e))?;
    }

    // Get compressed file size
    fs::metadata(output_path)
        .map(|m| m.len())
        .map_err(|e| format!("Failed to read compressed file size: {}", e))
}

/// Compress entire folder using FolderCompressor
pub async fn compress_folder(
    input_folder: &Path,
    output_folder: &Path,
    config: CompressionConfig,
    progress_tx: mpsc::Sender<ProgressUpdate>,
) -> Result<CompressResult, String> {
    let start_time = Instant::now();
    let mut result = CompressResult::new();

    // Create output directory
    fs::create_dir_all(output_folder)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    // Count total files first
    let total_files: Vec<_> = WalkDir::new(input_folder)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file() && has_valid_extension(e.path()))
        .collect();

    result.total = total_files.len();

    if total_files.is_empty() {
        return Err("No valid image files found in folder".to_string());
    }

    // Create folder compressor
    let factor = Factor::new(config.quality, config.size_ratio);
    let mut folder_compressor = FolderCompressor::new(
        input_folder.to_path_buf(),
        output_folder.to_path_buf(),
    );

    // Set the factor and thread count
    folder_compressor.set_factor(factor);
    folder_compressor.set_thread_count(config.thread_count as u32);

    // Process with progress updates
    for (index, entry) in total_files.iter().enumerate() {
        let filename = entry.file_name().to_string_lossy().to_string();

        let _ = progress_tx.send(ProgressUpdate::new(
            index + 1,
            result.total,
            filename.clone(),
        )).await;

        // Note: image_compressor's FolderCompressor processes all at once
        // We're simulating progress here, actual compression happens below
    }

    // Perform actual compression
    match folder_compressor.compress() {
        Ok(()) => {
            // Calculate total saved bytes
            for entry in total_files {
                let original_size = fs::metadata(entry.path())
                    .map(|m| m.len())
                    .unwrap_or(0);

                let output_path = output_folder.join(
                    entry.path()
                        .strip_prefix(input_folder)
                        .unwrap_or(entry.path())
                        .with_extension("jpg")
                );

                if output_path.exists() {
                    let compressed_size = fs::metadata(&output_path)
                        .map(|m| m.len())
                        .unwrap_or(original_size);

                    let saved = original_size.saturating_sub(compressed_size);
                    result.add_success(saved);
                } else {
                    result.add_error(ImageError::new(
                        entry.path().display().to_string(),
                        "Output file not found after compression".to_string(),
                    ));
                }
            }
        }
        Err(e) => {
            return Err(format!("Folder compression failed: {:?}", e));
        }
    }

    result.duration_ms = start_time.elapsed().as_millis();

    Ok(result)
}

/// Collect all image files from the given paths
fn collect_image_files(paths: &[String]) -> Result<Vec<PathBuf>, String> {
    let mut files = Vec::new();

    for path_str in paths {
        let path = Path::new(path_str);

        if !path.exists() {
            log::warn!("Path does not exist: {}", path_str);
            continue;
        }

        if path.is_dir() {
            // Recursively find all image files in directory
            for entry in WalkDir::new(path)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().is_file())
            {
                if has_valid_extension(entry.path()) {
                    files.push(entry.path().to_path_buf());
                }
            }
        } else if path.is_file() && has_valid_extension(path) {
            files.push(path.to_path_buf());
        }
    }

    Ok(files)
}

/// Determine output path for a compressed image
fn get_output_path(
    input_path: &Path,
    output_base: &Path,
    preserve_structure: bool,
    source_paths: &[String],
) -> Result<PathBuf, String> {
    let mut output_path = if preserve_structure {
        // Try to find the common parent from source_paths
        if let Some(common_parent) = find_common_parent(input_path, source_paths) {
            let relative = input_path
                .strip_prefix(&common_parent)
                .unwrap_or(input_path);
            output_base.join(relative)
        } else {
            // Fallback to just filename
            output_base.join(
                input_path
                    .file_name()
                    .ok_or_else(|| "Invalid input filename".to_string())?
            )
        }
    } else {
        // Put all files directly in output folder
        output_base.join(
            input_path
                .file_name()
                .ok_or_else(|| "Invalid input filename".to_string())?
        )
    };

    // Change extension to .jpg
    output_path.set_extension("jpg");

    // Handle naming conflicts
    output_path = get_unique_filename(output_path);

    Ok(output_path)
}

/// Find common parent directory from source paths
fn find_common_parent(file_path: &Path, source_paths: &[String]) -> Option<PathBuf> {
    for source in source_paths {
        let source_path = Path::new(source);
        if source_path.is_dir() && file_path.starts_with(source_path) {
            return Some(source_path.to_path_buf());
        }
    }
    None
}

/// Get a unique filename by appending numbers if necessary
fn get_unique_filename(path: PathBuf) -> PathBuf {
    if !path.exists() {
        return path;
    }

    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("image")
        .to_string();  // Convert to owned String

    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg")
        .to_string();  // Convert to owned String

    let parent = path.parent().unwrap_or_else(|| Path::new(".")).to_path_buf();

    let mut counter = 1;
    loop {
        let new_path = parent.join(format!("{}_{}.{}", stem, counter, extension));
        if !new_path.exists() {
            return new_path;
        }
        counter += 1;

        // Prevent infinite loop
        if counter > 10000 {
            return parent.join(format!("{}_{}.{}", stem, uuid::Uuid::new_v4(), extension));
        }
    }
}