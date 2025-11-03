<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { page } from '$app/stores';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';

	let {
		items
	}: {
		items: {
			title: string;
			url: string;
			// this should be `Component` after @lucide/svelte updates types
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			icon?: any;
			isActive?: boolean;
			testId?: string;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	} = $props();

	// Get the current page URL
	const currentPath = $derived($page.url.pathname);
	const sidebar = useSidebar();
	
	// Track hover state for each item
	let hoveredItem = $state<string | null>(null);
	let hoveredSubItem = $state<string | null>(null);
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as item (item.title)}
			<Sidebar.MenuItem>
				{#if item.items && item.items.length > 0}
					<Sidebar.MenuButton
						tooltipContent={sidebar.state === 'collapsed' ? item.title : undefined}
					>
						{#if item.icon}
							<item.icon />
						{/if}
						<span>{item.title}</span>
					</Sidebar.MenuButton>
					<Sidebar.MenuSub>
						{#each item.items as subItem}
							<Sidebar.MenuSubItem>
								<Sidebar.MenuSubButton 
									isActive={currentPath === subItem.url}
									onmouseenter={() => hoveredSubItem = subItem.url}
									onmouseleave={() => hoveredSubItem = null}
									class={currentPath === subItem.url ? '!bg-tertiary !text-tertiary-foreground hover:!bg-tertiary hover:!text-tertiary-foreground' : ''}
								>
									{#snippet child({ props })}
										<a href={subItem.url} {...props}>
											{#if currentPath === subItem.url}
												<span class="!text-tertiary-foreground ml-1" style="animation: slow-blink 1.5s steps(1, end) infinite">|</span>
											{:else if hoveredSubItem === subItem.url}
												<span class="text-sidebar-accent-foreground ml-1">|</span>
											{/if}
											<span>{subItem.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuSubButton>
							</Sidebar.MenuSubItem>
						{/each}
					</Sidebar.MenuSub>
				{:else}
					<Sidebar.MenuButton
						tooltipContent={sidebar.state === 'collapsed' ? item.title : undefined}
						isActive={currentPath === item.url}
						onmouseenter={() => hoveredItem = item.url}
						onmouseleave={() => hoveredItem = null}
					>
						{#snippet child({ props })}
							<a href={item.url} {...props} data-testid={item.testId}>
								{#if item.icon}
									<item.icon />
								{/if}
								{#if currentPath === item.url}
									<span class="text-primary-foreground ml-1" style="animation: slow-blink 1.5s steps(1, end) infinite">|</span>
								{:else if hoveredItem === item.url}
									<span class="text-sidebar-accent-foreground ml-1">|</span>
								{/if}
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				{/if}
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
