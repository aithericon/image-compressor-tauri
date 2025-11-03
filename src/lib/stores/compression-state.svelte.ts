/**
 * Global state management for the image compression application.
 * Uses Svelte 5 runes for reactive state management.
 */

import type {
	ImageInfo,
	CompressResult,
	ProgressUpdate,
	AnalysisProgress,
	CompressionConfig
} from '$lib/types/compression';
import { estimateCompressedSize } from '$lib/utils/format';
import { browser } from '$app/environment';

/**
 * Main compression state object.
 * All state is reactive using Svelte 5 $state() rune.
 */
export const compressionState = $state({
	// File selection
	selectedImages: [] as ImageInfo[],

	// Processing states
	isAnalyzing: false,
	isCompressing: false,

	// Progress tracking
	analysisProgress: null as AnalysisProgress | null,
	progress: null as ProgressUpdate | null,

	// Results
	result: null as CompressResult | null,

	// Settings
	settings: {
		quality: 85,
		size_ratio: 0.8,
		output_folder: '',
		thread_count: 4,
		preserve_structure: false
	},

	// UI state
	showResults: false,

	// Sorting
	sortBy: 'name-asc' as 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc'
});

/**
 * Computed: Total number of selected images
 */
export const getSelectedCount = () => compressionState.selectedImages.length;

/**
 * Computed: Whether any images are selected
 */
export const getHasSelection = () => compressionState.selectedImages.length > 0;

/**
 * Computed: Total size of all selected images in bytes
 */
export const getTotalOriginalSize = () =>
	compressionState.selectedImages.reduce((sum, img) => sum + img.original_size, 0);

/**
 * Computed: Estimated total compressed size based on current settings
 */
export const getTotalEstimatedSize = () =>
	compressionState.selectedImages.reduce(
		(sum, img) =>
			sum +
			estimateCompressedSize(
				img.original_size,
				compressionState.settings.quality,
				compressionState.settings.size_ratio
			),
		0
	);

/**
 * Computed: Estimated bytes saved
 */
export const getEstimatedBytesSaved = () => getTotalOriginalSize() - getTotalEstimatedSize();

/**
 * Computed: Estimated savings percentage
 */
export const getEstimatedSavingsPercent = () => {
	const totalOriginal = getTotalOriginalSize();
	const bytesSaved = getEstimatedBytesSaved();
	return totalOriginal > 0 ? (bytesSaved / totalOriginal) * 100 : 0;
};

/**
 * Computed: Whether compression can be started
 */
export const getCanCompress = () =>
	getHasSelection() &&
	!compressionState.isCompressing &&
	compressionState.settings.output_folder !== '';

/**
 * Computed: Sorted images based on current sort setting
 */
export const getSortedImages = () => {
	const images = [...compressionState.selectedImages];
	const sortBy = compressionState.sortBy;

	switch (sortBy) {
		case 'name-asc':
			return images.sort((a, b) => a.filename.localeCompare(b.filename));
		case 'name-desc':
			return images.sort((a, b) => b.filename.localeCompare(a.filename));
		case 'size-asc':
			return images.sort((a, b) => a.original_size - b.original_size);
		case 'size-desc':
			return images.sort((a, b) => b.original_size - a.original_size);
		default:
			return images;
	}
};

/**
 * Add images to the selection
 */
export function addImages(images: ImageInfo[]) {
	compressionState.selectedImages.push(...images);
}

/**
 * Remove a specific image from the selection
 */
export function removeImage(path: string) {
	compressionState.selectedImages = compressionState.selectedImages.filter(
		(img) => img.path !== path
	);
}

/**
 * Clear all selected images
 */
export function clearImages() {
	compressionState.selectedImages = [];
}

/**
 * Set the sort order for images
 */
export function setSortBy(sortBy: typeof compressionState.sortBy) {
	compressionState.sortBy = sortBy;
}

/**
 * Reset to initial state (for "Compress More" functionality)
 */
export function resetState() {
	compressionState.selectedImages = [];
	compressionState.isAnalyzing = false;
	compressionState.isCompressing = false;
	compressionState.analysisProgress = null;
	compressionState.progress = null;
	compressionState.result = null;
	compressionState.showResults = false;
}

/**
 * Save settings to localStorage
 */
export function saveSettings() {
	if (browser) {
		localStorage.setItem('compressionQuality', compressionState.settings.quality.toString());
		localStorage.setItem('compressionSizeRatio', compressionState.settings.size_ratio.toString());
		localStorage.setItem('compressionOutputFolder', compressionState.settings.output_folder);
		localStorage.setItem(
			'compressionThreadCount',
			compressionState.settings.thread_count.toString()
		);
	}
}

/**
 * Build a CompressionConfig object from current state
 */
export function buildConfig(): CompressionConfig {
	return {
		source_paths: compressionState.selectedImages.map((img) => img.path),
		output_folder: compressionState.settings.output_folder,
		quality: compressionState.settings.quality,
		size_ratio: compressionState.settings.size_ratio,
		thread_count: compressionState.settings.thread_count,
		preserve_structure: compressionState.settings.preserve_structure
	};
}
