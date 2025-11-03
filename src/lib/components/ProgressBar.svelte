<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { compressionState } from '$lib/stores/compression-state.svelte';
	import { Loader2 } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
</script>

<Card>
	<CardContent class="space-y-4 p-6">
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

			<div class="text-muted-foreground text-sm">
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
	</CardContent>
</Card>
