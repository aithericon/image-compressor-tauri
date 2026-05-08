/**
 * Central repository exports.
 * Allows easy switching between mock and production implementations.
 */

// File Explorer Repository
export { mockFileExplorerRepository } from './mockFileExplorerRepository';
export { tauriFileExplorerRepository } from './tauriFileExplorerRepository';
export type { IFileExplorerRepository } from './fileExplorerRepository';

// To switch between implementations, just change the import:
// Development (no Tauri needed):
//   import { mockFileExplorerRepository as fileExplorerRepository } from '$lib/repositories';
// Production (Tauri):
//   import { tauriFileExplorerRepository as fileExplorerRepository } from '$lib/repositories';
