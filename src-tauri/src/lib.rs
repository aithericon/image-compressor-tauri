use std::path::PathBuf;
use tauri::Manager;

// Module declarations
mod compression;
mod commands;

// Import all commands
use commands::{
    file_ops::{
        select_folder, select_files, open_in_explorer, get_default_output_folder,
        validate_paths, get_app_directories, ensure_directory_exists, check_path_exists,
    },
    compress::{
        analyze_images, compress_images, estimate_savings, cancel_compression,
        get_default_config, get_system_info,
    },
};

// Example Tauri command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to your Tauri app!", name)
}

// Example Tauri command for getting app version
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Set up Tauri Stronghold plugin for secure storage
            // This demonstrates how to add secure encrypted storage to your app
            let salt_path = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("."))
                .join("stronghold_salt.txt");

            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            // Initialize dialog plugin for file/folder selection
            app.handle().plugin(tauri_plugin_dialog::init())?;

            // Initialize shell plugin for opening in explorer
            app.handle().plugin(tauri_plugin_shell::init())?;

            // Initialize fs plugin for file system operations
            app.handle().plugin(tauri_plugin_fs::init())?;

            // Optional: Enable logging in development mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .targets([
                            tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                            tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                                file_name: None,
                            }),
                        ])
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_version,
            // File operations commands
            select_folder,
            select_files,
            open_in_explorer,
            get_default_output_folder,
            validate_paths,
            get_app_directories,
            ensure_directory_exists,
            check_path_exists,
            // Compression commands
            analyze_images,
            compress_images,
            estimate_savings,
            cancel_compression,
            get_default_config,
            get_system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
