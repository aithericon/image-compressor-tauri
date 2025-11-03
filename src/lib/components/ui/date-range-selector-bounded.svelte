<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import ChevronLeftIcon from 'lucide-svelte/icons/chevron-left';
	import ChevronRightIcon from 'lucide-svelte/icons/chevron-right';

	interface Props {
		value: { from: Date; to: Date };
		onValueChange?: (value: { from: Date; to: Date }) => void;
		minDate?: Date;
		maxDate?: Date;
		class?: string;
	}

	let {
		value = $bindable(),
		onValueChange,
		minDate,
		maxDate,
		class: className = ''
	}: Props = $props();

	let isOpen = $state(false);

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

	function formatDateRange(from: Date, to: Date): string {
		const formatOptions: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric',
			year: from.getFullYear() !== to.getFullYear() ? 'numeric' : undefined
		};

		const fromStr = from.toLocaleDateString('en-US', formatOptions);
		const toStr = to.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' });

		return `${fromStr} - ${toStr}`;
	}

	function shiftRange(direction: 'prev' | 'next') {
		const diffMs = value.to.getTime() - value.from.getTime();
		const shift = direction === 'prev' ? -diffMs : diffMs;

		let newFrom = new Date(value.from.getTime() + shift);
		let newTo = new Date(value.to.getTime() + shift);

		// Clamp to bounds
		if (minDate && newFrom < minDate) {
			const overflow = minDate.getTime() - newFrom.getTime();
			newFrom = new Date(minDate);
			newTo = new Date(newTo.getTime() + overflow);
		}

		if (maxDate && newTo > maxDate) {
			const overflow = newTo.getTime() - maxDate.getTime();
			newTo = new Date(maxDate);
			newFrom = new Date(newFrom.getTime() - overflow);
		}

		// Final safety check
		if (minDate && newFrom < minDate) newFrom = new Date(minDate);
		if (maxDate && newTo > maxDate) newTo = new Date(maxDate);

		const newValue = { from: newFrom, to: newTo };
		value = newValue;
		onValueChange?.(newValue);
	}

	// Check if we can shift in a direction
	function canShift(direction: 'prev' | 'next'): boolean {
		if (direction === 'prev') {
			return !minDate || value.from > minDate;
		} else {
			return !maxDate || value.to < maxDate;
		}
	}

	// Format dates for input fields
	function formatDateForInput(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	// Format min/max dates for input fields
	const minDateStr = $derived(minDate ? formatDateForInput(minDate) : '');
	const maxDateStr = $derived(maxDate ? formatDateForInput(maxDate) : '');
</script>

<div class="flex items-center gap-2 {className}">
	<Button
		variant="ghost"
		size="icon"
		onclick={() => shiftRange('prev')}
		disabled={!canShift('prev')}
		aria-label="Previous period"
	>
		<ChevronLeftIcon class="h-4 w-4" />
	</Button>

	<Popover bind:open={isOpen}>
		<PopoverTrigger
			class="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-9 w-[260px] items-center justify-start whitespace-nowrap rounded-md border px-3 text-left text-sm font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
		>
			<CalendarIcon class="mr-2 h-4 w-4" />
			{formatDateRange(value.from, value.to)}
		</PopoverTrigger>
		<PopoverContent class="w-auto p-0" align="start">
			<div class="p-3">
				<div class="space-y-2">
					<div class="text-sm font-medium">Date Range</div>
					{#if minDate || maxDate}
						<div class="text-muted-foreground text-xs">Range limited to forecast period</div>
					{/if}
					<div class="flex gap-2">
						<input
							type="date"
							value={formatDateForInput(value.from)}
							min={minDateStr}
							max={maxDateStr}
							onchange={(e) => {
								const newFrom = new Date(e.currentTarget.value);
								if (newFrom <= value.to) {
									value = { ...value, from: startOfDay(newFrom) };
									onValueChange?.(value);
								}
							}}
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
						<span class="flex items-center px-2">to</span>
						<input
							type="date"
							value={formatDateForInput(value.to)}
							min={minDateStr}
							max={maxDateStr}
							onchange={(e) => {
								const newTo = new Date(e.currentTarget.value);
								if (newTo >= value.from) {
									value = { ...value, to: endOfDay(newTo) };
									onValueChange?.(value);
								}
							}}
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
		disabled={!canShift('next')}
		aria-label="Next period"
	>
		<ChevronRightIcon class="h-4 w-4" />
	</Button>
</div>
