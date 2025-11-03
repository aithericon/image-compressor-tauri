<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { compressionState, addImages } from '$lib/stores/compression-state.svelte';
	import { selectFiles, selectFolder, analyzeImages } from '$lib/utils/tauri-commands';
	import { FolderOpen, FileImage, Loader2 } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	let isDragOver = $state(false);

	async function handleFileSelect() {
		try {
			compressionState.isAnalyzing = true;
			const files = await selectFiles();
			if (files.length > 0) {
				const imageInfo = await analyzeImages(files);
				addImages(imageInfo);
			}
		} catch (error) {
			console.error('Error selecting files:', error);
		} finally {
			compressionState.isAnalyzing = false;
		}
	}

	async function handleFolderSelect() {
		try {
			compressionState.isAnalyzing = true;
			const folder = await selectFolder();
			if (folder) {
				console.log('Selected folder:', folder);
				// Analyze all images in the folder
				const imageInfo = await analyzeImages([folder]);
				addImages(imageInfo);
			}
		} catch (error) {
			console.error('Error selecting folder:', error);
		} finally {
			compressionState.isAnalyzing = false;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;

		// TODO: Implement drag & drop file handling
		console.log('Files dropped:', e.dataTransfer?.files);
	}
</script>

<Card
	class="border-2 border-dashed transition-colors {isDragOver
		? 'border-primary bg-primary/5'
		: 'border-muted-foreground/25'}"
>
	<CardContent class="p-12">
		{#if compressionState.isAnalyzing}
			<!-- Large analyzing animation -->
			<div class="flex flex-col items-center justify-center space-y-6 py-12">
				<Loader2 class="h-20 w-20 animate-spin text-primary" />
				<div class="text-center">
					<p class="text-xl font-semibold">{m.file_selector_analyzing_images()}</p>
					<p class="mt-2 text-sm text-muted-foreground">Please wait while we analyze your images</p>
				</div>
			</div>
		{:else}
			<!-- Normal file selector UI -->
			<div
				role="button"
				tabindex="0"
				class="flex flex-col items-center justify-center space-y-4"
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
			>
				<FileImage class="h-16 w-16 text-muted-foreground" />
				<div class="text-center">
					<h3 class="text-lg font-semibold">{m.file_selector_drag_drop_title()}</h3>
					<p class="text-sm text-muted-foreground">{m.file_selector_drag_drop_subtitle()}</p>
				</div>

				<div class="flex gap-4">
					<Button onclick={handleFileSelect} disabled={compressionState.isAnalyzing}>
						<FileImage class="mr-2 h-4 w-4" />
						{m.file_selector_select_files()}
					</Button>
					<Button onclick={handleFolderSelect} variant="outline" disabled={compressionState.isAnalyzing}>
						<FolderOpen class="mr-2 h-4 w-4" />
						{m.file_selector_select_folder()}
					</Button>
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
