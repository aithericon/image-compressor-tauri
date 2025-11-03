<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { compressionState, resetState } from '$lib/stores/compression-state.svelte';
	import { openInExplorer } from '$lib/utils/tauri-commands';
	import { FolderOpen, RefreshCw } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	async function handleOpenFolder() {
		try {
			await openInExplorer(compressionState.settings.output_folder);
		} catch (error) {
			console.error('Error opening folder:', error);
		}
	}

	function handleCompressMore() {
		resetState();
	}
</script>

<div class="flex justify-center gap-4">
	<Button onclick={handleOpenFolder} variant="outline" size="lg">
		<FolderOpen class="mr-2 h-5 w-5" />
		{m.action_buttons_open_folder()}
	</Button>
	<Button onclick={handleCompressMore} size="lg">
		<RefreshCw class="mr-2 h-5 w-5" />
		{m.action_buttons_compress_more()}
	</Button>
</div>
