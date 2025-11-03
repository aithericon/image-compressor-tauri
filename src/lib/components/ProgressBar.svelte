<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { compressionState } from '$lib/stores/compression-state.svelte';
	import * as m from '$lib/paraglide/messages';
</script>

{#if compressionState.progress}
	<Card>
		<CardContent class="space-y-4 p-6">
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
		</CardContent>
	</Card>
{/if}
