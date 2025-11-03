<script lang="ts" module>
	import { cn } from '$lib/utils.js';
	import { type VariantProps, tv } from 'tailwind-variants';
	import type { Tabs } from 'bits-ui';

	export const tabsListVariants = tv({
		base: 'inline-flex items-center',
		variants: {
			variant: {
				default: 'bg-muted text-muted-foreground h-9 w-fit rounded-lg p-[3px] justify-center',
				github: 'h-12 bg-transparent rounded-none border-0 p-0 gap-8 w-full justify-start'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>['variant'];

	export type TabsListProps = Tabs.ListProps & {
		variant?: TabsListVariant;
	};
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		variant = 'default',
		...restProps
	}: TabsListProps = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	class={cn(tabsListVariants({ variant }), className)}
	{...restProps}
/>
