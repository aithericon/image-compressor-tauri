<script lang="ts">
	import {
		Card,
		CardHeader,
		CardContent,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Input } from '$lib/components/ui/input';
	import {
		compressionState,
		getEstimatedBytesSaved,
		getEstimatedSavingsPercent,
		getTotalOriginalSize,
		getTotalEstimatedSize,
		saveSettings
	} from '$lib/stores/compression-state.svelte';
	import { formatBytes } from '$lib/utils/format';
	import { selectFolder } from '$lib/utils/tauri-commands';
	import { FolderOpen } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	// Local state for slider values (needed for Slider component)
	let qualityValue = $state(compressionState.settings.quality);
	let sizeRatioValue = $state(compressionState.settings.size_ratio * 100);

	// Reactive derived values
	let totalOriginalSize = $derived(getTotalOriginalSize());
	let totalEstimatedSize = $derived(getTotalEstimatedSize());
	let estimatedBytesSaved = $derived(getEstimatedBytesSaved());
	let estimatedSavingsPercent = $derived(getEstimatedSavingsPercent());

	// Update settings when sliders change
	$effect(() => {
		compressionState.settings.quality = qualityValue;
		saveSettings();
	});

	$effect(() => {
		compressionState.settings.size_ratio = sizeRatioValue / 100;
		saveSettings();
	});

	async function handleSelectOutputFolder() {
		try {
			const folder = await selectFolder();
			if (folder) {
				compressionState.settings.output_folder = folder;
				saveSettings();
			}
		} catch (error) {
			console.error('Error selecting output folder:', error);
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>{m.compression_settings_title()}</CardTitle>
		<CardDescription>{m.compression_settings_description()}</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		<!-- Quality Slider -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label for="quality">{m.compression_settings_quality()}</Label>
				<span class="text-sm font-medium">{qualityValue}%</span>
			</div>
			<Slider type="single" min={0} max={100} step={1} bind:value={qualityValue} class="w-full" />
		</div>

		<!-- Size Ratio Slider -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label for="sizeRatio">{m.compression_settings_size_ratio()}</Label>
				<span class="text-sm font-medium">{sizeRatioValue}%</span>
			</div>
			<Slider type="single" min={0} max={100} step={1} bind:value={sizeRatioValue} class="w-full" />
		</div>

		<!-- Estimated Result -->
		<div class="bg-muted rounded-md px-3 py-2">
			<p class="text-muted-foreground text-xs">
				{m.compression_settings_estimated_result()}: {formatBytes(totalOriginalSize)} → {formatBytes(totalEstimatedSize)} ({estimatedSavingsPercent.toFixed(1)}%)
			</p>
		</div>

		<!-- Output Folder -->
		<div class="space-y-2">
			<Label for="outputFolder">{m.compression_settings_output_folder()}</Label>
			<div class="flex gap-2">
				<Input
					id="outputFolder"
					value={compressionState.settings.output_folder}
					readonly
					placeholder={m.compression_settings_output_folder_placeholder()}
					class="flex-1"
				/>
				<Button onclick={handleSelectOutputFolder} variant="outline" size="icon">
					<FolderOpen class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</CardContent>
</Card>
