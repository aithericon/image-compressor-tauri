import { browser } from '$app/environment';
import { compressionState } from '$lib/stores/compression-state.svelte';
import { getDefaultOutputFolder } from '$lib/utils/tauri-commands';

/**
 * Load default settings and restore user preferences from localStorage
 */
export async function load() {
	if (browser) {
		// Load saved settings from localStorage
		const savedQuality = localStorage.getItem('compressionQuality');
		const savedSizeRatio = localStorage.getItem('compressionSizeRatio');
		const savedOutputFolder = localStorage.getItem('compressionOutputFolder');
		const savedThreadCount = localStorage.getItem('compressionThreadCount');

		if (savedQuality) {
			compressionState.settings.quality = parseFloat(savedQuality);
		}

		if (savedSizeRatio) {
			compressionState.settings.size_ratio = parseFloat(savedSizeRatio);
		}

		if (savedThreadCount) {
			compressionState.settings.thread_count = parseInt(savedThreadCount, 10);
		}

		// Get default output folder if not saved
		if (savedOutputFolder) {
			compressionState.settings.output_folder = savedOutputFolder;
		} else {
			try {
				compressionState.settings.output_folder = await getDefaultOutputFolder();
			} catch (error) {
				console.error('Failed to get default output folder:', error);
			}
		}
	}

	return {};
}
