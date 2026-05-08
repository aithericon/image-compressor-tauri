# File Explorer Implementation

## Overview

This is a proof-of-concept implementation of a file system explorer component for the Tauri application. It demonstrates the integration of Tauri's file system plugin with shadcn-svelte's tree view component, using the Repository Pattern for seamless switching between mock and production implementations.

## Architecture

### Components

1. **FileExplorer Component** (`src/lib/components/file-explorer.svelte`)
   - Recursive tree view with lazy loading
   - Loads directory contents only when folders are expanded
   - Uses Svelte 5 snippets for recursive rendering
   - Handles loading states and errors gracefully

2. **Repository Pattern**
   - **Interface**: `IFileExplorerRepository` (src/lib/repositories/fileExplorerRepository.ts)
   - **Mock Implementation**: `mockFileExplorerRepository` (src/lib/repositories/mockFileExplorerRepository.ts)
   - **Tauri Implementation**: `tauriFileExplorerRepository` (src/lib/repositories/tauriFileExplorerRepository.ts)

### Features

- **Lazy Loading**: Directories load children only when expanded, improving performance for large file systems
- **Recursive Rendering**: Uses Svelte 5 snippets to handle unlimited directory depth
- **Loading States**: Shows "Loading..." indicators while fetching data
- **Error Handling**: Graceful degradation when directories can't be read
- **Repository Pattern**: Easy switching between mock (browser) and production (Tauri) data sources

## File Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── file-explorer.svelte           # Main file explorer component
│   │   │   └── ui/tree-view/                  # shadcn-svelte tree view components
│   │   │       ├── tree-view.svelte
│   │   │       ├── tree-view-folder.svelte
│   │   │       └── tree-view-file.svelte
│   │   ├── repositories/
│   │   │   ├── fileExplorerRepository.ts      # Repository interface
│   │   │   ├── mockFileExplorerRepository.ts  # Mock implementation
│   │   │   ├── tauriFileExplorerRepository.ts # Tauri implementation
│   │   │   └── index.ts                       # Central exports
│   │   └── types/
│   │       └── fileExplorer.d.ts              # TypeScript types
│   └── routes/
│       └── file-explorer/
│           └── +page.svelte                   # Demo page
└── package.json
```

## Usage

### Basic Usage

```svelte
<script lang="ts">
  import FileExplorer from '$lib/components/file-explorer.svelte';
  import { mockFileExplorerRepository } from '$lib/repositories';

  let rootPath = $state<string>();
</script>

<FileExplorer
  repository={mockFileExplorerRepository}
  bind:rootPath
/>
```

### Switching to Tauri Implementation

```svelte
<script lang="ts">
  import FileExplorer from '$lib/components/file-explorer.svelte';
  import { tauriFileExplorerRepository } from '$lib/repositories';

  let rootPath = $state<string>();
</script>

<FileExplorer
  repository={tauriFileExplorerRepository}
  bind:rootPath
/>
```

## Development

### Mock Mode (Current)

The mock implementation uses static data defined in `mockFileExplorerRepository.ts`. This allows for:
- Rapid UI development without Tauri
- Testing in regular browsers
- Predictable test data

### Production Mode (Tauri)

To use the real file system:

1. **Install Dependencies** (Already done)
   ```bash
   npm install @tauri-apps/plugin-fs
   ```

2. **Configure Permissions** in `src-tauri/capabilities/default.json`:
   ```json
   {
     "permissions": [
       "fs:allow-read-recursive",
       "fs:allow-stat",
       "path:default"
     ]
   }
   ```

3. **Update Component Import**:
   ```typescript
   import { tauriFileExplorerRepository } from '$lib/repositories';
   ```

## Testing

Visit the demo page at `http://localhost:5175/file-explorer` to see the component in action.

The demo page includes:
- Live file explorer with mock data
- Toggle between mock and Tauri implementations
- Implementation notes and examples
- Permission configuration guide

## API Reference

### IFileExplorerRepository Interface

```typescript
interface IFileExplorerRepository {
  listDirectory(path: string): Promise<FileEntry[]>;
  getMetadata(path: string): Promise<FileMetadata | null>;
  exists(path: string): Promise<boolean>;
  getHomeDirectory(): Promise<string>;
}
```

### FileEntry Type

```typescript
interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: Date;
  children?: FileEntry[];
}
```

### FileExplorer Props

```typescript
{
  repository: IFileExplorerRepository;  // Required: Repository implementation
  rootPath?: string;                    // Optional: Root directory path (bindable)
  class?: string;                       // Optional: CSS classes
}
```

## Future Enhancements

1. **File Watching**: Use Tauri's `watch()` API for live file system updates
2. **File Operations**: Add support for create, delete, rename operations
3. **Icons by File Type**: Custom icons based on file extensions
4. **Context Menus**: Right-click menu for file operations
5. **Search**: File/directory search within the tree
6. **Multi-Select**: Select multiple files/folders
7. **Drag & Drop**: File operations via drag and drop

## Dependencies

- `@tauri-apps/plugin-fs`: Tauri file system plugin
- `@tauri-apps/api`: Tauri API (for path utilities)
- `shadcn-svelte` tree view component (from extras)
- Svelte 5 with runes support

## Notes

- The component uses Svelte 5's new runes system (`$state`, `$effect`, `$props`)
- Recursive rendering is achieved using Svelte 5 snippets
- The implementation follows the Repository Pattern from CLAUDE.md
- Loading is optimized with lazy evaluation and caching
