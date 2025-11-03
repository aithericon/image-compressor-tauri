<script lang="ts">
	import { Card, CardHeader, CardContent, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ImageCard from './ImageCard.svelte';
	import {
		compressionState,
		getSelectedCount,
		getTotalOriginalSize,
		getSortedImages,
		clearImages,
		setSortBy
	} from '$lib/stores/compression-state.svelte';
	import { formatBytes } from '$lib/utils/format';
	import { Trash2, ArrowUpDown } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	// Reactive derived values
	let selectedCount = $derived(getSelectedCount());
	let totalOriginalSize = $derived(getTotalOriginalSize());
	let sortedImages = $derived(getSortedImages());
</script>

<Card>
	<CardHeader class="py-1.5 px-3">
		<div class="flex items-center justify-between">
			<CardTitle class="text-sm leading-tight">
				{m.image_list_title()} ({selectedCount} {selectedCount === 1 ? m.image_list_file() : m.image_list_files()},
				{formatBytes(totalOriginalSize)})
			</CardTitle>
			<div class="flex items-center gap-2">
				<!-- Sort dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="inline-flex h-6 items-center justify-center gap-1 rounded-md border border-input bg-background px-2 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
					>
						<ArrowUpDown class="h-3 w-3" />
						<span>{m.image_list_sort_by()}</span>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Item onclick={() => setSortBy('name-asc')}>
							{m.image_list_sort_name_asc()}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => setSortBy('name-desc')}>
							{m.image_list_sort_name_desc()}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={() => setSortBy('size-asc')}>
							{m.image_list_sort_size_asc()}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => setSortBy('size-desc')}>
							{m.image_list_sort_size_desc()}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- Clear all button -->
				<Button variant="ghost" size="sm" class="h-6 px-2" onclick={clearImages}>
					<Trash2 class="mr-1 h-3 w-3" />
					<span class="text-xs">{m.image_list_clear_all()}</span>
				</Button>
			</div>
		</div>
	</CardHeader>
	<CardContent class="py-2 px-3">
		<ScrollArea class="h-[300px] w-full pr-2">
			<div class="space-y-2">
				{#each sortedImages as image (image.path)}
					<ImageCard {image} />
				{/each}
			</div>
		</ScrollArea>
	</CardContent>
</Card>
