<script lang="ts">
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import CompressionWorkspace from '$lib/components/CompressionWorkspace.svelte';
	import ResultsSummary from '$lib/components/ResultsSummary.svelte';
	import ActionButtons from '$lib/components/ActionButtons.svelte';
	import KeyboardShortcutsDialog from '$lib/components/KeyboardShortcutsDialog.svelte';
	import { compressionState } from '$lib/stores/compression-state.svelte';
	import { onMount } from 'svelte';
	import { listen } from '@tauri-apps/api/event';
	import type { ProgressUpdate, CompressResult } from '$lib/types/compression';
	import * as m from '$lib/paraglide/messages';
	import { setLocale, getLocale } from '$lib/paraglide/runtime';
	import { Button } from '$lib/components/ui/button';
	import { Languages, Globe, Mail, Github, Keyboard } from 'lucide-svelte';
	import { useKeyboardShortcuts, type KeyboardShortcut } from '$lib/hooks/useKeyboardShortcuts.svelte';
	import { getCanCompress, buildConfig } from '$lib/stores/compression-state.svelte';
	import { compressImages } from '$lib/utils/tauri-commands';

	// Event listeners setup
	let unlistenProgress: (() => void) | null = null;
	let unlistenComplete: (() => void) | null = null;

	// Keyboard shortcuts state
	let showShortcutsDialog = $state(false);

	function toggleLanguage() {
		const currentLang = getLocale();
		const newLang = currentLang === 'en' ? 'de' : 'en';
		// setLocale will automatically save to localStorage and reload the page
		setLocale(newLang);
	}

	// Keyboard shortcuts handlers
	async function handleCompress() {
		if (!getCanCompress()) return;

		try {
			compressionState.isCompressing = true;
			compressionState.progress = null;

			const config = buildConfig();
			const result = await compressImages(config);

			// Result will be handled by the event listener
			console.log('Compression complete:', result);
		} catch (error) {
			console.error('Compression error:', error);
			compressionState.isCompressing = false;
		}
	}

	function handleClearAll() {
		if (!compressionState.showResults) {
			compressionState.selectedImages = [];
		}
	}

	function handleEscape() {
		if (compressionState.showResults) {
			compressionState.showResults = false;
			compressionState.result = null;
		} else if (compressionState.selectedImages.length > 0) {
			compressionState.selectedImages = [];
		}
	}

	// Define keyboard shortcuts
	const shortcuts: KeyboardShortcut[] = [
		{
			key: 'Enter',
			modifiers: { meta: true, ctrl: true },
			handler: handleCompress,
			description: 'Start compression'
		},
		{
			key: 'c',
			modifiers: { meta: true, ctrl: true, shift: true },
			handler: handleClearAll,
			description: 'Clear all images'
		},
		{
			key: 'Escape',
			handler: handleEscape,
			description: 'Close results or clear images'
		},
		{
			key: '?',
			handler: () => (showShortcutsDialog = !showShortcutsDialog),
			description: 'Toggle shortcuts help'
		}
	];

	// Register keyboard shortcuts
	useKeyboardShortcuts(shortcuts);

	onMount(() => {
		// Set up event listeners
		const setupListeners = async () => {
			// Listen to compression progress events
			unlistenProgress = await listen<ProgressUpdate>('compression:progress', (event) => {
				console.log('[Frontend] Progress event received:', event.payload);
				compressionState.progress = event.payload;
			});

			// Listen to compression complete events
			unlistenComplete = await listen<CompressResult>('compression:complete', (event) => {
				console.log('[Frontend] Compression complete event received:', event.payload);
				compressionState.result = event.payload;
				compressionState.isCompressing = false;
				compressionState.showResults = true;
			});
		};

		setupListeners();

		// Cleanup listeners on component destroy
		return () => {
			if (unlistenProgress) unlistenProgress();
			if (unlistenComplete) unlistenComplete();
		};
	});
</script>

<div class="bg-background flex h-screen flex-col">
	<!-- Header -->
	<header class="border-b px-6 py-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<img src="/logo.png" alt="Aithericon Logo" class="h-8 w-auto" />
				<h1 class="text-2xl font-bold">{m.app_title()}</h1>
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					onclick={() => (showShortcutsDialog = true)}
					title="Keyboard shortcuts"
				>
					<Keyboard class="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" onclick={toggleLanguage} title="Toggle language">
					<Languages class="h-4 w-4" />
				</Button>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="flex-1 overflow-hidden">
		{#if !compressionState.showResults}
			<!-- Professional 3-panel workspace -->
			<CompressionWorkspace />
		{:else}
			<!-- Results Display -->
			<div class="h-full overflow-y-auto p-6">
				<div class="mx-auto max-w-4xl space-y-6">
					<ResultsSummary />
					<ActionButtons />
				</div>
			</div>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="mt-auto border-t px-6 py-4">
		<div class="text-muted-foreground flex items-center justify-between text-xs">
			<div class="flex items-center gap-4">
				<span>{m.footer_copyright()}</span>
				<span class="text-muted-foreground/60">•</span>
				<a
					href="/license"
					data-sveltekit-preload-data="hover"
					class="hover:text-foreground transition-colors"
				>
					{m.footer_license()}
				</a>
				<a
					href="/file-explorer"
					data-sveltekit-preload-data="hover"
					class="hover:text-foreground transition-colors"
				>
					File Explorer Demo
				</a>
				<a
					href="https://aithericon.eu"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-foreground flex items-center gap-1 transition-colors"
				>
					<Globe class="h-3 w-3" />
					<span>{m.footer_website()}</span>
				</a>
				<a
					href="https://github.com/aithericon/image-compressor-tauri"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-foreground flex items-center gap-1 transition-colors"
				>
					<Github class="h-3 w-3" />
					<span>GitHub</span>
				</a>
				<a
					href="mailto:support@aithericon.eu"
					class="hover:text-foreground flex items-center gap-1 transition-colors"
				>
					<Mail class="h-3 w-3" />
					<span>{m.footer_support()}</span>
				</a>
			</div>
		</div>
	</footer>

	<!-- Keyboard Shortcuts Dialog -->
	<KeyboardShortcutsDialog bind:open={showShortcutsDialog} {shortcuts} />
</div>
