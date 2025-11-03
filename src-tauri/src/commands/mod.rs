pub mod file_ops;
pub mod compress;

// Re-export all commands for easy access
pub use file_ops::{
    select_folder,
    select_files,
    open_in_explorer,
    get_default_output_folder,
    validate_paths,
    get_app_directories,
    ensure_directory_exists,
    check_path_exists,
};

pub use compress::{
    analyze_images,
    compress_images,
    estimate_savings,
    cancel_compression,
    get_default_config,
    get_system_info,
};