<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import type { KeyboardShortcut } from '$lib/hooks/useKeyboardShortcuts.svelte';
	import { formatShortcut } from '$lib/hooks/useKeyboardShortcuts.svelte';

	let {
		open = $bindable(false),
		shortcuts
	}: {
		open?: boolean;
		shortcuts: KeyboardShortcut[];
	} = $props();
</script>

<Dialog bind:open>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Keyboard Shortcuts</DialogTitle>
			<DialogDescription>
				Boost your productivity with these keyboard shortcuts
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-3 mt-4">
			{#each shortcuts as shortcut}
				<div class="flex items-center justify-between py-2 border-b last:border-0">
					<span class="text-sm text-muted-foreground">{shortcut.description}</span>
					<kbd class="px-2 py-1 text-xs font-semibold bg-muted rounded border">
						{formatShortcut(shortcut)}
					</kbd>
				</div>
			{/each}
		</div>

		<div class="mt-4 pt-4 border-t text-xs text-muted-foreground">
			Press <kbd class="px-1.5 py-0.5 bg-muted rounded border">?</kbd> to toggle this dialog
		</div>
	</DialogContent>
</Dialog>
