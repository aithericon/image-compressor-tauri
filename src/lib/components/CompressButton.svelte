<script lang="ts">
	import { Button } from '$lib/components/ui/button';
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

<Button size="lg" onclick={handleCompress} disabled={!getCanCompress()} class="min-w-[200px]">
	{#if compressionState.isCompressing}
		<Loader2 class="mr-2 h-5 w-5 animate-spin" />
		{m.compress_button_compressing()}
	{:else}
		<Zap class="mr-2 h-5 w-5" />
		{m.compress_button_compress()}
	{/if}
</Button>
