<script lang="ts" module>
	import LayoutDashboardIcon from 'lucide-svelte/icons/layout-dashboard';
	import SettingsIcon from 'lucide-svelte/icons/settings';

	// Application navigation data
	const data = {
		user: {
			name: 'User',
			email: 'user@example.com',
			avatar: ''
		},
		teams: [],
		navMain: [
			{
				title: 'Dashboard',
				url: '/dashboard',
				icon: LayoutDashboardIcon,
				isActive: true,
				testId: 'nav-dashboard'
			},
			{
				title: 'Settings',
				url: '/settings',
				icon: SettingsIcon,
				testId: 'nav-settings'
			}
		]
	};
</script>

<script lang="ts">
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';
	import TeamSwitcher from './team-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header class="flex h-[79px] items-center justify-center">
		<TeamSwitcher teams={data.teams} />
	</Sidebar.Header>
	<Sidebar.Separator class="mx-0" />
	<Sidebar.Content>
		<NavMain items={data.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
