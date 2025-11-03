<script lang="ts">
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import FileSelector from '$lib/components/FileSelector.svelte';
	import ImageList from '$lib/components/ImageList.svelte';
	import CompressionSettings from '$lib/components/CompressionSettings.svelte';
	import CompressButton from '$lib/components/CompressButton.svelte';
	import ResultsSummary from '$lib/components/ResultsSummary.svelte';
	import ActionButtons from '$lib/components/ActionButtons.svelte';
	import { compressionState } from '$lib/stores/compression-state.svelte';
	import { onMount } from 'svelte';
	import { listen } from '@tauri-apps/api/event';
	import type { ProgressUpdate, CompressResult } from '$lib/types/compression';
	import * as m from '$lib/paraglide/messages';
	import { setLocale, getLocale } from '$lib/paraglide/runtime';
	import { Button } from '$lib/components/ui/button';
	import { Languages, Globe, Mail, Github } from 'lucide-svelte';

	// Event listeners setup
	let unlistenProgress: (() => void) | null = null;
	let unlistenComplete: (() => void) | null = null;

	function toggleLanguage() {
		const currentLang = getLocale();
		const newLang = currentLang === 'en' ? 'de' : 'en';
		// setLocale will automatically save to localStorage and reload the page
		setLocale(newLang);
	}

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
				<Button variant="ghost" size="icon" onclick={toggleLanguage} title="Toggle language">
					<Languages class="h-4 w-4" />
				</Button>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="flex-1 overflow-y-auto p-6">
		<div class="mx-auto max-w-4xl space-y-6">
			<!-- File Selection -->
			{#if !compressionState.showResults}
				<FileSelector />
			{/if}

			<!-- Image List -->
			{#if compressionState.selectedImages.length > 0 && !compressionState.showResults}
				<ImageList />
			{/if}

			<!-- Compression Settings -->
			{#if compressionState.selectedImages.length > 0 && !compressionState.showResults}
				<CompressionSettings />
			{/if}

			<!-- Compress Button (with integrated progress bar) -->
			{#if compressionState.selectedImages.length > 0 && !compressionState.showResults}
				<CompressButton />
			{/if}

			<!-- Results Display -->
			{#if compressionState.showResults && compressionState.result}
				<ResultsSummary />
				<ActionButtons />
			{/if}
		</div>
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
</div>
