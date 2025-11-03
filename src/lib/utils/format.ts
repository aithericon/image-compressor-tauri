/**
 * Utility functions for formatting various data types for display.
 */

/**
 * Format bytes to a human-readable size string.
 *
 * @param bytes - The number of bytes to format
 * @param decimals - Number of decimal places to include (default: 2)
 * @returns Formatted string (e.g., "1.5 MB", "3.2 GB")
 *
 * @example
 * formatBytes(1024) // "1 KB"
 * formatBytes(1536000) // "1.46 MB"
 * formatBytes(0) // "0 Bytes"
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds to a human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "2.3s", "1m 30s", "450ms")
 *
 * @example
 * formatDuration(500) // "500ms"
 * formatDuration(2300) // "2.3s"
 * formatDuration(90000) // "1m 30s"
 */
export function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;

	const minutes = Math.floor(ms / 60000);
	const seconds = ((ms % 60000) / 1000).toFixed(0);
	return `${minutes}m ${seconds}s`;
}

/**
 * Calculate percentage savings between original and compressed sizes.
 *
 * @param original - Original size in bytes
 * @param compressed - Compressed size in bytes
 * @returns Percentage saved (0-100)
 *
 * @example
 * calculateSavings(1000, 500) // 50
 * calculateSavings(2000, 1500) // 25
 * calculateSavings(0, 0) // 0
 */
export function calculateSavings(original: number, compressed: number): number {
	if (original === 0) return 0;
	return ((original - compressed) / original) * 100;
}

/**
 * Estimate compressed size based on quality and size ratio settings.
 * This is a rough estimation formula used for preview purposes.
 *
 * @param originalSize - Original image size in bytes
 * @param quality - Compression quality (0-100)
 * @param sizeRatio - Size ratio (0-1)
 * @returns Estimated compressed size in bytes
 *
 * @example
 * estimateCompressedSize(1000000, 85, 0.8) // ~540000
 */
export function estimateCompressedSize(
	originalSize: number,
	quality: number,
	sizeRatio: number
): number {
	// Rough estimation formula
	// Base factor ranges from 0.3 (low quality) to 0.7 (high quality)
	const qualityFactor = quality / 100;
	const baseFactor = 0.3 + qualityFactor * 0.4;

	return Math.floor(originalSize * baseFactor * sizeRatio);
}
