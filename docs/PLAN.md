# Image Compressor - Implementation Plan

> **Project Goal:** Transform the SvelteKit + Tauri starter into a minimal, user-friendly desktop app for bulk image compression to JPG format, primarily targeting Windows users.

## Table of Contents

- [1. Technology Stack](#1-technology-stack)
- [2. Backend Architecture (Rust/Tauri)](#2-backend-architecture-rusttauri)
- [3. Frontend Architecture (SvelteKit + Svelte 5)](#3-frontend-architecture-sveltekit--svelte-5)
- [4. User Interface Design](#4-user-interface-design)
- [5. Implementation Phases](#5-implementation-phases)
- [6. Technical Considerations](#6-technical-considerations)
- [7. File Structure](#7-file-structure)
- [8. Testing Strategy](#8-testing-strategy)
- [9. Deployment](#9-deployment)
- [10. Future Enhancements](#10-future-enhancements)

---

## 1. Technology Stack

### Core Technologies
- **Framework**: SvelteKit with Svelte 5 (runes)
- **Desktop Runtime**: Tauri v2
- **Language**: TypeScript (frontend) + Rust (backend)
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn-svelte
- **Image Processing**: `image_compressor` (Rust crate)

### Key Libraries
- **Backend**:
  - `image_compressor` - Core compression library
  - `tokio` - Async runtime
  - `walkdir` - Directory traversal
  - `tauri-plugin-dialog` - File/folder pickers
  - `tauri-plugin-shell` - Open in Explorer
- **Frontend**:
  - Existing shadcn-svelte components (Button, Card, Slider, Progress, Badge, etc.)

---

## 2. Backend Architecture (Rust/Tauri)

### 2.1 Dependencies to Add

Add to `src-tauri/Cargo.toml`:

```toml
[dependencies]
image_compressor = "0.1.4"
tokio = { version = "1", features = ["full"] }
walkdir = "2.4"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
log = "0.4"
tauri = { version = "2.8.5", features = [] }
tauri-plugin-log = "2"
tauri-plugin-dialog = "2.0"
tauri-plugin-shell = "2.0"
```

### 2.2 Core Tauri Commands

#### File/Folder Selection
- **`select_folder()`** → `Option<String>`
  - Opens folder picker dialog
  - Returns selected folder path

- **`select_files()`** → `Vec<String>`
  - Opens file picker for multiple images
  - Filters for image extensions (.jpg, .png, .bmp, .gif, .webp, etc.)
  - Returns array of selected file paths

- **`open_in_explorer(path: String)`** → `Result<(), String>`
  - Opens folder in Windows Explorer / Finder / File Manager
  - Cross-platform implementation

#### Compression Operations
- **`compress_images(config: CompressionConfig)`** → `Result<CompressResult, String>`
  - Main compression function
  - Inputs: source paths, output folder, quality (0-100), size ratio (0-1)
  - Returns: `CompressResult` with success/failure counts and details
  - Emits `compression:progress` events during processing

- **`analyze_images(paths: Vec<String>)`** → `Vec<ImageInfo>`
  - Scans images without compressing
  - Returns: Array of `ImageInfo` with original size, format, dimensions
  - Calculates estimated compressed sizes based on typical ratios

#### Utility Commands
- **`get_default_output_folder()`** → `String`
  - Returns platform-specific default path
  - Windows: `%USERPROFILE%/Documents/CompressedImages`
  - macOS/Linux: `~/Documents/CompressedImages`

- **`validate_paths(paths: Vec<String>)`** → `Vec<PathValidation>`
  - Checks if paths exist and are valid images
  - Returns validation results per path

### 2.3 Data Structures (Rust)

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct CompressionConfig {
    pub source_paths: Vec<String>,
    pub output_folder: String,
    pub quality: f32,        // 0-100
    pub size_ratio: f32,     // 0-1
    pub thread_count: usize,
    pub preserve_structure: bool,  // Keep folder structure
}

#[derive(Serialize, Clone)]
pub struct ImageInfo {
    pub path: String,
    pub filename: String,
    pub original_size: u64,      // bytes
    pub estimated_size: u64,     // estimated after compression
    pub format: String,          // PNG, JPEG, BMP, etc.
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Clone)]
pub struct CompressResult {
    pub total: usize,
    pub successful: usize,
    pub failed: usize,
    pub saved_bytes: u64,
    pub errors: Vec<ImageError>,
    pub duration_ms: u128,
}

#[derive(Serialize, Clone)]
pub struct ImageError {
    pub path: String,
    pub filename: String,
    pub error: String,
}

#[derive(Serialize, Clone)]
pub struct ProgressUpdate {
    pub current: usize,
    pub total: usize,
    pub current_file: String,
    pub percent: f32,
}

#[derive(Serialize, Clone)]
pub struct PathValidation {
    pub path: String,
    pub is_valid: bool,
    pub error: Option<String>,
}
```

### 2.4 Event System

**Emit Events:**
- `compression:progress` - Emitted during batch processing
  - Payload: `ProgressUpdate`
  - Frequency: Per image processed

- `compression:complete` - Emitted when batch finishes
  - Payload: `CompressResult`

**Listen in Frontend:**
```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('compression:progress', (event) => {
  const progress = event.payload as ProgressUpdate;
  // Update UI
});
```

### 2.5 Module Structure

Create modular structure in `src-tauri/src/`:

```
src-tauri/src/
├── compression/
│   ├── mod.rs           # Public API
│   ├── analyzer.rs      # Image analysis logic
│   ├── processor.rs     # Batch compression processor
│   └── types.rs         # Shared data structures
├── commands/
│   ├── mod.rs
│   ├── file_ops.rs      # File selection, validation
│   └── compress.rs      # Compression commands
├── lib.rs               # Main entry, command registration
└── main.rs              # Tauri app initialization
```

### 2.6 Error Handling Strategy

- Use `Result<T, String>` for all commands
- Provide user-friendly error messages
- Log detailed errors to file (use tauri-plugin-log)
- Continue processing on individual failures (batch mode)
- Collect all errors and return in `CompressResult`

---

## 3. Frontend Architecture (SvelteKit + Svelte 5)

### 3.1 Page Structure

**Simplified Single-Page Layout:**

```
src/routes/
├── +page.svelte           # Main compression interface
├── +layout.svelte         # Minimal layout (theme only)
└── +page.ts               # Load default settings
```

Remove existing dashboard/settings structure - keep it simple.

### 3.2 Core Components

#### File Management
1. **`FileSelector.svelte`**
   - Drag-and-drop zone with visual feedback
   - File picker button (select multiple files)
   - Folder picker button (select entire folder)
   - File validation (image types only)
   - Visual states: idle, drag-over, processing

2. **`ImageList.svelte`**
   - Scrollable list of selected images
   - Virtual scrolling for large batches (optional optimization)
   - Clear all / Remove individual images
   - Display count and total size

3. **`ImageCard.svelte`**
   - Thumbnail preview (if available)
   - Filename
   - Original size
   - Format badge
   - Remove button

#### Compression Controls
4. **`CompressionSettings.svelte`**
   - Quality slider (0-100) with live value display
   - Size ratio slider (0-1) with percentage display
   - Output folder selector
   - Advanced options toggle (thread count, etc.)
   - Real-time savings estimation display

5. **`CompressButton.svelte`**
   - Primary action button
   - States: idle, compressing, complete
   - Disabled when no images selected

#### Progress & Results
6. **`ProgressBar.svelte`**
   - Linear progress indicator
   - Percentage display
   - Current file name
   - Cancel button (optional)

7. **`ResultsSummary.svelte`**
   - Success/failure counts
   - Before/after total sizes
   - Space saved (MB and %)
   - Processing time
   - List of errors (if any)
   - Success animation

8. **`ActionButtons.svelte`**
   - "Open Output Folder" button
   - "Compress More Images" button
   - "Clear Results" button

### 3.3 State Management (Svelte 5 Runes)

Create `src/lib/stores/compression-state.svelte.ts`:

```typescript
import type {
  ImageInfo,
  CompressResult,
  ProgressUpdate,
  CompressionConfig
} from '$lib/types/compression';

export const compressionState = $state({
  // File selection
  selectedImages: [] as ImageInfo[],
  totalSize: 0,

  // Processing states
  isAnalyzing: false,
  isCompressing: false,

  // Progress tracking
  progress: null as ProgressUpdate | null,

  // Results
  result: null as CompressResult | null,

  // Settings
  settings: {
    quality: 85,
    sizeRatio: 0.8,
    outputFolder: '',
    threadCount: 4,
    preserveStructure: false,
  } as CompressionConfig,

  // UI state
  showResults: false,
  estimatedSavings: 0,
});

// Computed values
export const selectedCount = $derived(compressionState.selectedImages.length);
export const hasSelection = $derived(selectedCount > 0);
export const canCompress = $derived(
  hasSelection &&
  !compressionState.isCompressing &&
  compressionState.settings.outputFolder !== ''
);
```

### 3.4 TypeScript Types

Create `src/lib/types/compression.ts`:

```typescript
// Mirror Rust types for frontend use

export interface CompressionConfig {
  source_paths: string[];
  output_folder: string;
  quality: number;        // 0-100
  size_ratio: number;     // 0-1
  thread_count: number;
  preserve_structure: boolean;
}

export interface ImageInfo {
  path: string;
  filename: string;
  original_size: number;
  estimated_size: number;
  format: string;
  width: number;
  height: number;
}

export interface CompressResult {
  total: number;
  successful: number;
  failed: number;
  saved_bytes: number;
  errors: ImageError[];
  duration_ms: number;
}

export interface ImageError {
  path: string;
  filename: string;
  error: string;
}

export interface ProgressUpdate {
  current: number;
  total: number;
  current_file: string;
  percent: number;
}

export interface PathValidation {
  path: string;
  is_valid: boolean;
  error?: string;
}
```

### 3.5 Utility Functions

Create `src/lib/utils/format.ts`:

```typescript
/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Calculate percentage savings
 */
export function calculateSavings(original: number, compressed: number): number {
  if (original === 0) return 0;
  return ((original - compressed) / original) * 100;
}

/**
 * Estimate compressed size based on quality and size ratio
 */
export function estimateCompressedSize(
  originalSize: number,
  quality: number,
  sizeRatio: number
): number {
  // Rough estimation formula
  const qualityFactor = quality / 100;
  const baseFactor = 0.3 + (qualityFactor * 0.4);
  return Math.floor(originalSize * baseFactor * sizeRatio);
}
```

Create `src/lib/utils/tauri-commands.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import type {
  CompressionConfig,
  ImageInfo,
  CompressResult,
  PathValidation
} from '$lib/types/compression';

export async function selectFolder(): Promise<string | null> {
  return await invoke<string | null>('select_folder');
}

export async function selectFiles(): Promise<string[]> {
  return await invoke<string[]>('select_files');
}

export async function analyzeImages(paths: string[]): Promise<ImageInfo[]> {
  return await invoke<ImageInfo[]>('analyze_images', { paths });
}

export async function compressImages(config: CompressionConfig): Promise<CompressResult> {
  return await invoke<CompressResult>('compress_images', { config });
}

export async function openInExplorer(path: string): Promise<void> {
  await invoke('open_in_explorer', { path });
}

export async function getDefaultOutputFolder(): Promise<string> {
  return await invoke<string>('get_default_output_folder');
}

export async function validatePaths(paths: string[]): Promise<PathValidation[]> {
  return await invoke<PathValidation[]>('validate_paths', { paths });
}
```

---

## 4. User Interface Design

### 4.1 Main Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│  Image Compressor                   [Dark Mode Toggle]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │         Drag & Drop Images or Folders Here         │ │
│  │                                                     │ │
│  │              [Select Files]  [Select Folder]       │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Selected Images (5 files, 6.2 MB)          [Clear All] │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ┌─────────────────────────────────────────┐  [×]   │ │
│  │ │ [📷] image1.png          2.5 MB  PNG    │        │ │
│  │ └─────────────────────────────────────────┘        │ │
│  │ ┌─────────────────────────────────────────┐  [×]   │ │
│  │ │ [📷] photo2.jpg          1.8 MB  JPEG   │        │ │
│  │ └─────────────────────────────────────────┘        │ │
│  │ ┌─────────────────────────────────────────┐  [×]   │ │
│  │ │ [📷] screenshot.bmp      1.9 MB  BMP    │        │ │
│  │ └─────────────────────────────────────────┘        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Compression Settings                                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Quality                                            │ │
│  │  ├───────────────●─────────┤  85%                  │ │
│  │                                                     │ │
│  │  Size Ratio                                         │ │
│  │  ├──────────────●──────────┤  80%                  │ │
│  │                                                     │ │
│  │  Estimated Result: 6.2 MB → 3.1 MB (50% savings)   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Output Folder                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ C:\Users\Name\Documents\CompressedImages  [Change] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│                           [Compress Images]              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Compression Progress State

```
┌─────────────────────────────────────────────────────────┐
│  Compressing Images...                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Processing: image3.bmp                                  │
│                                                          │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░  60% (3 of 5)                │
│                                                          │
│  [Cancel]                                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Results Display

```
┌─────────────────────────────────────────────────────────┐
│  ✓ Compression Complete!                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Successfully compressed: 5 of 5 images                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Original Size:     6.2 MB                         │ │
│  │  Compressed Size:   2.9 MB                         │ │
│  │  Space Saved:       3.3 MB (53%)                   │ │
│  │  Time Taken:        2.3 seconds                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Output: C:\Users\Name\Documents\CompressedImages        │
│                                                          │
│  [Open Output Folder]          [Compress More Images]   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Error Display

```
┌─────────────────────────────────────────────────────────┐
│  ⚠ Compression Completed with Errors                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Successfully compressed: 4 of 5 images                  │
│                                                          │
│  Errors (1):                                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  × corrupted.png - Invalid image format            │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [View Details]  [Open Output Folder]  [Try Again]      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.5 Color Scheme & Design Tokens

Use existing TailwindCSS + shadcn-svelte theme system:

- **Primary Action**: Blue/Indigo
- **Success**: Green
- **Warning**: Yellow/Orange
- **Error**: Red
- **Neutral**: Gray scale
- **Background**: Dark mode support via mode-watcher

---

## 5. Implementation Phases

### Phase 1: Backend Foundation (2-3 days)

**Goal:** Set up Rust backend with compression capabilities

#### Tasks:
1. **Update Cargo.toml**
   - Add all required dependencies
   - Configure feature flags

2. **Create module structure**
   - `src-tauri/src/compression/` directory
   - Create `mod.rs`, `analyzer.rs`, `processor.rs`, `types.rs`

3. **Implement compression module**
   - Wrapper around `image_compressor` library
   - Error handling and validation
   - Progress tracking via channels
   - Thread pool management

4. **Implement Tauri commands**
   - File selection commands (using tauri-plugin-dialog)
   - Image analysis command
   - Compression command with event emission
   - Utility commands

5. **Add Tauri plugins**
   - Configure tauri-plugin-dialog
   - Configure tauri-plugin-shell
   - Update tauri.conf.json permissions

6. **Test backend independently**
   - Unit tests for compression logic
   - Test Tauri commands via DevTools
   - Test with various image formats

**Deliverables:**
- ✅ Working Rust compression backend
- ✅ All Tauri commands implemented
- ✅ Progress events emitting correctly
- ✅ Error handling in place

---

### Phase 2: Frontend Core (1-2 days)

**Goal:** Set up frontend structure and state management

#### Tasks:
1. **Simplify layout**
   - Remove existing dashboard/settings pages
   - Clean up sidebar navigation
   - Create minimal `+layout.svelte`
   - Create empty `+page.svelte`

2. **Create type definitions**
   - `src/lib/types/compression.ts` (mirror Rust types)
   - Add JSDoc comments for clarity

3. **Build state management**
   - `src/lib/stores/compression-state.svelte.ts`
   - Implement reactive state with Svelte 5 runes
   - Add computed values

4. **Create utility functions**
   - `src/lib/utils/format.ts` (formatBytes, formatDuration, etc.)
   - `src/lib/utils/tauri-commands.ts` (typed wrappers)

5. **Set up event listeners**
   - Listen to `compression:progress` events
   - Listen to `compression:complete` events
   - Update state accordingly

**Deliverables:**
- ✅ Clean single-page layout
- ✅ Type-safe Tauri command wrappers
- ✅ State management working
- ✅ Event system connected

---

### Phase 3: UI Components (3-4 days)

**Goal:** Build all user interface components

#### Tasks:
1. **FileSelector component** (Day 1)
   - Drag-and-drop zone with visual states
   - File picker button integration
   - Folder picker button integration
   - File type validation
   - Loading state during analysis

2. **Image display components** (Day 1-2)
   - `ImageList.svelte` - Container with scroll
   - `ImageCard.svelte` - Individual image display
   - Thumbnail generation (optional)
   - Remove individual image functionality

3. **CompressionSettings component** (Day 2)
   - Quality slider with live value
   - Size ratio slider with percentage
   - Output folder selector
   - Real-time savings estimation
   - Advanced settings (collapsible)

4. **Progress components** (Day 3)
   - `ProgressBar.svelte` with smooth animations
   - Current file indicator
   - Cancel button (optional)

5. **Results components** (Day 3-4)
   - `ResultsSummary.svelte` with statistics
   - Success/error display
   - `ActionButtons.svelte`
   - Success animation (confetti or checkmark)

6. **Styling and polish**
   - Ensure dark mode compatibility
   - Responsive design
   - Loading states
   - Empty states
   - Accessibility (keyboard nav, ARIA labels)

**Deliverables:**
- ✅ All 8 components built and styled
- ✅ Components integrated with shadcn-svelte
- ✅ Dark mode support
- ✅ Responsive layout

---

### Phase 4: Integration (1-2 days)

**Goal:** Connect frontend and backend, implement full workflow

#### Tasks:
1. **Implement file selection flow**
   - Connect FileSelector to Tauri commands
   - Call analyze_images on selection
   - Update state with ImageInfo array
   - Handle errors gracefully

2. **Implement compression flow**
   - Build CompressionConfig from state
   - Call compress_images command
   - Update progress bar from events
   - Display results on completion

3. **Implement action buttons**
   - Open in Explorer functionality
   - Clear/reset functionality
   - "Compress more" workflow

4. **Settings persistence**
   - Save quality/size ratio to localStorage
   - Remember last output folder
   - Load on app start

5. **Error handling**
   - Display toast notifications for errors
   - Show validation errors
   - Handle permission errors
   - Network drive edge cases

6. **Integration testing**
   - Test complete workflow
   - Test with various file types
   - Test edge cases (empty folder, large files)

**Deliverables:**
- ✅ Full workflow working end-to-end
- ✅ Settings persist across sessions
- ✅ Error handling comprehensive
- ✅ Edge cases handled

---

### Phase 5: Polish (2-3 days)

**Goal:** Enhance UX and add quality-of-life features

#### Tasks:
1. **Drag-and-drop enhancements**
   - Prevent default browser file opening
   - Visual feedback on drag-over
   - Support folder drops
   - Handle multiple simultaneous drops

2. **Keyboard shortcuts**
   - Ctrl+O for file picker
   - Ctrl+Shift+O for folder picker
   - Enter to start compression
   - Escape to cancel/reset
   - Document shortcuts in UI

3. **Loading states and animations**
   - Skeleton loaders
   - Smooth transitions
   - Progress animations
   - Success animations

4. **Settings enhancements**
   - Presets (Web, Mobile, Print quality)
   - Advanced options panel
   - Thread count selector
   - Preserve folder structure option

5. **Output options**
   - Option to save alongside originals
   - Custom filename suffix
   - Timestamp in filename option

6. **Performance optimizations**
   - Virtual scrolling for large lists
   - Debounce estimation calculations
   - Optimize re-renders

7. **Documentation**
   - Update README with usage instructions
   - Add tooltips for settings
   - Create user guide (optional)

**Deliverables:**
- ✅ Polished user experience
- ✅ Keyboard shortcuts working
- ✅ Performance optimized
- ✅ Documentation complete

---

### Phase 6: Testing & Optimization (2-3 days)

**Goal:** Ensure reliability and performance

#### Tasks:
1. **Unit tests (Vitest)**
   - Test format utilities
   - Test state management
   - Test calculation functions
   - Achieve >80% coverage

2. **Component tests**
   - Test FileSelector interactions
   - Test slider components
   - Test conditional rendering

3. **E2E tests (Playwright)**
   - Test file selection flow
   - Test compression flow
   - Test error scenarios
   - Test keyboard shortcuts

4. **Performance testing**
   - Test with 100+ images
   - Test with very large files (50+ MB)
   - Test with different thread counts
   - Identify bottlenecks

5. **Platform-specific testing**
   - Windows 10/11
   - File paths with spaces
   - Long path names
   - Network drives
   - Special characters in filenames

6. **Bug fixes and optimization**
   - Fix issues found in testing
   - Optimize slow operations
   - Improve error messages
   - Refactor as needed

**Deliverables:**
- ✅ Comprehensive test suite
- ✅ E2E tests passing
- ✅ Performance benchmarks met
- ✅ Platform-specific issues resolved

---

## 6. Technical Considerations

### 6.1 Image Preview Strategy

**Option A: Server-side thumbnails (Recommended)**
- Generate thumbnails in Rust using `image` crate
- Resize to 100x100 or 150x150
- Convert to base64
- Return with ImageInfo
- **Pros:** Fast, cross-platform, secure
- **Cons:** Memory overhead for large batches

**Option B: File protocol**
- Use `file://` protocol with img tags
- **Pros:** Zero processing overhead
- **Cons:** Security restrictions, Tauri CSP issues

**Implementation:** Use Option A with lazy loading (generate only for visible items in viewport)

### 6.2 Thread Count Strategy

**Default:** `num_cpus::get()` (number of logical cores)

**Recommendations:**
- Desktop (4+ cores): Use all cores
- Laptop (2-4 cores): Use cores - 1 (leave one for UI)
- Allow user override in advanced settings

**Implementation:**
```rust
let default_threads = std::thread::available_parallelism()
    .map(|n| n.get())
    .unwrap_or(4);
```

### 6.3 Output Folder Strategy

**Default Paths:**
- Windows: `%USERPROFILE%\Documents\CompressedImages`
- macOS: `~/Documents/CompressedImages`
- Linux: `~/Documents/CompressedImages`

**Options:**
1. **Separate folder (default):** All compressed images in one location
2. **Alongside originals:** Save next to source with `_compressed` suffix
3. **Preserve structure:** Maintain folder hierarchy in output folder

**Implementation:**
```rust
use tauri::api::path::document_dir;

fn get_default_output() -> PathBuf {
    document_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("CompressedImages")
}
```

### 6.4 File Naming Strategy

**Conflict Resolution:**
1. Keep original name (default)
2. If exists: append `_1`, `_2`, etc.
3. Option: Add timestamp prefix `20240315_120530_image.jpg`
4. Always change extension to `.jpg`

**Implementation:**
```rust
fn get_unique_filename(output_dir: &Path, base_name: &str) -> PathBuf {
    let mut counter = 1;
    let mut path = output_dir.join(format!("{}.jpg", base_name));

    while path.exists() {
        path = output_dir.join(format!("{}_{}.jpg", base_name, counter));
        counter += 1;
    }

    path
}
```

### 6.5 Progress Tracking Implementation

**Rust Side:**
```rust
use tokio::sync::mpsc;
use tauri::Manager;

async fn compress_batch(
    app_handle: tauri::AppHandle,
    config: CompressionConfig
) -> CompressResult {
    let (tx, mut rx) = mpsc::channel(100);

    // Spawn task to send progress updates
    let handle = app_handle.clone();
    tokio::spawn(async move {
        while let Some(progress) = rx.recv().await {
            handle.emit_all("compression:progress", progress).ok();
        }
    });

    // Compression loop
    for (i, path) in config.source_paths.iter().enumerate() {
        // Compress image...

        tx.send(ProgressUpdate {
            current: i + 1,
            total: config.source_paths.len(),
            current_file: path.clone(),
            percent: ((i + 1) as f32 / config.source_paths.len() as f32) * 100.0,
        }).await.ok();
    }

    // Return result
}
```

**Frontend Side:**
```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<ProgressUpdate>('compression:progress', (event) => {
  compressionState.progress = event.payload;
});
```

### 6.6 Error Recovery Strategy

**Principles:**
1. **Continue on failure:** Don't stop entire batch if one image fails
2. **Collect errors:** Store all errors and display at end
3. **Provide details:** Include filename and specific error message
4. **Allow retry:** User can retry failed images only

**Implementation:**
```rust
let mut errors = Vec::new();
let mut successful = 0;

for path in source_paths {
    match compress_single_image(&path, &config) {
        Ok(_) => successful += 1,
        Err(e) => errors.push(ImageError {
            path: path.clone(),
            filename: get_filename(&path),
            error: e.to_string(),
        }),
    }
}

CompressResult {
    total: source_paths.len(),
    successful,
    failed: errors.len(),
    errors,
    // ...
}
```

### 6.7 Memory Management

**Concerns:**
- Large image files (50+ MB)
- Large batches (1000+ images)
- Thumbnail generation

**Strategies:**
1. **Stream processing:** Don't load all images into memory
2. **Lazy thumbnails:** Generate only when needed
3. **Limit concurrent:** Process N images at a time (thread pool)
4. **Drop after use:** Ensure images are dropped after compression

### 6.8 Validation & Security

**Input Validation:**
- Verify file extensions before processing
- Check file magic numbers (not just extension)
- Limit file size (optional, e.g., max 100 MB)
- Validate output paths (no directory traversal)

**Security:**
- Use Tauri's path API for safe path handling
- Don't execute user-provided paths as commands
- Sanitize filenames (remove special chars on Windows)

**Implementation:**
```rust
fn is_valid_image(path: &Path) -> bool {
    // Check extension
    let valid_extensions = ["jpg", "jpeg", "png", "bmp", "gif", "webp"];
    let extension = path.extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_lowercase());

    if !extension.map(|e| valid_extensions.contains(&e.as_str())).unwrap_or(false) {
        return false;
    }

    // Optional: Check magic numbers using `image` crate
    image::open(path).is_ok()
}
```

---

## 7. File Structure

### 7.1 Complete Project Structure

```
img-compress/
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   │   ├── ui/                    # shadcn-svelte (existing)
│   │   │   │   │   ├── button/
│   │   │   │   │   ├── card/
│   │   │   │   │   ├── slider/
│   │   │   │   │   ├── progress/
│   │   │   │   │   ├── badge/
│   │   │   │   │   ├── separator/
│   │   │   │   │   └── ...
│   │   │   │   ├── FileSelector.svelte
│   │   │   │   ├── ImageList.svelte
│   │   │   │   ├── ImageCard.svelte
│   │   │   │   ├── CompressionSettings.svelte
│   │   │   │   ├── CompressButton.svelte
│   │   │   │   ├── ProgressBar.svelte
│   │   │   │   ├── ResultsSummary.svelte
│   │   │   │   ├── ActionButtons.svelte
│   │   │   │   └── ThemeToggle.svelte     # (existing)
│   │   │   ├── stores/
│   │   │   │   └── compression-state.svelte.ts
│   │   │   ├── types/
│   │   │   │   └── compression.ts
│   │   │   └── utils/
│   │   │       ├── format.ts
│   │   │       ├── tauri-commands.ts
│   │   │       └── utils.ts               # (existing)
│   │   ├── routes/
│   │   │   ├── +layout.svelte             # Minimal layout
│   │   │   ├── +page.svelte               # Main compression UI
│   │   │   └── +page.ts                   # Load default settings
│   │   ├── app.css
│   │   ├── app.html
│   │   └── app.d.ts
│   ├── src-tauri/
│   │   ├── src/
│   │   │   ├── compression/
│   │   │   │   ├── mod.rs                 # Public API
│   │   │   │   ├── analyzer.rs            # Image analysis
│   │   │   │   ├── processor.rs           # Batch processing
│   │   │   │   └── types.rs               # Data structures
│   │   │   ├── commands/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── file_ops.rs            # File operations
│   │   │   │   └── compress.rs            # Compression commands
│   │   │   ├── lib.rs                     # Command registration
│   │   │   └── main.rs                    # App entry point
│   │   ├── icons/
│   │   │   ├── icon.icns
│   │   │   ├── icon.ico
│   │   │   └── *.png
│   │   ├── Cargo.toml
│   │   ├── tauri.conf.json
│   │   └── build.rs
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── format.test.ts
│   │   │   └── state.test.ts
│   │   └── e2e/
│   │       ├── compression.spec.ts
│   │       └── file-selection.spec.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── svelte.config.js
│   ├── tsconfig.json
│   ├── playwright.config.ts
│   ├── PLAN.md                            # This file
│   ├── PROGRESS.md                        # Todo checklist
│   ├── README.md
│   └── CLAUDE.md
```

### 7.2 Key Files to Create

**Backend:**
1. `src-tauri/src/compression/mod.rs`
2. `src-tauri/src/compression/analyzer.rs`
3. `src-tauri/src/compression/processor.rs`
4. `src-tauri/src/compression/types.rs`
5. `src-tauri/src/commands/file_ops.rs`
6. `src-tauri/src/commands/compress.rs`

**Frontend:**
1. `src/lib/types/compression.ts`
2. `src/lib/stores/compression-state.svelte.ts`
3. `src/lib/utils/format.ts`
4. `src/lib/utils/tauri-commands.ts`
5. `src/lib/components/FileSelector.svelte`
6. `src/lib/components/ImageList.svelte`
7. `src/lib/components/ImageCard.svelte`
8. `src/lib/components/CompressionSettings.svelte`
9. `src/lib/components/CompressButton.svelte`
10. `src/lib/components/ProgressBar.svelte`
11. `src/lib/components/ResultsSummary.svelte`
12. `src/lib/components/ActionButtons.svelte`
13. `src/routes/+page.svelte`

---

## 8. Testing Strategy

### 8.1 Backend Tests (Rust)

**Unit Tests:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compression_factor() {
        let factor = Factor::new(80.0, 0.8);
        assert_eq!(factor.quality, 80.0);
        assert_eq!(factor.ratio, 0.8);
    }

    #[test]
    fn test_image_validation() {
        assert!(is_valid_image(Path::new("test.jpg")));
        assert!(!is_valid_image(Path::new("test.txt")));
    }
}
```

**Integration Tests:**
```rust
#[tokio::test]
async fn test_compress_single_image() {
    let config = CompressionConfig {
        quality: 85.0,
        size_ratio: 0.8,
        // ...
    };

    let result = compress_single_image("test.png", &config).await;
    assert!(result.is_ok());
}
```

### 8.2 Frontend Tests

**Unit Tests (Vitest):**
```typescript
// tests/unit/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatBytes, calculateSavings } from '$lib/utils/format';

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});

describe('calculateSavings', () => {
  it('calculates percentage correctly', () => {
    expect(calculateSavings(100, 50)).toBe(50);
    expect(calculateSavings(200, 100)).toBe(50);
  });
});
```

**Component Tests:**
```typescript
// tests/unit/ImageCard.test.ts
import { render } from '@testing-library/svelte';
import ImageCard from '$lib/components/ImageCard.svelte';

it('renders image info correctly', () => {
  const { getByText } = render(ImageCard, {
    props: {
      image: {
        filename: 'test.png',
        original_size: 1024000,
        format: 'PNG',
      }
    }
  });

  expect(getByText('test.png')).toBeInTheDocument();
  expect(getByText('1 MB')).toBeInTheDocument();
});
```

### 8.3 E2E Tests (Playwright)

```typescript
// tests/e2e/compression.spec.ts
import { test, expect } from '@playwright/test';

test('complete compression workflow', async ({ page }) => {
  await page.goto('/');

  // Select files
  await page.click('text=Select Files');
  // (Mock file selection in Tauri)

  // Verify images loaded
  await expect(page.locator('text=Selected Images')).toBeVisible();

  // Adjust settings
  await page.locator('input[type="range"]').first().fill('85');

  // Start compression
  await page.click('text=Compress Images');

  // Wait for completion
  await expect(page.locator('text=Compression Complete')).toBeVisible();

  // Verify results
  await expect(page.locator('text=Successfully compressed')).toBeVisible();
});
```

### 8.4 Performance Tests

**Benchmarks:**
```rust
#[bench]
fn bench_compress_1000_images(b: &mut Bencher) {
    b.iter(|| {
        // Compress 1000 test images
    });
}
```

**Load Tests:**
- Test with 10, 100, 1000, 10000 images
- Measure time and memory usage
- Ensure UI remains responsive
- Target: <10s for 100 images on average hardware

### 8.5 Manual Testing Checklist

**File Selection:**
- [ ] Drag and drop single file
- [ ] Drag and drop multiple files
- [ ] Drag and drop folder
- [ ] File picker selection
- [ ] Folder picker selection
- [ ] Mixed file types (valid and invalid)
- [ ] Empty folder

**Compression:**
- [ ] Compress single image
- [ ] Compress multiple images
- [ ] Compress large batch (100+)
- [ ] Compress very large file (50+ MB)
- [ ] Different quality settings
- [ ] Different size ratios
- [ ] Custom output folder

**Results:**
- [ ] Success message displays
- [ ] Statistics accurate
- [ ] Open in Explorer works
- [ ] Compress more resets state
- [ ] Error display works

**Edge Cases:**
- [ ] No images selected
- [ ] Insufficient disk space
- [ ] Invalid output path
- [ ] Corrupted image file
- [ ] Read-only output folder
- [ ] File name conflicts
- [ ] Path with spaces
- [ ] Long file paths
- [ ] Special characters in names
- [ ] Network drive paths

**Cross-Platform:**
- [ ] Windows 10
- [ ] Windows 11
- [ ] macOS (if applicable)
- [ ] Linux (if applicable)

---

## 9. Deployment

### 9.1 Build Configuration

**Update `tauri.conf.json`:**
```json
{
  "productName": "Image Compressor",
  "version": "1.0.0",
  "identifier": "com.imagecompressor.app",
  "build": {
    "frontendDist": "../build",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "windows": [
      {
        "title": "Image Compressor",
        "width": 900,
        "height": 700,
        "minWidth": 700,
        "minHeight": 500,
        "resizable": true
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "windows": {
      "wix": {
        "language": "en-US"
      },
      "nsis": {
        "installerIcon": "icons/icon.ico",
        "installMode": "perUser",
        "languages": ["en-US"],
        "displayLanguageSelector": false
      }
    }
  }
}
```

### 9.2 Build Commands

**Development Build:**
```bash
npm run tauri:dev
```

**Production Build:**
```bash
npm run tauri:build
```

**Output Locations:**
- **NSIS Installer:** `src-tauri/target/release/bundle/nsis/ImageCompressor_1.0.0_x64-setup.exe`
- **MSI Installer:** `src-tauri/target/release/bundle/msi/ImageCompressor_1.0.0_x64_en-US.msi`
- **Portable:** `src-tauri/target/release/ImageCompressor.exe`

### 9.3 Code Signing (Windows)

**Why:**
- Prevents "Unknown Publisher" warnings
- Increases user trust
- Required for some enterprise environments

**Steps:**
1. Obtain code signing certificate (DigiCert, Sectigo, etc.)
2. Configure in `tauri.conf.json`:
   ```json
   {
     "bundle": {
       "windows": {
         "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
         "digestAlgorithm": "sha256",
         "timestampUrl": "http://timestamp.digicert.com"
       }
     }
   }
   ```

**Cost:** ~$100-400/year for certificate

### 9.4 Distribution Methods

**Option 1: GitHub Releases (Recommended)**
- Upload installers to GitHub Releases
- Automatic download statistics
- Free hosting
- Version tracking

**Option 2: Direct Download**
- Host on personal website
- Provide direct download links

**Option 3: Microsoft Store**
- Wider reach
- Automatic updates
- $19 one-time fee for developer account

**Option 4: Auto-Updates**
- Use tauri-plugin-updater
- Host update manifest on GitHub
- In-app update notifications

### 9.5 Release Checklist

- [ ] Update version in `package.json` and `tauri.conf.json`
- [ ] Update CHANGELOG.md
- [ ] Run all tests
- [ ] Build production version
- [ ] Test installer on clean Windows machine
- [ ] Create GitHub Release
- [ ] Upload installers
- [ ] Write release notes
- [ ] Announce on social media (optional)

---

## 10. Future Enhancements

### 10.1 Phase 2 Features (Post-MVP)

**Output Format Options:**
- Keep original format
- Convert to PNG
- Convert to WebP
- User selectable per batch

**Compression Presets:**
- Web (high compression, 70% quality)
- Mobile (medium, 80% quality)
- Print (low compression, 95% quality)
- Custom presets saved by user

**Image Editing:**
- Resize to specific dimensions
- Crop to aspect ratio
- Rotate/flip
- Apply filters (grayscale, brightness, contrast)

**EXIF Metadata:**
- Preserve EXIF data option
- Strip metadata option
- View metadata in UI
- Bulk edit metadata

**Advanced Features:**
- Before/after preview slider
- Watermarking (text or image)
- Batch rename
- Schedule compression jobs
- Watch folder mode (auto-compress on file add)

### 10.2 Phase 3 Features (Future)

**Statistics Dashboard:**
- Total images compressed
- Total space saved
- Most used settings
- Charts and graphs

**Cloud Integration:**
- Upload to Google Drive
- Upload to Dropbox
- Direct share links

**Collaboration:**
- Share compression settings
- Preset library (community)

**Performance:**
- GPU acceleration (if feasible)
- Distributed processing (use multiple machines)

**Platform Support:**
- macOS native build
- Linux native build
- Mobile app (iOS/Android)

---

## 11. Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| Phase 1: Backend Foundation | 2-3 days | Rust compression module, Tauri commands |
| Phase 2: Frontend Core | 1-2 days | State management, types, utilities |
| Phase 3: UI Components | 3-4 days | All 8 UI components built and styled |
| Phase 4: Integration | 1-2 days | Full workflow connected |
| Phase 5: Polish | 2-3 days | UX enhancements, keyboard shortcuts |
| Phase 6: Testing | 2-3 days | Unit, E2E, performance tests |
| **Total** | **11-17 days** | **Production-ready MVP** |

---

## 12. Success Metrics

**MVP Definition of Done:**
- [ ] User can select images via drag-drop, file picker, or folder picker
- [ ] User can adjust quality and size ratio
- [ ] User can compress images to JPG format
- [ ] User sees real-time progress during compression
- [ ] User receives summary of results (before/after sizes, savings)
- [ ] User can open output folder from app
- [ ] Settings persist across sessions
- [ ] App handles errors gracefully
- [ ] App works on Windows 10/11
- [ ] Test coverage >70%
- [ ] No critical bugs

**Performance Targets:**
- Compress 100 images in <30 seconds (on average hardware)
- UI remains responsive during processing
- Startup time <3 seconds
- Memory usage <500 MB for typical batches

**Quality Targets:**
- No crashes during normal usage
- All user-facing text is clear and helpful
- Dark mode works correctly
- Keyboard navigation works
- WCAG 2.1 AA accessibility compliance

---

## Appendix A: Dependencies Reference

### Backend Dependencies
```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri = { version = "2.8.5", features = [] }
tauri-plugin-log = "2"
tauri-plugin-dialog = "2.0"
tauri-plugin-shell = "2.0"
image_compressor = "0.1.4"
tokio = { version = "1", features = ["full"] }
walkdir = "2.4"
```

### Frontend Dependencies
All already in package.json:
- `@sveltejs/kit`
- `svelte` (v5)
- `typescript`
- `tailwindcss` (v4)
- `bits-ui` (shadcn-svelte)
- `@tauri-apps/api`
- `vitest`
- `playwright`

---

## Appendix B: Useful Resources

**Documentation:**
- [Tauri v2 Docs](https://v2.tauri.app/)
- [SvelteKit Docs](https://kit.svelte.dev/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [image_compressor Crate](https://crates.io/crates/image_compressor)
- [shadcn-svelte](https://www.shadcn-svelte.com/)

**Tauri Plugins:**
- [tauri-plugin-dialog](https://github.com/tauri-apps/tauri-plugin-dialog)
- [tauri-plugin-shell](https://github.com/tauri-apps/tauri-plugin-shell)

**Tools:**
- [Rust Playground](https://play.rust-lang.org/)
- [Svelte REPL](https://svelte.dev/repl)
- [Tailwind Play](https://play.tailwindcss.com/)

---

## Appendix C: Troubleshooting

**Common Issues:**

1. **Tauri build fails:**
   - Ensure Rust toolchain is up to date: `rustup update`
   - Clear build cache: `cargo clean`
   - Check Tauri prerequisites

2. **File picker doesn't work:**
   - Verify tauri-plugin-dialog is in Cargo.toml
   - Check permissions in tauri.conf.json
   - Ensure plugin is initialized in lib.rs

3. **Progress events not received:**
   - Check event name matches exactly
   - Verify emit_all is called
   - Check listener is set up before compression starts

4. **Compression fails silently:**
   - Check file permissions
   - Verify output folder exists
   - Look at Tauri console logs

5. **UI not updating:**
   - Ensure state is reactive (using $state)
   - Check event listener is updating state
   - Verify component is using reactive values

---

**End of Implementation Plan**
