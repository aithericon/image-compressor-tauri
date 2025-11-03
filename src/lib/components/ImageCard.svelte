<script lang="ts">
	import type { ImageInfo } from '$lib/types/compression';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { removeImage } from '$lib/stores/compression-state.svelte';
	import { formatBytes } from '$lib/utils/format';
	import { FileImage, X } from 'lucide-svelte';

	let { image }: { image: ImageInfo } = $props();

	function handleRemove() {
		removeImage(image.path);
	}
</script>

<Card class="py-0 transition-colors hover:bg-muted/50">
	<CardContent class="flex items-center gap-2 px-2 py-1.5">
		<!-- Thumbnail or icon -->
		<div
			class="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-muted"
		>
			{#if image.thumbnail}
				<img
					src={image.thumbnail}
					alt={image.filename}
					class="h-full w-full object-cover"
					loading="lazy"
				/>
			{:else}
				<FileImage class="h-5 w-5 text-muted-foreground" />
			{/if}
		</div>

		<!-- File info -->
		<div class="flex-1 overflow-hidden">
			<p class="truncate text-sm font-medium leading-tight">{image.filename}</p>
			<div class="flex items-center gap-1 text-xs text-muted-foreground leading-none">
				<span>{formatBytes(image.original_size)}</span>
				<span>•</span>
				<Badge variant="secondary" class="h-3 px-1 py-0 text-xs">{image.format}</Badge>
				<span>•</span>
				<span>{image.width} × {image.height}</span>
			</div>
		</div>

		<!-- Remove button -->
		<Button variant="ghost" size="icon" class="h-6 w-6 flex-shrink-0" onclick={handleRemove}>
			<X class="h-3.5 w-3.5" />
		</Button>
	</CardContent>
</Card>
