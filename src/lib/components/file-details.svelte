<script lang="ts">
	import type { FileEntry } from '$lib/types/fileExplorer';
	import { File, Folder, Calendar, HardDrive } from 'lucide-svelte';

	let { selectedFile }: { selectedFile?: FileEntry } = $props();

	function formatBytes(bytes: number | undefined): string {
		if (!bytes) return 'Unknown';
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes === 0) return '0 Bytes';
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
	}

	function formatDate(date: Date | undefined): string {
		if (!date) return 'Unknown';
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(date);
	}

	function getFileExtension(filename: string): string {
		const ext = filename.split('.').pop();
		return ext && ext !== filename ? ext.toUpperCase() : 'File';
	}
</script>

<div class="flex h-full flex-col">
	{#if selectedFile}
		<div class="border-b p-4">
			<div class="flex items-start gap-3">
				<div class="rounded-lg bg-primary/10 p-3">
					{#if selectedFile.isDirectory}
						<Folder class="h-8 w-8 text-primary" />
					{:else}
						<File class="h-8 w-8 text-primary" />
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-semibold truncate">{selectedFile.name}</h3>
					<p class="text-sm text-muted-foreground">
						{selectedFile.isDirectory ? 'Folder' : getFileExtension(selectedFile.name)}
					</p>
				</div>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto p-4 space-y-4">
			<!-- Path -->
			<div>
				<h4 class="text-sm font-medium mb-2 flex items-center gap-2">
					<HardDrive class="h-4 w-4" />
					Location
				</h4>
				<div class="rounded-md bg-muted p-3">
					<code class="text-xs break-all">{selectedFile.path}</code>
				</div>
			</div>

			<!-- Size -->
			{#if !selectedFile.isDirectory}
				<div>
					<h4 class="text-sm font-medium mb-2">Size</h4>
					<p class="text-sm text-muted-foreground">
						{formatBytes(selectedFile.size)}
						{#if selectedFile.size}
							<span class="text-xs">({selectedFile.size.toLocaleString()} bytes)</span>
						{/if}
					</p>
				</div>
			{/if}

			<!-- Modified Date -->
			<div>
				<h4 class="text-sm font-medium mb-2 flex items-center gap-2">
					<Calendar class="h-4 w-4" />
					Modified
				</h4>
				<p class="text-sm text-muted-foreground">{formatDate(selectedFile.modifiedAt)}</p>
			</div>

			<!-- Type -->
			<div>
				<h4 class="text-sm font-medium mb-2">Type</h4>
				<p class="text-sm text-muted-foreground">
					{selectedFile.isDirectory ? 'Directory' : 'File'}
				</p>
			</div>

			<!-- Additional Info -->
			<div class="pt-4 border-t">
				<h4 class="text-sm font-medium mb-3">Properties</h4>
				<dl class="space-y-2 text-sm">
					<div class="flex justify-between">
						<dt class="text-muted-foreground">Name:</dt>
						<dd class="font-medium text-right">{selectedFile.name}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-muted-foreground">Extension:</dt>
						<dd class="font-medium">
							{selectedFile.isDirectory
								? 'N/A'
								: selectedFile.name.includes('.')
									? '.' + selectedFile.name.split('.').pop()
									: 'None'}
						</dd>
					</div>
					{#if !selectedFile.isDirectory && selectedFile.size}
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Readable:</dt>
							<dd class="font-medium">Yes</dd>
						</div>
					{/if}
				</dl>
			</div>
		</div>
	{:else}
		<div class="flex h-full items-center justify-center p-8 text-center">
			<div class="space-y-2">
				<div class="mx-auto rounded-lg bg-muted p-4 w-fit">
					<File class="h-12 w-12 text-muted-foreground" />
				</div>
				<p class="text-sm font-medium">No file selected</p>
				<p class="text-xs text-muted-foreground">Select a file to view its details</p>
			</div>
		</div>
	{/if}
</div>
