<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import ChevronLeftIcon from 'lucide-svelte/icons/chevron-left';
	import ChevronRightIcon from 'lucide-svelte/icons/chevron-right';
	
	interface Props {
		value: { from: Date; to: Date };
		onValueChange?: (value: { from: Date; to: Date }) => void;
		class?: string;
		quickRanges?: boolean;
	}
	
	let { value = $bindable(), onValueChange, class: className = '', quickRanges = true }: Props = $props();
	
	let isOpen = $state(false);
	
	// Quick range presets (Grafana-style)
	const ranges = [
		{ label: 'Today', from: () => startOfDay(new Date()), to: () => endOfDay(new Date()) },
		{ label: 'Yesterday', from: () => startOfDay(addDays(new Date(), -1)), to: () => endOfDay(addDays(new Date(), -1)) },
		{ label: 'Last 7 days', from: () => startOfDay(addDays(new Date(), -7)), to: () => endOfDay(new Date()) },
		{ label: 'Last 14 days', from: () => startOfDay(addDays(new Date(), -14)), to: () => endOfDay(new Date()) },
		{ label: 'Last 30 days', from: () => startOfDay(addDays(new Date(), -30)), to: () => endOfDay(new Date()) },
		{ label: 'Last 90 days', from: () => startOfDay(addDays(new Date(), -90)), to: () => endOfDay(new Date()) },
		{ label: 'This month', from: () => startOfMonth(new Date()), to: () => endOfDay(new Date()) },
		{ label: 'Last month', from: () => startOfMonth(addMonths(new Date(), -1)), to: () => endOfMonth(addMonths(new Date(), -1)) },
		{ label: 'Last 3 months', from: () => startOfDay(addMonths(new Date(), -3)), to: () => endOfDay(new Date()) },
		{ label: 'Last 6 months', from: () => startOfDay(addMonths(new Date(), -6)), to: () => endOfDay(new Date()) },
		{ label: 'Last 12 months', from: () => startOfDay(addMonths(new Date(), -12)), to: () => endOfDay(new Date()) },
		{ label: 'This year', from: () => startOfYear(new Date()), to: () => endOfDay(new Date()) },
		{ label: 'Last year', from: () => startOfYear(addYears(new Date(), -1)), to: () => endOfYear(addYears(new Date(), -1)) },
	];
	
	// Date utility functions
	function startOfDay(date: Date): Date {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		return d;
	}
	
	function endOfDay(date: Date): Date {
		const d = new Date(date);
		d.setHours(23, 59, 59, 999);
		return d;
	}
	
	function startOfMonth(date: Date): Date {
		const d = new Date(date);
		d.setDate(1);
		d.setHours(0, 0, 0, 0);
		return d;
	}
	
	function endOfMonth(date: Date): Date {
		const d = new Date(date);
		d.setMonth(d.getMonth() + 1, 0);
		d.setHours(23, 59, 59, 999);
		return d;
	}
	
	function startOfYear(date: Date): Date {
		const d = new Date(date);
		d.setMonth(0, 1);
		d.setHours(0, 0, 0, 0);
		return d;
	}
	
	function endOfYear(date: Date): Date {
		const d = new Date(date);
		d.setMonth(11, 31);
		d.setHours(23, 59, 59, 999);
		return d;
	}
	
	function addDays(date: Date, days: number): Date {
		const d = new Date(date);
		d.setDate(d.getDate() + days);
		return d;
	}
	
	function addMonths(date: Date, months: number): Date {
		const d = new Date(date);
		d.setMonth(d.getMonth() + months);
		return d;
	}
	
	function addYears(date: Date, years: number): Date {
		const d = new Date(date);
		d.setFullYear(d.getFullYear() + years);
		return d;
	}
	
	function formatDateRange(from: Date, to: Date): string {
		const now = new Date();
		const diffDays = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
		
		// Check for common ranges
		if (diffDays === 0 && from.toDateString() === now.toDateString()) {
			return 'Today';
		}
		if (diffDays === 6 && to.toDateString() === now.toDateString()) {
			return 'Last 7 days';
		}
		if (diffDays === 29 && to.toDateString() === now.toDateString()) {
			return 'Last 30 days';
		}
		if (diffDays === 89 && to.toDateString() === now.toDateString()) {
			return 'Last 90 days';
		}
		
		// Format custom range
		const formatOptions: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric',
			year: from.getFullYear() !== to.getFullYear() ? 'numeric' : undefined
		};
		
		const fromStr = from.toLocaleDateString('en-US', formatOptions);
		const toStr = to.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' });
		
		return `${fromStr} - ${toStr}`;
	}
	
	function selectRange(range: { from: () => Date; to: () => Date }) {
		const newValue = { from: range.from(), to: range.to() };
		value = newValue;
		onValueChange?.(newValue);
		isOpen = false;
	}
	
	function shiftRange(direction: 'prev' | 'next') {
		const diffMs = value.to.getTime() - value.from.getTime();
		const shift = direction === 'prev' ? -diffMs : diffMs;
		
		const newValue = {
			from: new Date(value.from.getTime() + shift),
			to: new Date(value.to.getTime() + shift)
		};
		
		value = newValue;
		onValueChange?.(newValue);
	}
	
	// Initialize with last 30 days if no value provided
	$effect(() => {
		if (!value || !value.from || !value.to) {
			const defaultRange = {
				from: startOfDay(addDays(new Date(), -30)),
				to: endOfDay(new Date())
			};
			value = defaultRange;
			onValueChange?.(defaultRange);
		}
	});
</script>

<div class="flex items-center gap-2 {className}">
	<Button
		variant="ghost"
		size="icon"
		onclick={() => shiftRange('prev')}
		aria-label="Previous period"
	>
		<ChevronLeftIcon class="h-4 w-4" />
	</Button>
	
	<Popover bind:open={isOpen}>
		<PopoverTrigger class="inline-flex h-9 items-center justify-start whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-normal ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-[260px] text-left">
			<CalendarIcon class="mr-2 h-4 w-4" />
			{formatDateRange(value.from, value.to)}
		</PopoverTrigger>
		<PopoverContent class="w-auto p-0" align="start">
			{#if quickRanges}
				<div class="p-3">
					<div class="grid grid-cols-2 gap-2">
						{#each ranges as range}
							<Button
								variant="ghost"
								size="sm"
								class="justify-start"
								onclick={() => selectRange(range)}
							>
								{range.label}
							</Button>
						{/each}
					</div>
				</div>
			{/if}
			
			<div class="border-t p-3">
				<div class="space-y-2">
					<div class="text-sm font-medium">Custom Range</div>
					<div class="flex gap-2">
						<input
							type="date"
							value={value.from.toISOString().split('T')[0]}
							onchange={(e) => {
								const newFrom = new Date(e.currentTarget.value);
								if (newFrom <= value.to) {
									value = { ...value, from: startOfDay(newFrom) };
									onValueChange?.(value);
								}
							}}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
						<span class="flex items-center px-2">to</span>
						<input
							type="date"
							value={value.to.toISOString().split('T')[0]}
							onchange={(e) => {
								const newTo = new Date(e.currentTarget.value);
								if (newTo >= value.from) {
									value = { ...value, to: endOfDay(newTo) };
									onValueChange?.(value);
								}
							}}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<Button
						size="sm"
						class="w-full"
						onclick={() => {
							isOpen = false;
						}}
					>
						Apply
					</Button>
				</div>
			</div>
		</PopoverContent>
	</Popover>
	
	<Button
		variant="ghost"
		size="icon"
		onclick={() => shiftRange('next')}
		aria-label="Next period"
	>
		<ChevronRightIcon class="h-4 w-4" />
	</Button>
</div>