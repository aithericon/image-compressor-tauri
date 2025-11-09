import type { FileEntry, FileMetadata } from '$lib/types/fileExplorer';

/**
 * Repository interface for file explorer operations.
 * This abstraction allows us to swap between mock (browser-based)
 * and real (Tauri-based) implementations seamlessly.
 */
export interface IFileExplorerRepository {
	/**
	 * Lists the contents of a directory (non-recursive)
	 * @param path - The directory path to list
	 * @returns Array of file entries
	 */
	listDirectory(path: string): Promise<FileEntry[]>;

	/**
	 * Gets metadata for a specific file or directory
	 * @param path - The file/directory path
	 * @returns File metadata
	 */
	getMetadata(path: string): Promise<FileMetadata | null>;

	/**
	 * Checks if a path exists
	 * @param path - The path to check
	 * @returns True if exists, false otherwise
	 */
	exists(path: string): Promise<boolean>;

	/**
	 * Gets the user's home directory path
	 * @returns Home directory path
	 */
	getHomeDirectory(): Promise<string>;
}
