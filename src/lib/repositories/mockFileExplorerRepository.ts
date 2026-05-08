import type { IFileExplorerRepository } from './fileExplorerRepository';
import type { FileEntry, FileMetadata } from '$lib/types/fileExplorer';

/**
 * Mock file explorer repository for rapid UI development.
 * Uses static data to simulate a file system without requiring Tauri.
 */

// Mock file system structure
const mockFileSystem: Record<string, FileEntry[]> = {
	'/home/user': [
		{
			name: 'Documents',
			path: '/home/user/Documents',
			isDirectory: true,
			modifiedAt: new Date('2024-01-15')
		},
		{
			name: 'Downloads',
			path: '/home/user/Downloads',
			isDirectory: true,
			modifiedAt: new Date('2024-01-20')
		},
		{
			name: 'Pictures',
			path: '/home/user/Pictures',
			isDirectory: true,
			modifiedAt: new Date('2024-01-18')
		},
		{
			name: 'readme.txt',
			path: '/home/user/readme.txt',
			isDirectory: false,
			size: 1024,
			modifiedAt: new Date('2024-01-10')
		}
	],
	'/home/user/Documents': [
		{
			name: 'Projects',
			path: '/home/user/Documents/Projects',
			isDirectory: true,
			modifiedAt: new Date('2024-01-15')
		},
		{
			name: 'Notes',
			path: '/home/user/Documents/Notes',
			isDirectory: true,
			modifiedAt: new Date('2024-01-12')
		},
		{
			name: 'report.pdf',
			path: '/home/user/Documents/report.pdf',
			isDirectory: false,
			size: 524288,
			modifiedAt: new Date('2024-01-14')
		}
	],
	'/home/user/Documents/Projects': [
		{
			name: 'project-alpha',
			path: '/home/user/Documents/Projects/project-alpha',
			isDirectory: true,
			modifiedAt: new Date('2024-01-15')
		},
		{
			name: 'project-beta',
			path: '/home/user/Documents/Projects/project-beta',
			isDirectory: true,
			modifiedAt: new Date('2024-01-13')
		}
	],
	'/home/user/Documents/Projects/project-alpha': [
		{
			name: 'src',
			path: '/home/user/Documents/Projects/project-alpha/src',
			isDirectory: true,
			modifiedAt: new Date('2024-01-15')
		},
		{
			name: 'package.json',
			path: '/home/user/Documents/Projects/project-alpha/package.json',
			isDirectory: false,
			size: 2048,
			modifiedAt: new Date('2024-01-15')
		},
		{
			name: 'README.md',
			path: '/home/user/Documents/Projects/project-alpha/README.md',
			isDirectory: false,
			size: 4096,
			modifiedAt: new Date('2024-01-14')
		}
	],
	'/home/user/Downloads': [
		{
			name: 'image1.jpg',
			path: '/home/user/Downloads/image1.jpg',
			isDirectory: false,
			size: 1048576,
			modifiedAt: new Date('2024-01-20')
		},
		{
			name: 'image2.jpg',
			path: '/home/user/Downloads/image2.jpg',
			isDirectory: false,
			size: 2097152,
			modifiedAt: new Date('2024-01-19')
		}
	],
	'/home/user/Pictures': [
		{
			name: 'vacation',
			path: '/home/user/Pictures/vacation',
			isDirectory: true,
			modifiedAt: new Date('2024-01-18')
		},
		{
			name: 'screenshot.png',
			path: '/home/user/Pictures/screenshot.png',
			isDirectory: false,
			size: 512000,
			modifiedAt: new Date('2024-01-17')
		}
	]
};

export const mockFileExplorerRepository: IFileExplorerRepository = {
	async listDirectory(path: string): Promise<FileEntry[]> {
		console.log(`[MOCK] Listing directory: ${path}`);
		// Simulate network delay for realism
		await new Promise((resolve) => setTimeout(resolve, 300));

		const entries = mockFileSystem[path] || [];
		return entries;
	},

	async getMetadata(path: string): Promise<FileMetadata | null> {
		console.log(`[MOCK] Getting metadata for: ${path}`);
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Search for the entry in mock file system
		for (const entries of Object.values(mockFileSystem)) {
			const entry = entries.find((e) => e.path === path);
			if (entry) {
				return {
					isFile: !entry.isDirectory,
					isDirectory: entry.isDirectory,
					isSymlink: false,
					size: entry.size || 0,
					modifiedAt: entry.modifiedAt,
					createdAt: entry.modifiedAt,
					accessedAt: new Date()
				};
			}
		}

		return null;
	},

	async exists(path: string): Promise<boolean> {
		console.log(`[MOCK] Checking existence of: ${path}`);
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Check if path exists in mock file system
		if (mockFileSystem[path]) {
			return true;
		}

		for (const entries of Object.values(mockFileSystem)) {
			if (entries.some((e) => e.path === path)) {
				return true;
			}
		}

		return false;
	},

	async getHomeDirectory(): Promise<string> {
		console.log('[MOCK] Getting home directory');
		await new Promise((resolve) => setTimeout(resolve, 50));
		return '/home/user';
	}
};
