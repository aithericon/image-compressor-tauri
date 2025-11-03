<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		centerContent,
		actions
	}: {
		title: string;
		description?: string;
		centerContent?: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<div class="border-border flex h-[60px] items-center justify-between border-b px-6">
	<!-- Left: Title and Description -->
	<div class="flex flex-col">
		<h1 class="text-lg font-semibold">{title}</h1>
		{#if description}
			<p class="text-muted-foreground text-sm">{description}</p>
		{/if}
	</div>

	<!-- Center: Optional Center Content -->
	{#if centerContent}
		<div class="flex items-center">
			{@render centerContent()}
		</div>
	{/if}

	<!-- Right: Actions -->
	{#if actions}
		<div class="flex items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</div>
