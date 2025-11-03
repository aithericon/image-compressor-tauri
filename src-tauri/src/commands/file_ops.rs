use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_shell::ShellExt;

use crate::compression::{PathValidation, validate_paths as validate_paths_internal};

/// Open a folder selection dialog
#[tauri::command]
pub async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    app.dialog()
        .file()
        .pick_folder(move |folder_path| {
            let _ = tx.send(folder_path);
        });

    // Wait for the dialog result
    let result = rx.recv()
        .map_err(|e| format!("Failed to receive dialog result: {}", e))?;

    Ok(result.map(|path| path.to_string()))
}

/// Open a file selection dialog for multiple images
#[tauri::command]
pub async fn select_files(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    app.dialog()
        .file()
        .add_filter("Image Files", &["jpg", "jpeg", "png", "bmp", "gif", "webp", "tiff", "tif", "ico"])
        .add_filter("JPEG Images", &["jpg", "jpeg"])
        .add_filter("PNG Images", &["png"])
        .add_filter("BMP Images", &["bmp"])
        .add_filter("GIF Images", &["gif"])
        .add_filter("WebP Images", &["webp"])
        .add_filter("All Files", &["*"])
        .pick_files(move |file_paths| {
            let _ = tx.send(file_paths);
        });

    // Wait for the dialog result
    let result = rx.recv()
        .map_err(|e| format!("Failed to receive dialog result: {}", e))?;

    // Convert paths to strings
    let paths = result
        .unwrap_or_default()
        .into_iter()
        .map(|path| path.to_string())
        .collect();

    Ok(paths)
}

/// Open a path in the system's file explorer
#[tauri::command]
pub async fn open_in_explorer(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let shell = app.shell();

    // Determine the command based on the operating system
    #[cfg(target_os = "windows")]
    {
        shell
            .command("explorer")
            .args([&path])
            .spawn()
            .map_err(|e| format!("Failed to open Explorer: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        shell
            .command("open")
            .args([&path])
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try common file managers
        let managers = ["xdg-open", "nautilus", "dolphin", "thunar", "pcmanfm"];
        let mut opened = false;

        for manager in &managers {
            if shell
                .command(manager)
                .args([&path])
                .spawn()
                .is_ok()
            {
                opened = true;
                break;
            }
        }

        if !opened {
            return Err("Failed to open file manager: No suitable file manager found".to_string());
        }
    }

    Ok(())
}

/// Get the default output folder for compressed images
#[tauri::command]
pub fn get_default_output_folder() -> Result<String, String> {
    // Get the user's Documents directory
    let documents_dir = dirs::document_dir()
        .ok_or_else(|| "Could not find Documents directory".to_string())?;

    // Create the CompressedImages subdirectory path
    let output_dir = documents_dir.join("CompressedImages");

    Ok(output_dir.to_string_lossy().to_string())
}

/// Validate if paths exist and are valid images or contain images
#[tauri::command]
pub fn validate_paths(paths: Vec<String>) -> Vec<PathValidation> {
    validate_paths_internal(&paths)
}

/// Get information about the app's directories
#[tauri::command]
pub async fn get_app_directories(app: tauri::AppHandle) -> Result<AppDirectories, String> {
    let path_resolver = app.path();

    Ok(AppDirectories {
        app_data: path_resolver
            .app_data_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        app_config: path_resolver
            .app_config_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        app_cache: path_resolver
            .app_cache_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        app_log: path_resolver
            .app_log_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        documents: dirs::document_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        pictures: dirs::picture_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        downloads: dirs::download_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
    })
}

/// Application directories structure
#[derive(serde::Serialize)]
pub struct AppDirectories {
    pub app_data: String,
    pub app_config: String,
    pub app_cache: String,
    pub app_log: String,
    pub documents: String,
    pub pictures: String,
    pub downloads: String,
}

/// Create a directory if it doesn't exist
#[tauri::command]
pub fn ensure_directory_exists(path: String) -> Result<(), String> {
    let dir_path = PathBuf::from(&path);

    if !dir_path.exists() {
        std::fs::create_dir_all(&dir_path)
            .map_err(|e| format!("Failed to create directory '{}': {}", path, e))?;
    } else if !dir_path.is_dir() {
        return Err(format!("Path '{}' exists but is not a directory", path));
    }

    Ok(())
}

/// Check if a path exists and whether it's a file or directory
#[tauri::command]
pub fn check_path_exists(path: String) -> PathInfo {
    let path_buf = PathBuf::from(&path);

    PathInfo {
        exists: path_buf.exists(),
        is_file: path_buf.is_file(),
        is_directory: path_buf.is_dir(),
        path,
    }
}

/// Path information structure
#[derive(serde::Serialize)]
pub struct PathInfo {
    pub exists: bool,
    pub is_file: bool,
    pub is_directory: bool,
    pub path: String,
}

// Add dirs crate to Cargo.toml for directory utilities
// We'll update this in the Cargo.toml later