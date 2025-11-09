<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import FileIcon from '@lucide/svelte/icons/file';
	import { cn } from '$lib/utils/utils';
	import type { TreeViewFileProps } from './types';

	let { name, icon, type = 'button', class: className, ...rest }: TreeViewFileProps = $props();
</script>

<button {type} class={cn('flex place-items-center gap-1 pl-[3px] w-full', className)} {...rest}>
	{#if icon}
		{@render icon({ name })}
	{:else}
		<FileIcon class="size-4 flex-shrink-0" />
	{/if}
	<span class="truncate text-left">{name}</span>
</button>
