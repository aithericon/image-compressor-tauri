<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';
	import Topbar from '$lib/components/topbar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import HomeIcon from 'lucide-svelte/icons/home';
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import InfoIcon from 'lucide-svelte/icons/info';

	let greeting = $state('');
	let appVersion = $state('');
	let userName = $state('User');

	async function loadInfo() {
		try {
			greeting = await invoke<string>('greet', { name: userName });
			appVersion = await invoke<string>('get_app_version');
		} catch (error) {
			console.error('Failed to load app info:', error);
		}
	}

	$effect(() => {
		loadInfo();
	});

	async function handleGreet() {
		await loadInfo();
	}
</script>

<div class="bg-background flex h-screen flex-col">
	<Topbar title="Dashboard">
		{#snippet actions()}
			<Button href="/settings" variant="outline">
				<SettingsIcon class="mr-2 h-4 w-4" />
				Settings
			</Button>
		{/snippet}
	</Topbar>

	<div class="flex-1 overflow-auto p-6">
		<div class="mx-auto max-w-7xl space-y-6">
			<!-- Welcome Card -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<HomeIcon class="h-5 w-5" />
						Welcome to Your App
					</CardTitle>
					<CardDescription>
						This is a minimal SvelteKit + Tauri starter template
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<p class="text-sm">
							{greeting || 'Loading...'}
						</p>
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={userName}
								placeholder="Enter your name"
								class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
							/>
							<Button onclick={handleGreet}>
								Greet Me
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Info Cards Grid -->
			<div class="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">App Version</CardTitle>
						<InfoIcon class="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold">{appVersion || '...'}</div>
						<p class="text-muted-foreground text-xs">Current version</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Tech Stack</CardTitle>
						<InfoIcon class="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold">Svelte 5</div>
						<p class="text-muted-foreground text-xs">With Tauri v2</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Status</CardTitle>
						<InfoIcon class="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold">Ready</div>
						<p class="text-muted-foreground text-xs">All systems operational</p>
					</CardContent>
				</Card>
			</div>

			<!-- Getting Started Card -->
			<Card>
				<CardHeader>
					<CardTitle>Getting Started</CardTitle>
					<CardDescription>
						Start building your application by modifying the components
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<h3 class="font-semibold">What's Included:</h3>
						<ul class="text-muted-foreground ml-6 list-disc space-y-1 text-sm">
							<li>SvelteKit with Svelte 5 (runes)</li>
							<li>Tauri v2 backend with Rust</li>
							<li>TailwindCSS v4 for styling</li>
							<li>shadcn-svelte UI components</li>
							<li>Tauri Stronghold plugin for secure storage</li>
							<li>TypeScript with strict mode</li>
							<li>Responsive sidebar layout</li>
						</ul>
					</div>
					<div class="space-y-2">
						<h3 class="font-semibold">Next Steps:</h3>
						<ul class="text-muted-foreground ml-6 list-disc space-y-1 text-sm">
							<li>Add your routes in <code>src/routes/</code></li>
							<li>Create components in <code>src/lib/components/</code></li>
							<li>Add Tauri commands in <code>src-tauri/src/lib.rs</code></li>
							<li>Customize the sidebar in <code>app-sidebar.svelte</code></li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
