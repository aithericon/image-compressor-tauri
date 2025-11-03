/**
 * Type-safe wrappers for Tauri commands.
 * These functions provide a clean interface to the Rust backend.
 */

import { invoke } from '@tauri-apps/api/core';
import type {
	CompressionConfig,
	ImageInfo,
	CompressResult,
	PathValidation
} from '$lib/types/compression';

/**
 * Opens a folder picker dialog and returns the selected folder path.
 *
 * @returns Selected folder path, or null if cancelled
 * @throws Error if the dialog fails to open
 *
 * @example
 * const folder = await selectFolder();
 * if (folder) {
 *   console.log('Selected:', folder);
 * }
 */
export async function selectFolder(): Promise<string | null> {
	return await invoke<string | null>('select_folder');
}

/**
 * Opens a file picker dialog for selecting multiple image files.
 * Only allows selection of supported image formats.
 *
 * @returns Array of selected file paths
 * @throws Error if the dialog fails to open
 *
 * @example
 * const files = await selectFiles();
 * console.log(`Selected ${files.length} files`);
 */
export async function selectFiles(): Promise<string[]> {
	return await invoke<string[]>('select_files');
}

/**
 * Analyzes the specified image files and returns metadata for each.
 * This includes size, format, dimensions, and estimated compressed size.
 *
 * @param paths - Array of file paths to analyze
 * @returns Array of ImageInfo objects with metadata
 * @throws Error if analysis fails
 *
 * @example
 * const images = await analyzeImages(['/path/to/image1.png', '/path/to/image2.jpg']);
 * images.forEach(img => {
 *   console.log(`${img.filename}: ${img.format}, ${img.original_size} bytes`);
 * });
 */
export async function analyzeImages(paths: string[]): Promise<ImageInfo[]> {
	return await invoke<ImageInfo[]>('analyze_images', { paths });
}

/**
 * Compresses the specified images according to the provided configuration.
 * Emits 'compression:progress' events during processing.
 *
 * @param config - Compression configuration
 * @returns Result object with statistics and any errors
 * @throws Error if compression fails catastrophically
 *
 * @example
 * const result = await compressImages({
 *   source_paths: ['/path/to/image.png'],
 *   output_folder: '/path/to/output',
 *   quality: 85,
 *   size_ratio: 0.8,
 *   thread_count: 4,
 *   preserve_structure: false
 * });
 * console.log(`Compressed ${result.successful} of ${result.total} images`);
 */
export async function compressImages(config: CompressionConfig): Promise<CompressResult> {
	return await invoke<CompressResult>('compress_images', { config });
}

/**
 * Opens the specified folder in the system's file explorer.
 * Works cross-platform (Windows Explorer, macOS Finder, Linux file manager).
 *
 * @param path - Folder path to open
 * @throws Error if the folder doesn't exist or can't be opened
 *
 * @example
 * await openInExplorer('/path/to/compressed/images');
 */
export async function openInExplorer(path: string): Promise<void> {
	await invoke('open_in_explorer', { path });
}

/**
 * Gets the default output folder path for the current platform.
 * Typically ~/Documents/CompressedImages.
 *
 * @returns Default output folder path
 * @throws Error if the path can't be determined
 *
 * @example
 * const defaultFolder = await getDefaultOutputFolder();
 * console.log('Default output:', defaultFolder);
 */
export async function getDefaultOutputFolder(): Promise<string> {
	return await invoke<string>('get_default_output_folder');
}

/**
 * Validates that the specified paths exist and are valid image files.
 *
 * @param paths - Array of file paths to validate
 * @returns Array of validation results
 * @throws Error if validation fails
 *
 * @example
 * const validations = await validatePaths(['/path/to/file1.png', '/path/to/file2.jpg']);
 * const allValid = validations.every(v => v.is_valid);
 */
export async function validatePaths(paths: string[]): Promise<PathValidation[]> {
	return await invoke<PathValidation[]>('validate_paths', { paths });
}
