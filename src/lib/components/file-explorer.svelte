<script lang="ts">
	import TreeView from '$lib/components/ui/tree-view/tree-view.svelte';
	import TreeViewFolder from '$lib/components/ui/tree-view/tree-view-folder.svelte';
	import TreeViewFile from '$lib/components/ui/tree-view/tree-view-file.svelte';
	import type { IFileExplorerRepository } from '$lib/repositories/fileExplorerRepository';
	import type { FileEntry } from '$lib/types/fileExplorer';
	import type { ImageInfo } from '$lib/types/compression';
	import { Check } from 'lucide-svelte';

	// Supported image extensions
	const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'];

	// Props
	let {
		repository,
		rootPath = $bindable(),
		selectedFile = $bindable(),
		selectedImages = [],
		onFileClick,
		class: className
	}: {
		repository: IFileExplorerRepository;
		rootPath?: string;
		selectedFile?: FileEntry;
		selectedImages?: ImageInfo[];
		onFileClick?: (file: FileEntry) => void;
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
			const entries = await repository.listDirectory(rootPath);
			rootEntries = filterImageEntries(entries);
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

	// Check if a file is a supported image
	function isImageFile(filename: string): boolean {
		const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
		return IMAGE_EXTENSIONS.includes(ext);
	}

	// Check if an image is already selected
	function isImageSelected(path: string): boolean {
		return selectedImages.some((img) => img.path === path);
	}

	// Filter entries to only show images and directories that contain images
	function filterImageEntries(entries: FileEntry[]): FileEntry[] {
		return entries.filter((entry) => {
			if (entry.isDirectory) {
				// Show directories (we'll check if they're empty when loading)
				return true;
			}
			// Only show image files
			return isImageFile(entry.name);
		});
	}

	// Get filtered children for a directory
	function getChildren(path: string): FileEntry[] {
		const children = directoryContents[path] || [];
		return filterImageEntries(children);
	}

	function handleFileClick(entry: FileEntry) {
		selectedFile = entry;
		// Call the callback if provided
		if (onFileClick) {
			onFileClick(entry);
		}
	}
</script>

<!-- Recursive snippet for rendering tree nodes -->
{#snippet fileTreeNode(entry: FileEntry)}
	{#if entry.isDirectory}
		{@const isLoaded = loadedDirectories[entry.path]}
		{@const children = isLoaded ? getChildren(entry.path) : null}
		{@const isEmpty = isLoaded && children !== null && children.length === 0}

		{#if !isEmpty}
			{@const isSelected = selectedFile?.path === entry.path}
			<TreeViewFolder
				name={entry.name}
				bind:open={folderStates[entry.path]}
				class={isSelected
					? 'rounded-sm bg-accent/50 px-1 cursor-pointer transition-colors'
					: 'hover:bg-accent/20 rounded-sm px-1 cursor-pointer transition-colors'}
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
				{:else if isLoaded && children && children.length > 0}
					{#each children as child (child.path)}
						{@render fileTreeNode(child)}
					{/each}
				{/if}
			</TreeViewFolder>
		{/if}
	{:else}
		{@const isAlreadySelected = isImageSelected(entry.path)}
		<div class="relative">
			<TreeViewFile
				name={entry.name}
				onclick={(e) => {
					e.stopPropagation();
					handleFileClick(entry);
				}}
				class={isAlreadySelected
					? 'bg-primary/20 text-primary font-medium'
					: selectedFile?.path === entry.path
						? 'bg-accent text-accent-foreground'
						: ''}
			/>
			{#if isAlreadySelected}
				<Check class="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-primary" />
			{/if}
		</div>
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
