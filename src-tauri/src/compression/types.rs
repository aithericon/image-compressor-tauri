use serde::{Deserialize, Serialize};

/// Configuration for image compression operations
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CompressionConfig {
    pub source_paths: Vec<String>,
    pub output_folder: String,
    pub quality: f32,        // 0-100
    pub size_ratio: f32,     // 0-1
    pub thread_count: usize,
    pub preserve_structure: bool,  // Keep folder structure
}

impl CompressionConfig {
    pub fn validate(&self) -> Result<(), String> {
        if self.source_paths.is_empty() {
            return Err("No source paths provided".to_string());
        }

        if self.output_folder.is_empty() {
            return Err("No output folder specified".to_string());
        }

        if self.quality < 0.0 || self.quality > 100.0 {
            return Err(format!("Quality must be between 0 and 100, got {}", self.quality));
        }

        if self.size_ratio < 0.0 || self.size_ratio > 1.0 {
            return Err(format!("Size ratio must be between 0 and 1, got {}", self.size_ratio));
        }

        if self.thread_count == 0 {
            return Err("Thread count must be at least 1".to_string());
        }

        Ok(())
    }
}

/// Information about an image file
#[derive(Serialize, Clone, Debug)]
pub struct ImageInfo {
    pub path: String,
    pub filename: String,
    pub original_size: u64,      // bytes
    pub estimated_size: u64,     // estimated after compression
    pub format: String,          // PNG, JPEG, BMP, etc.
    pub width: u32,
    pub height: u32,
    pub thumbnail: Option<String>, // base64 encoded thumbnail
}

/// Result of a compression operation
#[derive(Serialize, Clone, Debug)]
pub struct CompressResult {
    pub total: usize,
    pub successful: usize,
    pub failed: usize,
    pub saved_bytes: u64,
    pub errors: Vec<ImageError>,
    pub duration_ms: u128,
}

impl CompressResult {
    pub fn new() -> Self {
        Self {
            total: 0,
            successful: 0,
            failed: 0,
            saved_bytes: 0,
            errors: Vec::new(),
            duration_ms: 0,
        }
    }

    pub fn add_success(&mut self, saved: u64) {
        self.successful += 1;
        self.saved_bytes += saved;
    }

    pub fn add_error(&mut self, error: ImageError) {
        self.failed += 1;
        self.errors.push(error);
    }
}

/// Error information for a specific image
#[derive(Serialize, Clone, Debug)]
pub struct ImageError {
    pub path: String,
    pub filename: String,
    pub error: String,
}

impl ImageError {
    pub fn new(path: String, error: String) -> Self {
        let filename = std::path::Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        Self {
            path,
            filename,
            error,
        }
    }
}

/// Progress update during batch processing
#[derive(Serialize, Clone, Debug)]
pub struct ProgressUpdate {
    pub current: usize,
    pub total: usize,
    pub current_file: String,
    pub percent: f32,
}

impl ProgressUpdate {
    pub fn new(current: usize, total: usize, current_file: String) -> Self {
        let percent = if total > 0 {
            (current as f32 / total as f32) * 100.0
        } else {
            0.0
        };

        Self {
            current,
            total,
            current_file,
            percent,
        }
    }
}

/// Path validation result
#[derive(Serialize, Clone, Debug)]
pub struct PathValidation {
    pub path: String,
    pub is_valid: bool,
    pub error: Option<String>,
}

impl PathValidation {
    pub fn valid(path: String) -> Self {
        Self {
            path,
            is_valid: true,
            error: None,
        }
    }

    pub fn invalid(path: String, error: String) -> Self {
        Self {
            path,
            is_valid: false,
            error: Some(error),
        }
    }
}