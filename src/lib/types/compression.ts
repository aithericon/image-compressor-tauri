/**
 * Type definitions for image compression operations.
 * These types mirror the Rust backend types and provide type safety
 * throughout the frontend application.
 */

/**
 * Configuration object for image compression operations.
 * This defines all the parameters needed to compress a batch of images.
 */
export interface CompressionConfig {
	/** Array of file paths to compress */
	source_paths: string[];
	/** Target folder path for compressed images */
	output_folder: string;
	/** Compression quality (0-100, where 100 is highest quality) */
	quality: number;
	/** Size ratio for compression (0-1, where 1 is original size) */
	size_ratio: number;
	/** Number of threads to use for parallel processing */
	thread_count: number;
	/** Whether to preserve the original folder structure in output */
	preserve_structure: boolean;
}

/**
 * Information about a single image file.
 * Returned from image analysis before compression.
 */
export interface ImageInfo {
	/** Full file path */
	path: string;
	/** Just the filename */
	filename: string;
	/** Original file size in bytes */
	original_size: number;
	/** Estimated compressed size in bytes */
	estimated_size: number;
	/** Image format (e.g., "PNG", "JPEG", "BMP") */
	format: string;
	/** Image width in pixels */
	width: number;
	/** Image height in pixels */
	height: number;
	/** Base64-encoded thumbnail data URL (optional) */
	thumbnail?: string;
}

/**
 * Result object returned after a compression operation completes.
 * Contains statistics and any errors that occurred.
 */
export interface CompressResult {
	/** Total number of images processed */
	total: number;
	/** Number of successfully compressed images */
	successful: number;
	/** Number of images that failed to compress */
	failed: number;
	/** Total bytes saved (original size - compressed size) */
	saved_bytes: number;
	/** Array of errors that occurred during compression */
	errors: ImageError[];
	/** Time taken to complete compression in milliseconds */
	duration_ms: number;
}

/**
 * Information about an error that occurred during compression.
 */
export interface ImageError {
	/** Path to the image that failed */
	path: string;
	/** Filename of the image that failed */
	filename: string;
	/** Error message describing what went wrong */
	error: string;
}

/**
 * Progress update emitted during batch compression.
 * Used to update the UI with real-time progress.
 */
export interface ProgressUpdate {
	/** Current image being processed (1-based index) */
	current: number;
	/** Total number of images to process */
	total: number;
	/** Filename of the current image being processed */
	current_file: string;
	/** Progress percentage (0-100) */
	percent: number;
}

/**
 * Progress update emitted during image analysis.
 * Used to show analysis progress when loading large folders.
 */
export interface AnalysisProgress {
	/** Current image being analyzed (1-based index) */
	current: number;
	/** Total number of images to analyze */
	total: number;
	/** Progress percentage (0-100) */
	percent: number;
}

/**
 * Result of validating a file path.
 * Used to check if files exist and are valid images before processing.
 */
export interface PathValidation {
	/** The path that was validated */
	path: string;
	/** Whether the path is valid and points to a valid image */
	is_valid: boolean;
	/** Error message if validation failed */
	error?: string;
}
