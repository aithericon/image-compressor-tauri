<script lang="ts">
	import FileExplorer from '$lib/components/file-explorer.svelte';
	import FileDetails from '$lib/components/file-details.svelte';
	import { mockFileExplorerRepository, tauriFileExplorerRepository } from '$lib/repositories';
	import type { IFileExplorerRepository } from '$lib/repositories';
	import type { FileEntry } from '$lib/types/fileExplorer';

	let repository = $state<IFileExplorerRepository>(mockFileExplorerRepository);
	let rootPath = $state<string>();
	let selectedFile = $state<FileEntry | undefined>();
	let useMock = $state(true);
	let switchError = $state<string | null>(null);

	// Toggle between mock and Tauri implementations
	async function toggleImplementation() {
		switchError = null;
		useMock = !useMock;

		if (useMock) {
			repository = mockFileExplorerRepository;
			rootPath = undefined; // Reset to trigger reload
		} else {
			try {
				repository = tauriFileExplorerRepository;
				rootPath = undefined; // Reset to trigger reload
			} catch (err) {
				switchError = 'Tauri APIs only available in Tauri context. Run with "npm run tauri:dev"';
				useMock = true;
				repository = mockFileExplorerRepository;
			}
		}
	}
</script>

<div class="container mx-auto p-8">
	<div class="mb-6">
		<a
			href="/"
			class="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				></path>
			</svg>
			Back to Image Compressor
		</a>
	</div>

	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">File Explorer Demo</h1>
		<p class="text-muted-foreground mb-4">
			This demonstrates the file explorer component with lazy loading and the Repository Pattern.
		</p>

		<div class="mb-4 space-y-2">
			<div class="flex items-center gap-4">
				<button
					onclick={toggleImplementation}
					class="rounded-md {useMock
						? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
						: 'bg-primary text-primary-foreground hover:bg-primary/90'} px-4 py-2 text-sm font-medium transition-colors"
				>
					<span class="flex items-center gap-2">
						{#if useMock}
							<svg
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
								></path>
							</svg>
							Mock Data (Browser)
						{:else}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
								></path>
							</svg>
							Real File System (Tauri)
						{/if}
					</span>
				</button>
				<span class="text-sm text-muted-foreground">
					Click to switch between implementations
				</span>
			</div>

			{#if switchError}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					<strong>Note:</strong>
					{switchError}
				</div>
			{/if}

			{#if rootPath}
				<div class="text-sm">
					<span class="font-medium">Current Root:</span>
					<code class="bg-muted rounded px-2 py-1 ml-2">{rootPath}</code>
				</div>
			{/if}
		</div>

		<div class="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
			<h2 class="font-semibold">Features Demonstrated:</h2>
			<ul class="list-disc list-inside space-y-1 text-muted-foreground">
				<li><strong>Lazy Loading:</strong> Directories load their contents only when expanded</li>
				<li>
					<strong>Repository Pattern:</strong> Switch between mock and Tauri implementations seamlessly
				</li>
				<li><strong>Recursive Rendering:</strong> Handles any directory depth using Svelte snippets</li>
				<li><strong>Tree View Component:</strong> Uses shadcn-svelte tree-view from extras</li>
				<li><strong>Loading States:</strong> Shows loading indicators while fetching directory contents</li>
				<li><strong>Error Handling:</strong> Gracefully handles failed directory reads</li>
			</ul>
		</div>
	</div>

	<div class="bg-card border rounded-lg overflow-hidden">
		<div class="border-b p-4">
			<h2 class="text-xl font-semibold">File System Explorer</h2>
			<p class="text-sm text-muted-foreground mt-1">
				Click on a file to view its details
			</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-x">
			<!-- File Tree -->
			<div class="bg-background p-4 max-h-[600px] overflow-auto">
				<FileExplorer {repository} bind:rootPath bind:selectedFile />
			</div>

			<!-- File Details -->
			<div class="bg-background max-h-[600px] overflow-hidden">
				<FileDetails {selectedFile} />
			</div>
		</div>
	</div>

	<div class="mt-8 bg-muted/50 rounded-lg p-6">
		<h2 class="text-lg font-semibold mb-3">Implementation Notes</h2>
		<div class="space-y-3 text-sm text-muted-foreground">
			<div>
				<h3 class="font-medium text-foreground mb-1">Development (Current Mode - Mock)</h3>
				<p>
					Uses static mock data defined in
					<code class="bg-background rounded px-1.5 py-0.5">mockFileExplorerRepository.ts</code>.
					No Tauri required, perfect for rapid UI development and testing.
				</p>
			</div>
			<div>
				<h3 class="font-medium text-foreground mb-1">Production (Tauri)</h3>
				<p>
					Switch to
					<code class="bg-background rounded px-1.5 py-0.5">tauriFileExplorerRepository</code> to
					access the real file system via Tauri's
					<code class="bg-background rounded px-1.5 py-0.5">@tauri-apps/plugin-fs</code>.
				</p>
			</div>
			<div>
				<h3 class="font-medium text-foreground mb-1">Required Permissions</h3>
				<p>
					For Tauri implementation, configure permissions in
					<code class="bg-background rounded px-1.5 py-0.5">src-tauri/capabilities/</code>:
				</p>
				<pre class="bg-background rounded p-2 mt-2 overflow-x-auto"><code>{`{
  "permissions": [
    "fs:allow-read-recursive",
    "fs:allow-stat",
    "path:default"
  ]
}`}</code></pre>
			</div>
		</div>
	</div>
</div>
