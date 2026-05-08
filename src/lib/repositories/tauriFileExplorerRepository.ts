import type { IFileExplorerRepository } from './fileExplorerRepository';
import type { FileEntry, FileMetadata } from '$lib/types/fileExplorer';
import { readDir, stat, exists as fsExists } from '@tauri-apps/plugin-fs';
import { homeDir } from '@tauri-apps/api/path';

/**
 * Production file explorer repository using Tauri's file system plugin.
 * Provides real file system access with proper security scoping.
 */
export const tauriFileExplorerRepository: IFileExplorerRepository = {
	async listDirectory(path: string): Promise<FileEntry[]> {
		try {
			console.log(`[TAURI] Listing directory: ${path}`);

			const entries = await readDir(path);
			console.log(`[TAURI] Found ${entries.length} entries in ${path}`);

			const fileEntries: FileEntry[] = await Promise.all(
				entries.map(async (entry) => {
					// Properly construct path (handle trailing slashes)
					const fullPath = path.endsWith('/') ? `${path}${entry.name}` : `${path}/${entry.name}`;
					let size: number | undefined;
					let modifiedAt: Date | undefined;

					// Try to get metadata, but don't fail if we can't
					try {
						const metadata = await stat(fullPath);
						size = metadata.isFile ? Number(metadata.size) : undefined;
						modifiedAt = metadata.mtime ? new Date(metadata.mtime) : undefined;
					} catch (err) {
						// Just log and continue - show the file/folder even without metadata
						const errorMessage = String(err);
						if (errorMessage.includes('forbidden path')) {
							console.debug(`[TAURI] No permission for ${fullPath}`);
						} else {
							console.warn(`[TAURI] Failed to get metadata for ${fullPath}:`, err);
						}
						// Continue anyway - we'll show the file without size/date info
					}

					return {
						name: entry.name,
						path: fullPath,
						isDirectory: entry.isDirectory,
						size,
						modifiedAt
					};
				})
			);

			// Sort: directories first, then files, alphabetically within each group
			const sorted = fileEntries.sort((a, b) => {
				if (a.isDirectory && !b.isDirectory) return -1;
				if (!a.isDirectory && b.isDirectory) return 1;
				return a.name.localeCompare(b.name);
			});

			console.log(
				`[TAURI] Returning ${sorted.length} entries (${sorted.filter((e) => e.isDirectory).length} dirs, ${sorted.filter((e) => !e.isDirectory).length} files)`
			);

			return sorted;
		} catch (error) {
			console.error(`Failed to list directory ${path}:`, error);
			throw new Error(`Failed to list directory: ${error}`);
		}
	},

	async getMetadata(path: string): Promise<FileMetadata | null> {
		try {
			console.log(`[TAURI] Getting metadata for: ${path}`);
			const metadata = await stat(path);

			return {
				isFile: metadata.isFile,
				isDirectory: metadata.isDirectory,
				isSymlink: metadata.isSymlink,
				size: Number(metadata.size),
				createdAt: metadata.birthtime ? new Date(metadata.birthtime) : undefined,
				modifiedAt: metadata.mtime ? new Date(metadata.mtime) : undefined,
				accessedAt: metadata.atime ? new Date(metadata.atime) : undefined
			};
		} catch (error) {
			console.error(`Failed to get metadata for ${path}:`, error);
			return null;
		}
	},

	async exists(path: string): Promise<boolean> {
		try {
			console.log(`[TAURI] Checking existence of: ${path}`);
			return await fsExists(path);
		} catch (error) {
			console.error(`Failed to check existence of ${path}:`, error);
			return false;
		}
	},

	async getHomeDirectory(): Promise<string> {
		try {
			console.log('[TAURI] Getting home directory');
			const home = await homeDir();
			return home;
		} catch (error) {
			console.error('Failed to get home directory:', error);
			throw new Error(`Failed to get home directory: ${error}`);
		}
	}
};
