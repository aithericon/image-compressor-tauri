<script lang="ts">
	import { Card, CardHeader, CardContent, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { compressionState, getTotalOriginalSize } from '$lib/stores/compression-state.svelte';
	import { formatBytes, formatDuration, calculateSavings } from '$lib/utils/format';
	import { CheckCircle2, AlertCircle, Clock, HardDrive } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	// Reactive derived value
	let totalOriginalSize = $derived(getTotalOriginalSize());
</script>

{#if compressionState.result}
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				{#if compressionState.result.failed === 0}
					<CheckCircle2 class="h-6 w-6 text-green-500" />
					{m.results_complete_title()}
				{:else}
					<AlertCircle class="h-6 w-6 text-yellow-500" />
					{m.results_complete_with_errors_title()}
				{/if}
			</CardTitle>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Summary Stats -->
			<div class="flex items-center justify-between">
				<span class="text-sm text-muted-foreground">{m.results_successfully_compressed()}</span>
				<Badge variant={compressionState.result.failed === 0 ? 'default' : 'secondary'}>
					{compressionState.result.successful} of {compressionState.result.total} {m.results_images()}
				</Badge>
			</div>

			<Separator />

			<!-- Detailed Stats -->
			<div class="space-y-4">
				<div class="flex items-center justify-between rounded-lg bg-muted p-4">
					<div class="flex items-center gap-3">
						<HardDrive class="h-5 w-5 text-muted-foreground" />
						<div>
							<p class="text-sm font-medium">{m.results_space_saved()}</p>
							<p class="text-2xl font-bold text-green-600 dark:text-green-400">
								{formatBytes(compressionState.result.saved_bytes)}
							</p>
						</div>
					</div>
					<div class="text-right">
						<p class="text-sm text-muted-foreground">{m.results_original_size()}</p>
						<p class="font-medium">{formatBytes(totalOriginalSize)}</p>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="rounded-lg border p-4">
						<div class="flex items-center gap-2 text-muted-foreground">
							<HardDrive class="h-4 w-4" />
							<span class="text-sm">{m.results_compressed_size()}</span>
						</div>
						<p class="mt-2 text-lg font-semibold">
							{formatBytes(totalOriginalSize - compressionState.result.saved_bytes)}
						</p>
					</div>

					<div class="rounded-lg border p-4">
						<div class="flex items-center gap-2 text-muted-foreground">
							<Clock class="h-4 w-4" />
							<span class="text-sm">{m.results_time_taken()}</span>
						</div>
						<p class="mt-2 text-lg font-semibold">
							{formatDuration(compressionState.result.duration_ms)}
						</p>
					</div>
				</div>

				<div class="rounded-lg bg-primary/10 p-4 text-center">
					<p class="text-sm text-muted-foreground">{m.results_savings_percentage()}</p>
					<p class="mt-1 text-3xl font-bold text-primary">
						{calculateSavings(totalOriginalSize, totalOriginalSize - compressionState.result.saved_bytes).toFixed(
							1
						)}%
					</p>
				</div>
			</div>

			<!-- Error List -->
			{#if compressionState.result.errors.length > 0}
				<Separator />
				<div class="space-y-2">
					<p class="text-sm font-medium text-destructive">
						{m.results_errors()} ({compressionState.result.errors.length}):
					</p>
					<div class="space-y-1">
						{#each compressionState.result.errors as error}
							<div class="rounded-md bg-destructive/10 p-3 text-sm">
								<p class="font-medium text-destructive">{error.filename}</p>
								<p class="text-xs text-muted-foreground">{error.error}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
{/if}
