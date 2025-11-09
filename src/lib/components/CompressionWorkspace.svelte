<script lang="ts">
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';
	import FileExplorer from '$lib/components/file-explorer.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import CompressionSettings from '$lib/components/CompressionSettings.svelte';
	import CompressButton from '$lib/components/CompressButton.svelte';
	import { mockFileExplorerRepository, tauriFileExplorerRepository } from '$lib/repositories';
	import type { FileEntry } from '$lib/types/fileExplorer';
	import { compressionState, saveSettings } from '$lib/stores/compression-state.svelte';
	import FileSelector from '$lib/components/FileSelector.svelte';
	import { Button } from '$lib/components/ui/button';
	import { FolderOpen, Plus, Settings2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { DEFAULT_PRESETS, type CompressionPreset } from '$lib/types/presets';
	import { analyzeImages } from '$lib/utils/tauri-commands';

	// File explorer state
	let repository = tauriFileExplorerRepository;
	let rootPath = $state<string>();
	let selectedFile = $state<FileEntry | undefined>();
	let showFileSelector = $state(false);

	// Panel sizes state (saved to localStorage)
	let panelSizes = $state<number[]>([20, 50, 30]);

	// Preset state
	let selectedPreset = $state<string>('web-optimized');
	let customPresets = $state<CompressionPreset[]>([]);

	// Load panel sizes from localStorage
	onMount(() => {
		const saved = localStorage.getItem('panelSizes');
		if (saved) {
			try {
				panelSizes = JSON.parse(saved);
			} catch (e) {
				console.error('Failed to load panel sizes:', e);
			}
		}

		// Load custom presets
		const savedPresets = localStorage.getItem('customPresets');
		if (savedPresets) {
			try {
				customPresets = JSON.parse(savedPresets);
			} catch (e) {
				console.error('Failed to load custom presets:', e);
			}
		}
	});

	// Save panel sizes when they change
	function handlePanelResize(sizes: number[]) {
		panelSizes = sizes;
		localStorage.setItem('panelSizes', JSON.stringify(sizes));
	}

	// Apply preset
	function applyPreset(presetId: string) {
		selectedPreset = presetId;
		const preset = [...DEFAULT_PRESETS, ...customPresets].find((p) => p.id === presetId);
		if (preset) {
			compressionState.settings.quality = preset.quality;
			compressionState.settings.size_ratio = preset.size_ratio;
			saveSettings();
		}
	}

	// Handle manual settings change
	function handleSettingsChange() {
		// When manually changed, switch to custom
		if (selectedPreset !== 'custom') {
			selectedPreset = 'custom';
		}
	}

	// Track files currently being analyzed to prevent duplicate processing
	let analyzingPaths = $state<Set<string>>(new Set());

	// Check if a file is an image based on extension
	function isImageFile(filename: string): boolean {
		const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'];
		const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
		return imageExtensions.includes(ext);
	}

	// Handle file selection from file explorer (toggle behavior)
	async function handleFileSelection(file: FileEntry) {
		if (!file.isDirectory && isImageFile(file.name)) {
			// Check if already selected - if so, remove it
			const existingIndex = compressionState.selectedImages.findIndex((img) => img.path === file.path);
			if (existingIndex !== -1) {
				compressionState.selectedImages = compressionState.selectedImages.filter(
					(_, i) => i !== existingIndex
				);
				return;
			}

			// Don't analyze if already analyzing this file
			if (analyzingPaths.has(file.path)) {
				return;
			}

			// Not selected yet - analyze and add it
			try {
				analyzingPaths.add(file.path);
				compressionState.isAnalyzing = true;
				const analyzed = await analyzeImages([file.path]);
				if (analyzed.length > 0) {
					// Double-check it wasn't added while we were analyzing
					const stillNotSelected = !compressionState.selectedImages.some((img) => img.path === file.path);
					if (stillNotSelected) {
						compressionState.selectedImages = [...compressionState.selectedImages, analyzed[0]];
					}
				}
			} catch (error) {
				console.error('Failed to analyze image:', error);
			} finally {
				analyzingPaths.delete(file.path);
				compressionState.isAnalyzing = false;
			}
		}
	}

</script>

<div class="h-full flex flex-col">
	<PaneGroup
		direction="horizontal"
		onLayout={handlePanelResize}
		class="flex-1"
	>
		<!-- Left Panel: File Explorer -->
		<Pane defaultSize={panelSizes[0]} minSize={15} maxSize={40}>
			<div class="h-full flex flex-col border-r bg-muted/30">
				<div class="border-b p-3 bg-background flex items-center justify-between">
					<h3 class="text-sm font-semibold flex items-center gap-2">
						<FolderOpen class="h-4 w-4" />
						Browse Files
					</h3>
					<Button
						variant="ghost"
						size="sm"
						onclick={() => (showFileSelector = !showFileSelector)}
						class="h-7 px-2"
					>
						<Plus class="h-3 w-3 mr-1" />
						Add
					</Button>
				</div>
				<div class="flex-1 overflow-auto p-2">
					{#if showFileSelector}
						<div class="p-2 border-b">
							<FileSelector />
						</div>
					{/if}
					<FileExplorer
					{repository}
					bind:rootPath
					bind:selectedFile
					selectedImages={compressionState.selectedImages}
					onFileClick={handleFileSelection}
				/>
				</div>
			</div>
		</Pane>

		<PaneResizer class="w-1 bg-border hover:bg-accent transition-colors" />

		<!-- Center Panel: Image Grid -->
		<Pane defaultSize={panelSizes[1]} minSize={30}>
			<div class="h-full bg-background">
				<ImageGrid />
			</div>
		</Pane>

		<PaneResizer class="w-1 bg-border hover:bg-accent transition-colors" />

		<!-- Right Panel: Settings & Actions -->
		<Pane defaultSize={panelSizes[2]} minSize={20} maxSize={45}>
			<div class="h-full flex flex-col border-l bg-muted/30">
				<!-- Settings Header -->
				<div class="border-b p-3 bg-background">
					<h3 class="text-sm font-semibold">Compression Settings</h3>
				</div>

				<!-- Preset Selector -->
				<div class="p-4 border-b space-y-2">
					<label for="preset-select" class="text-xs font-medium text-muted-foreground">Preset</label>
					<select
						id="preset-select"
						bind:value={selectedPreset}
						onchange={() => applyPreset(selectedPreset)}
						class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						{#each DEFAULT_PRESETS as preset (preset.id)}
							<option value={preset.id}>{preset.name}</option>
						{/each}
						{#each customPresets as preset (preset.id)}
							<option value={preset.id}>{preset.name} (Custom)</option>
						{/each}
					</select>
					{#if selectedPreset !== 'custom'}
						{@const preset = [...DEFAULT_PRESETS, ...customPresets].find(
							(p) => p.id === selectedPreset
						)}
						{#if preset}
							<p class="text-xs text-muted-foreground">{preset.description}</p>
						{/if}
					{/if}
				</div>

				<!-- Settings Panel -->
				<div class="flex-1 overflow-auto p-4">
					<CompressionSettings />
				</div>

				<!-- Compress Button -->
				<div class="border-t bg-background">
					<CompressButton />
				</div>
			</div>
		</Pane>
	</PaneGroup>
</div>
