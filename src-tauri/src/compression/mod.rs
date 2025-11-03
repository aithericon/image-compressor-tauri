pub mod types;
pub mod analyzer;
pub mod processor;

// Re-export commonly used types
pub use types::{
    CompressionConfig,
    CompressResult,
    ImageInfo,
    ImageError,
    ProgressUpdate,
    PathValidation,
};

pub use analyzer::{
    analyze_image,
    analyze_images,
    validate_paths,
    is_valid_image,
    has_valid_extension,
};

pub use processor::{
    compress_images,
    compress_folder,
};