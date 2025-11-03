<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	function handleClick() {
		toggleMode();
	}

	// In Svelte 5, we need to use the mode directly
	const isDark = $derived(mode.current === 'dark');
</script>

<Button
	onclick={handleClick}
	variant="ghost"
	size="icon"
	class="relative h-9 w-9"
	aria-label="Toggle theme"
>
	{#if isDark}
		<Sun class="h-4 w-4" />
	{:else}
		<Moon class="h-4 w-4" />
	{/if}
</Button>
