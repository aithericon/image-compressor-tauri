<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { teams = [] as any[] } = $props();
</script>

<Sidebar.Menu class="w-full">
	<Sidebar.MenuItem class="w-full">
		<Sidebar.MenuButton
			size="lg"
			class="h-12 cursor-default hover:bg-transparent"
		>
			<div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
				<span class="text-xs font-bold">APP</span>
			</div>
			<div class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]/sidebar-wrapper:hidden">
				<span class="truncate font-medium">My Application</span>
				<span class="truncate text-xs">Starter Kit</span>
			</div>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
