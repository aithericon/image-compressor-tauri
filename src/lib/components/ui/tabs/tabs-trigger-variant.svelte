<script lang="ts" module>
	import { cn } from '$lib/utils.js';
	import { type VariantProps, tv } from 'tailwind-variants';
	import type { Tabs } from 'bits-ui';

	export const tabsTriggerVariants = tv({
		base: "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default:
					'data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground h-[calc(100%-1px)] flex-1 gap-1.5 rounded-md border border-transparent px-2 py-1 transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] data-[state=active]:shadow-sm',
				github:
					'h-full -mb-px border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent px-0 data-[state=inactive]:text-muted-foreground bg-transparent rounded-none shadow-none hover:bg-transparent hover:text-foreground outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 data-[state=active]:outline-none data-[state=active]:ring-0'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type TabsTriggerVariant = VariantProps<typeof tabsTriggerVariants>['variant'];

	export type TabsTriggerProps = Tabs.TriggerProps & {
		variant?: TabsTriggerVariant;
	};
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		variant = 'default',
		...restProps
	}: TabsTriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(tabsTriggerVariants({ variant }), className)}
	{...restProps}
/>
