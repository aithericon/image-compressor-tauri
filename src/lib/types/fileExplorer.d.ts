// File Explorer API Types

export interface FileEntry {
	name: string;
	path: string;
	isDirectory: boolean;
	size?: number;
	modifiedAt?: Date;
	children?: FileEntry[];
}

export interface FileMetadata {
	isFile: boolean;
	isDirectory: boolean;
	isSymlink: boolean;
	size: number;
	createdAt?: Date;
	modifiedAt?: Date;
	accessedAt?: Date;
}
