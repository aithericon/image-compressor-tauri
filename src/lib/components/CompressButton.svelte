<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import {
		compressionState,
		getCanCompress,
		buildConfig
	} from '$lib/stores/compression-state.svelte';
	import { compressImages } from '$lib/utils/tauri-commands';
	import { Loader2, Zap } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	// Platform detection for keyboard shortcut hint
	const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
	const shortcutHint = isMac ? '⌘↵' : 'Ctrl+↵';

	async function handleCompress() {
		if (!getCanCompress()) return;

		try {
			compressionState.isCompressing = true;
			compressionState.progress = null;

			const config = buildConfig();
			const result = await compressImages(config);

			// Result will be handled by the event listener in +page.svelte
			console.log('Compression complete:', result);
		} catch (error) {
			console.error('Compression error:', error);
			compressionState.isCompressing = false;
		}
	}
</script>

<div class="space-y-4">
	<!-- Compress Button -->
	<Button
		size="lg"
		onclick={handleCompress}
		disabled={!getCanCompress()}
		class="w-full flex items-center justify-center gap-2"
	>
		{#if compressionState.isCompressing}
			<Loader2 class="h-5 w-5 animate-spin" />
			<span>{m.compress_button_compressing()}</span>
		{:else}
			<Zap class="h-5 w-5" />
			<span>{m.compress_button_compress()}</span>
			<span class="ml-auto text-xs opacity-60">{shortcutHint}</span>
		{/if}
	</Button>

	<!-- Progress Display (shown while compressing) -->
	{#if compressionState.isCompressing}
		<div class="border-t pt-4">
			{#if compressionState.progress}
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium">{m.progress_bar_compressing()}</span>
						<span class="text-muted-foreground">
							{compressionState.progress.current}
							{m.progress_bar_of()}
							{compressionState.progress.total}
						</span>
					</div>
					<Progress value={compressionState.progress.percent} class="h-2" />
				</div>

				<div class="text-muted-foreground mt-2 text-sm">
					<p class="truncate">
						{m.progress_bar_processing()}
						{compressionState.progress.current_file}
					</p>
				</div>
			{:else}
				<!-- Show loading state while waiting for first progress update -->
				<div class="flex items-center gap-3">
					<Loader2 class="text-primary h-5 w-5 animate-spin" />
					<div>
						<p class="text-sm font-medium">{m.progress_bar_compressing()}</p>
						<p class="text-muted-foreground text-xs">Starting compression...</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
