<script lang="ts">
	import { compressionState } from '$lib/stores/compression-state.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { Image as ImageIcon, X, CheckCircle2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';

	// Format file size
	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	// Remove image from selection
	function removeImage(index: number) {
		compressionState.selectedImages = compressionState.selectedImages.filter(
			(_, i) => i !== index
		);
	}

	// Clear all images
	function clearAll() {
		compressionState.selectedImages = [];
	}

	// Get thumbnail URL for image
	function getThumbnailUrl(image: typeof compressionState.selectedImages[0]): string {
		// Use the backend-generated thumbnail if available
		if (image.thumbnail) {
			return image.thumbnail;
		}

		// Fallback to loading the full image via Tauri
		try {
			return convertFileSrc(image.path);
		} catch (error) {
			console.warn('convertFileSrc failed:', error);
			return '';
		}
	}

	// Get file extension
	function getFileExtension(filename: string): string {
		const ext = filename.toLowerCase().split('.').pop();
		return ext ? ext.toUpperCase() : '';
	}
</script>

{#if compressionState.selectedImages.length === 0}
	<div class="flex h-full items-center justify-center p-8">
		<div class="text-center space-y-3">
			<div class="mx-auto rounded-lg bg-muted p-6 w-fit">
				<ImageIcon class="h-16 w-16 text-muted-foreground" />
			</div>
			<h3 class="text-lg font-semibold">{m.image_grid_no_images_title()}</h3>
			<p class="text-sm text-muted-foreground max-w-sm">
				{m.image_grid_no_images_description()}
			</p>
		</div>
	</div>
{:else}
	<div class="flex h-full flex-col">
		<!-- Header -->
		<div class="border-b p-4 flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold">{m.image_grid_selected_title()}</h2>
				<p class="text-sm text-muted-foreground">
					{compressionState.selectedImages.length}
					{compressionState.selectedImages.length !== 1 ? m.image_grid_files() : m.image_grid_file()}
					{m.image_grid_selected()}
					{#if compressionState.selectedImages.length > 0}
						({formatBytes(
							compressionState.selectedImages.reduce((sum, img) => sum + img.original_size, 0)
						)})
					{/if}
				</p>
			</div>
			<Button variant="outline" size="sm" onclick={clearAll}>
				<X class="h-4 w-4 mr-2" />
				{m.image_grid_clear_all()}
			</Button>
		</div>

		<!-- Image Grid -->
		<div class="flex-1 overflow-y-auto p-4">
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
				{#each compressionState.selectedImages as image, index (image.path)}
					<div class="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
						<!-- Thumbnail -->
						<img
							src={getThumbnailUrl(image)}
							alt={image.filename}
							class="w-full h-full object-cover transition-transform group-hover:scale-105"
							loading="lazy"
						/>

						<!-- Overlay on hover -->
						<div
							class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2"
						>
							<!-- File name -->
							<div class="text-white text-xs font-medium truncate">
								{image.filename}
							</div>

							<!-- File info -->
							<div class="space-y-0.5">
								<div class="text-white/80 text-xs">
									{formatBytes(image.original_size)}
								</div>
								<div class="text-white/60 text-xs">
									{getFileExtension(image.filename)}
								</div>
							</div>
						</div>

						<!-- Remove button -->
						<button
							onclick={() => removeImage(index)}
							class="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
							aria-label="Remove image"
						>
							<X class="h-3 w-3" />
						</button>

						<!-- Success indicator (shown after compression) -->
						{#if compressionState.result}
							<div class="absolute bottom-1 right-1 p-1 rounded-full bg-green-500">
								<CheckCircle2 class="h-3 w-3 text-white" />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
