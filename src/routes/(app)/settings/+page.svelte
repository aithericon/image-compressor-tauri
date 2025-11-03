<script lang="ts">
	import Topbar from '$lib/components/topbar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import MoonIcon from 'lucide-svelte/icons/moon';
	import SunIcon from 'lucide-svelte/icons/sun';
	import { mode, setMode } from 'mode-watcher';

	let notifications = $state(true);
	let soundEnabled = $state(false);

	// Get current mode
	let currentMode = $derived(mode.current);
</script>

<div class="bg-background flex h-screen flex-col">
	<Topbar title="Settings">
		{#snippet actions()}
			<Button href="/dashboard" variant="outline">
				Back to Dashboard
			</Button>
		{/snippet}
	</Topbar>

	<div class="flex-1 overflow-auto p-6">
		<div class="mx-auto max-w-4xl space-y-6">
			<!-- Appearance Settings -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<SettingsIcon class="h-5 w-5" />
						Appearance
					</CardTitle>
					<CardDescription>
						Customize how your application looks and feels
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label>Theme</Label>
							<p class="text-muted-foreground text-sm">
								Switch between light and dark mode
							</p>
						</div>
						<div class="flex items-center gap-2">
							<Button
								variant={currentMode === 'light' ? 'default' : 'outline'}
								size="icon"
								onclick={() => setMode('light')}
							>
								<SunIcon class="h-4 w-4" />
							</Button>
							<Button
								variant={currentMode === 'dark' ? 'default' : 'outline'}
								size="icon"
								onclick={() => setMode('dark')}
							>
								<MoonIcon class="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- General Settings -->
			<Card>
				<CardHeader>
					<CardTitle>General</CardTitle>
					<CardDescription>
						Manage your general application preferences
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label for="notifications">Notifications</Label>
							<p class="text-muted-foreground text-sm">
								Receive notifications about updates
							</p>
						</div>
						<Switch id="notifications" bind:checked={notifications} />
					</div>

					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label for="sound">Sound Effects</Label>
							<p class="text-muted-foreground text-sm">
								Play sounds for important events
							</p>
						</div>
						<Switch id="sound" bind:checked={soundEnabled} />
					</div>
				</CardContent>
			</Card>

			<!-- About Section -->
			<Card>
				<CardHeader>
					<CardTitle>About</CardTitle>
					<CardDescription>
						Information about this application
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-2">
					<p class="text-sm">
						<span class="font-semibold">Built with:</span> SvelteKit, Tauri, TailwindCSS
					</p>
					<p class="text-sm">
						<span class="font-semibold">UI Components:</span> shadcn-svelte
					</p>
					<p class="text-muted-foreground text-sm">
						A minimal starter template for building desktop applications
					</p>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
