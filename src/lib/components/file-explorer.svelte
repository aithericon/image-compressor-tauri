<script lang="ts">
	import TreeView from '$lib/components/ui/tree-view/tree-view.svelte';
	import TreeViewFolder from '$lib/components/ui/tree-view/tree-view-folder.svelte';
	import TreeViewFile from '$lib/components/ui/tree-view/tree-view-file.svelte';
	import type { IFileExplorerRepository } from '$lib/repositories/fileExplorerRepository';
	import type { FileEntry } from '$lib/types/fileExplorer';

	// Props
	let {
		repository,
		rootPath = $bindable(),
		selectedFile = $bindable(),
		class: className
	}: {
		repository: IFileExplorerRepository;
		rootPath?: string;
		selectedFile?: FileEntry;
		class?: string;
	} = $props();

	// State management for tracking loaded directories
	let loadedDirectories = $state<Record<string, boolean>>({});
	let loadingDirectories = $state<Record<string, boolean>>({});
	let directoryContents = $state<Record<string, FileEntry[]>>({});

	// Root level state
	let rootEntries = $state<FileEntry[]>([]);
	let isLoadingRoot = $state(false);
	let error = $state<string | null>(null);

	// Track folder open states - use object for better reactivity
	let folderStates = $state<Record<string, boolean>>({});

	// Initialize with home directory if no rootPath provided
	$effect(() => {
		if (!rootPath) {
			initializeRoot();
		} else {
			loadRootDirectory();
		}
	});

	// Watch folder states and load directories when opened
	$effect(() => {
		Object.entries(folderStates).forEach(([path, isOpen]) => {
			if (isOpen && !loadedDirectories[path] && !loadingDirectories[path]) {
				loadDirectory(path);
			}
		});
	});

	async function initializeRoot() {
		try {
			isLoadingRoot = true;
			error = null;
			const home = await repository.getHomeDirectory();
			rootPath = home;
			await loadRootDirectory();
		} catch (err) {
			console.error('Failed to initialize root:', err);
			error = `Failed to load home directory: ${err}`;
		} finally {
			isLoadingRoot = false;
		}
	}

	async function loadRootDirectory() {
		if (!rootPath) return;

		try {
			isLoadingRoot = true;
			error = null;
			rootEntries = await repository.listDirectory(rootPath);
			loadedDirectories[rootPath] = true;
			// Initialize folder states for root entries
			rootEntries.forEach((entry) => {
				if (entry.isDirectory && folderStates[entry.path] === undefined) {
					folderStates[entry.path] = false;
				}
			});
		} catch (err) {
			console.error('Failed to load root directory:', err);
			error = `Failed to load directory: ${err}`;
		} finally {
			isLoadingRoot = false;
		}
	}

	async function loadDirectory(path: string) {
		if (loadedDirectories[path] || loadingDirectories[path]) {
			return;
		}

		try {
			loadingDirectories[path] = true;
			const entries = await repository.listDirectory(path);
			directoryContents[path] = entries;
			loadedDirectories[path] = true;
			// Initialize folder states for child entries
			entries.forEach((entry) => {
				if (entry.isDirectory && folderStates[entry.path] === undefined) {
					folderStates[entry.path] = false;
				}
			});
		} catch (err) {
			console.error(`Failed to load directory ${path}:`, err);
		} finally {
			loadingDirectories[path] = false;
		}
	}

	function getChildren(path: string): FileEntry[] {
		return directoryContents[path] || [];
	}

	function handleFileClick(entry: FileEntry) {
		selectedFile = entry;
	}
</script>

<!-- Recursive snippet for rendering tree nodes -->
{#snippet fileTreeNode(entry: FileEntry)}
	{#if entry.isDirectory}
		{@const isSelected = selectedFile?.path === entry.path}
		<TreeViewFolder
			name={entry.name}
			bind:open={folderStates[entry.path]}
			class="{isSelected
				? 'rounded-sm bg-accent/50 px-1'
				: 'hover:bg-accent/20 rounded-sm px-1'} cursor-pointer transition-colors"
			onclick={(e) => {
				// Only select if clicking the folder name, not expanding
				const target = e.target as HTMLElement;
				if (target.closest('button[type="button"]')) {
					e.stopPropagation();
					handleFileClick(entry);
				}
			}}
		>
			{#if loadingDirectories[entry.path]}
				<div class="p-2 text-xs text-muted-foreground">Loading...</div>
			{:else if loadedDirectories[entry.path]}
				{@const children = getChildren(entry.path)}
				{#if children.length === 0}
					<div class="p-2 text-xs text-muted-foreground italic">Empty directory</div>
				{:else}
					{#each children as child (child.path)}
						{@render fileTreeNode(child)}
					{/each}
				{/if}
			{/if}
		</TreeViewFolder>
	{:else}
		<TreeViewFile
			name={entry.name}
			onclick={(e) => {
				e.stopPropagation();
				handleFileClick(entry);
			}}
			class={selectedFile?.path === entry.path ? 'bg-accent text-accent-foreground' : ''}
		/>
	{/if}
{/snippet}

<TreeView class={className}>
	{#if error}
		<div class="text-destructive p-4 text-sm">
			{error}
		</div>
	{:else if isLoadingRoot}
		<div class="p-4 text-sm text-muted-foreground">Loading...</div>
	{:else if rootEntries.length === 0}
		<div class="p-4 text-sm text-muted-foreground italic">Empty directory</div>
	{:else}
		{#each rootEntries as entry (entry.path)}
			{@render fileTreeNode(entry)}
		{/each}
	{/if}
</TreeView>
