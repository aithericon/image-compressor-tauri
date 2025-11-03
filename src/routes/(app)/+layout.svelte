<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children } = $props();
</script>

<Sidebar.Provider class="h-screen overflow-hidden">
	<AppSidebar />
	<Sidebar.Inset class="h-full overflow-hidden">
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
