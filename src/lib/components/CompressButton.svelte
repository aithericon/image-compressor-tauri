<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import {
		compressionState,
		getCanCompress,
		buildConfig
	} from '$lib/stores/compression-state.svelte';
	import { compressImages } from '$lib/utils/tauri-commands';
	import { Loader2, Zap } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

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

<Card>
	<CardContent class="space-y-4 p-6">
		<!-- Compress Button -->
		<div class="flex justify-center">
			<Button size="lg" onclick={handleCompress} disabled={!getCanCompress()} class="min-w-[200px]">
				{#if compressionState.isCompressing}
					<Loader2 class="mr-2 h-5 w-5 animate-spin" />
					{m.compress_button_compressing()}
				{:else}
					<Zap class="mr-2 h-5 w-5" />
					{m.compress_button_compress()}
				{/if}
			</Button>
		</div>

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
						<p>{m.progress_bar_processing()} {compressionState.progress.current_file}</p>
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
	</CardContent>
</Card>
