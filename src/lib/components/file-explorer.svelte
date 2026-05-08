<script lang="ts">
	import TreeView from '$lib/components/ui/tree-view/tree-view.svelte';
	import TreeViewFolder from '$lib/components/ui/tree-view/tree-view-folder.svelte';
	import TreeViewFile from '$lib/components/ui/tree-view/tree-view-file.svelte';
	import type { IFileExplorerRepository } from '$lib/repositories/fileExplorerRepository';
	import type { FileEntry } from '$lib/types/fileExplorer';
	import type { ImageInfo } from '$lib/types/compression';
	import { Check, ChevronUp, Home, FolderPlus, FolderMinus, Folder, FolderOpen } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';

	// Supported image extensions
	const IMAGE_EXTENSIONS = [
		'.jpg',
		'.jpeg',
		'.png',
		'.gif',
		'.bmp',
		'.webp',
		'.tiff',
		'.tif',
		'.heic',
		'.heif'
	];

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
			// Hide hidden files/folders (starting with .)
			if (entry.name.startsWith('.')) {
				return false;
			}

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

	// Navigate to parent directory
	async function goUp() {
		if (!rootPath) return;

		const parentPath = rootPath.split('/').slice(0, -1).join('/') || '/';
		rootPath = parentPath;
		// Clear the loaded state to force reload
		loadedDirectories = {};
		directoryContents = {};
		folderStates = {};
	}

	// Navigate to home directory
	async function goHome() {
		try {
			const home = await repository.getHomeDirectory();
			rootPath = home;
			// Clear the loaded state to force reload
			loadedDirectories = {};
			directoryContents = {};
			folderStates = {};
		} catch (err) {
			console.error('Failed to navigate to home:', err);
		}
	}

	// Check if we can go up (not at root)
	let canGoUp = $derived(rootPath !== '/' && rootPath !== undefined);

	// Get all image file paths within a directory recursively
	function getAllImagesInDirectory(path: string, entries: FileEntry[]): string[] {
		const imagePaths: string[] = [];

		for (const entry of entries) {
			if (entry.name.startsWith('.')) continue; // Skip hidden

			if (entry.isDirectory) {
				// Recursively get images from subdirectories if loaded
				const children = directoryContents[entry.path];
				if (children) {
					imagePaths.push(...getAllImagesInDirectory(entry.path, children));
				}
			} else if (isImageFile(entry.name)) {
				imagePaths.push(entry.path);
			}
		}

		return imagePaths;
	}

	// Check if all images in a folder are selected
	function areAllImagesInFolderSelected(path: string): boolean {
		const children = directoryContents[path];
		if (!children) return false;

		const imagePaths = getAllImagesInDirectory(path, children);
		if (imagePaths.length === 0) return false;

		return imagePaths.every(imgPath => selectedImages.some(img => img.path === imgPath));
	}

	// Check if any images in a folder are selected
	function hasAnySelectedImages(path: string): boolean {
		const children = directoryContents[path];
		if (!children) return false;

		const imagePaths = getAllImagesInDirectory(path, children);
		if (imagePaths.length === 0) return false;

		return imagePaths.some(imgPath => selectedImages.some(img => img.path === imgPath));
	}

	// Toggle all images in a folder
	async function toggleFolderSelection(path: string, event: MouseEvent) {
		event.stopPropagation();

		// Load directory if not already loaded
		if (!loadedDirectories[path]) {
			await loadDirectory(path);
		}

		const children = directoryContents[path];
		if (!children) return;

		const imagePaths = getAllImagesInDirectory(path, children);
		if (imagePaths.length === 0) return;

		const allSelected = imagePaths.every(imgPath =>
			selectedImages.some(img => img.path === imgPath)
		);

		if (allSelected) {
			// Deselect all - call onFileClick for each selected image
			imagePaths.forEach(imgPath => {
				if (onFileClick) {
					// Extract filename from path
					const filename = imgPath.split('/').pop() || '';
					onFileClick({ path: imgPath, name: filename, isDirectory: false });
				}
			});
		} else {
			// Select all - call onFileClick for each unselected image
			for (const imgPath of imagePaths) {
				const alreadySelected = selectedImages.some(img => img.path === imgPath);
				if (!alreadySelected && onFileClick) {
					// Extract filename from path
					const filename = imgPath.split('/').pop() || '';
					onFileClick({ path: imgPath, name: filename, isDirectory: false });
				}
			}
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
			{@const hasSelectedImages = loadedDirectories[entry.path] && hasAnySelectedImages(entry.path)}
			{@const allImagesSelected = loadedDirectories[entry.path] && areAllImagesInFolderSelected(entry.path)}
			<div class="group flex items-center gap-1">
				<TreeViewFolder
					name={entry.name}
					bind:open={folderStates[entry.path]}
					class={isSelected
						? 'rounded-sm bg-accent/50 px-1 cursor-pointer transition-colors flex-1'
						: 'hover:bg-accent/20 rounded-sm px-1 cursor-pointer transition-colors flex-1'}
					onclick={(e: MouseEvent) => {
						// Only select if clicking the folder name, not expanding
						const target = e.target as HTMLElement;
						if (target.closest('button[type="button"]')) {
							e.stopPropagation();
							handleFileClick(entry);
						}
					}}
				>
					{#snippet icon({ open })}
						{#if open}
							<FolderOpen class={hasSelectedImages ? "size-4 flex-shrink-0 text-orange-500" : "size-4 flex-shrink-0"} />
						{:else}
							<Folder class={hasSelectedImages ? "size-4 flex-shrink-0 text-orange-500" : "size-4 flex-shrink-0"} />
						{/if}
					{/snippet}
					{#if loadingDirectories[entry.path]}
						<div class="p-2 text-xs text-muted-foreground">{m.file_explorer_loading()}</div>
					{:else if isLoaded && children && children.length > 0}
						{#each children as child (child.path)}
							{@render fileTreeNode(child)}
						{/each}
					{/if}
				</TreeViewFolder>
				<button
					onclick={(e) => toggleFolderSelection(entry.path, e)}
					class="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-opacity group/btn"
					title={allImagesSelected ? m.file_explorer_deselect_all_tooltip() : m.file_explorer_select_all_tooltip()}
				>
					{#if hasSelectedImages}
						<FolderMinus class="h-3 w-3 text-primary group-hover/btn:text-foreground transition-colors" />
					{:else}
						<FolderPlus class="h-3 w-3 text-muted-foreground group-hover/btn:text-foreground transition-colors" />
					{/if}
				</button>
			</div>
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

<div class="flex flex-col h-full">
	<!-- Navigation toolbar -->
	<div class="flex items-center gap-1 p-2 border-b bg-muted/50">
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7"
			onclick={goHome}
			title={m.file_explorer_home_tooltip()}
		>
			<Home class="h-4 w-4" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7"
			onclick={goUp}
			disabled={!canGoUp}
			title={m.file_explorer_up_tooltip()}
		>
			<ChevronUp class="h-4 w-4" />
		</Button>
		<div class="flex-1 text-xs text-muted-foreground truncate px-2" title={rootPath}>
			{rootPath || '~'}
		</div>
	</div>

	<!-- Tree view -->
	<TreeView class={className}>
		{#if error}
			<div class="text-destructive p-4 text-sm">
				{error}
			</div>
		{:else if isLoadingRoot}
			<div class="p-4 text-sm text-muted-foreground">{m.file_explorer_loading()}</div>
		{:else if rootEntries.length === 0}
			<div class="p-4 text-sm text-muted-foreground italic">{m.file_explorer_empty()}</div>
		{:else}
			{#each rootEntries as entry (entry.path)}
				{@render fileTreeNode(entry)}
			{/each}
		{/if}
	</TreeView>
</div>
