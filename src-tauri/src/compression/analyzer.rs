use std::path::Path;
use std::fs;
use std::io;
use image::{DynamicImage, ImageFormat};
use image::imageops::FilterType;
use walkdir::WalkDir;
use base64::{Engine as _, engine::general_purpose};

use super::types::{ImageInfo, PathValidation};

/// Supported image extensions
const SUPPORTED_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "bmp", "gif", "webp", "tiff", "tif", "ico"];

/// Default thumbnail size in pixels
const THUMBNAIL_SIZE: u32 = 64;

/// Generate a thumbnail from an image and return it as a base64-encoded data URI
fn generate_thumbnail(img: &DynamicImage) -> Result<String, String> {
    // Resize to thumbnail size (maintaining aspect ratio)
    // Using Triangle filter for better performance while maintaining decent quality
    let thumbnail = img.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, FilterType::Triangle);

    // Convert to PNG bytes
    let mut png_bytes = Vec::new();
    thumbnail.write_to(&mut io::Cursor::new(&mut png_bytes), ImageFormat::Png)
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;

    // Encode as base64
    let base64_string = general_purpose::STANDARD.encode(&png_bytes);

    Ok(format!("data:image/png;base64,{}", base64_string))
}

/// Check if a file has a valid image extension
pub fn has_valid_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| SUPPORTED_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

/// Validate if a file is a valid image
pub fn is_valid_image(path: &Path) -> Result<(), String> {
    // Check if file exists
    if !path.exists() {
        return Err(format!("File does not exist: {}", path.display()));
    }

    // Check if it's a file (not a directory)
    if !path.is_file() {
        return Err(format!("Path is not a file: {}", path.display()));
    }

    // Check extension
    if !has_valid_extension(path) {
        return Err(format!(
            "Unsupported file extension. Supported formats: {}",
            SUPPORTED_EXTENSIONS.join(", ")
        ));
    }

    // Try to open as image to verify it's actually valid
    match image::open(path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Invalid or corrupted image file: {}", e)),
    }
}

/// Analyze a single image file and extract metadata
pub fn analyze_image(path: &Path, quality: f32, size_ratio: f32) -> Result<ImageInfo, String> {
    // Validate the image first
    is_valid_image(path)?;

    // Get file metadata
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    let original_size = metadata.len();

    // Open the image to get dimensions and format
    let img = image::open(path)
        .map_err(|e| format!("Failed to open image: {}", e))?;

    let (width, height) = (img.width(), img.height());

    // Detect format
    let format = detect_format(path, &img);

    // Estimate compressed size
    let estimated_size = estimate_compressed_size(original_size, &format, quality, size_ratio);

    // Generate thumbnail - use .ok() to make it optional (won't fail the entire analysis)
    let thumbnail = generate_thumbnail(&img).ok();

    // Extract filename
    let filename = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    Ok(ImageInfo {
        path: path.display().to_string(),
        filename,
        original_size,
        estimated_size,
        format,
        width,
        height,
        thumbnail,
    })
}

/// Detect image format from path and image data
fn detect_format(path: &Path, _img: &DynamicImage) -> String {
    // Try to detect from extension first
    if let Some(format) = path.extension()
        .and_then(|ext| ext.to_str())
        .and_then(|ext| match ext.to_lowercase().as_str() {
            "jpg" | "jpeg" => Some("JPEG"),
            "png" => Some("PNG"),
            "bmp" => Some("BMP"),
            "gif" => Some("GIF"),
            "webp" => Some("WEBP"),
            "tiff" | "tif" => Some("TIFF"),
            "ico" => Some("ICO"),
            _ => None,
        }) {
        return format.to_string();
    }

    // Fallback to unknown if we can't determine from extension
    "UNKNOWN".to_string()
}


/// Estimate compressed size based on quality and size ratio
pub fn estimate_compressed_size(original_size: u64, format: &str, quality: f32, size_ratio: f32) -> u64 {
    // Base compression factor depends on the source format
    let base_factor = match format {
        "BMP" | "TIFF" => 0.15,  // Uncompressed formats compress well
        "PNG" => 0.4,             // Lossless format to lossy
        "GIF" => 0.5,             // Already compressed but inefficient
        "JPEG" => 0.8,            // Already compressed, less savings
        "WEBP" => 0.85,           // Already well compressed
        _ => 0.5,                 // Default estimate
    };

    // Adjust based on quality setting (0-100)
    let quality_factor = 0.3 + (quality as f64 / 100.0 * 0.6);  // Range from 0.3 to 0.9

    // Apply both factors and size ratio
    let estimated = (original_size as f64 * base_factor * quality_factor * size_ratio as f64) as u64;

    // Ensure we don't estimate 0 bytes or more than original
    estimated.max(1024).min(original_size)
}

/// Analyze multiple image paths
pub fn analyze_images(paths: &[String], quality: f32, size_ratio: f32) -> Vec<ImageInfo> {
    let mut results = Vec::new();

    for path_str in paths {
        let path = Path::new(path_str);

        if path.is_dir() {
            // Scan directory for images
            for entry in WalkDir::new(path)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().is_file())
            {
                if has_valid_extension(entry.path()) {
                    if let Ok(info) = analyze_image(entry.path(), quality, size_ratio) {
                        results.push(info);
                    }
                }
            }
        } else {
            // Single file
            if let Ok(info) = analyze_image(path, quality, size_ratio) {
                results.push(info);
            }
        }
    }

    results
}

/// Validate multiple paths
pub fn validate_paths(paths: &[String]) -> Vec<PathValidation> {
    paths.iter().map(|path_str| {
        let path = Path::new(path_str);

        if !path.exists() {
            PathValidation::invalid(
                path_str.clone(),
                "Path does not exist".to_string()
            )
        } else if path.is_dir() {
            // Check if directory contains any images
            let has_images = WalkDir::new(path)
                .into_iter()
                .filter_map(|e| e.ok())
                .any(|e| e.file_type().is_file() && has_valid_extension(e.path()));

            if has_images {
                PathValidation::valid(path_str.clone())
            } else {
                PathValidation::invalid(
                    path_str.clone(),
                    "Directory contains no valid image files".to_string()
                )
            }
        } else {
            // Single file validation
            match is_valid_image(path) {
                Ok(()) => PathValidation::valid(path_str.clone()),
                Err(e) => PathValidation::invalid(path_str.clone(), e),
            }
        }
    }).collect()
}