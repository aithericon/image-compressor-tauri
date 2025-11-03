<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type $$Props = HTMLAttributes<HTMLDivElement> & {
		variant?: 'default' | 'destructive';
		children?: Snippet;
	};

	let {
		class: className = '',
		variant = 'default',
		children,
		...restProps
	}: $$Props = $props();

	const variants = {
		default: 'bg-background text-foreground',
		destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
	};
</script>

<div
	class={cn(
		'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
		variants[variant],
		className
	)}
	role="alert"
	{...restProps}
>
	{#if children}{@render children()}{/if}
</div>