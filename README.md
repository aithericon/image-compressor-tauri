# Image Compressor

> Professional desktop application for bulk image compression to JPG format

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey)

A minimal, user-friendly desktop application built by [Aithericon GmbH](https://aithericon.eu) for efficiently compressing images in bulk. Convert images from various formats (PNG, BMP, GIF, WebP, etc.) to optimized JPG files with configurable quality and size settings.

## Features

- ✅ **Bulk Compression** - Process multiple images simultaneously with parallel processing
- ✅ **Multiple Format Support** - Input: PNG, BMP, GIF, WebP, TIFF | Output: Optimized JPG
- ✅ **Configurable Quality** - Adjust quality (0-100%) and size ratio (10-100%)
- ✅ **Image Previews** - View 64x64px thumbnails of your images before compression
- ✅ **Real-time Progress** - Track compression progress with detailed status updates
- ✅ **Smart Sorting** - Sort images by name (A-Z, Z-A) or size (smallest, largest)
- ✅ **Bilingual Interface** - Full support for English and German (German default)
- ✅ **Dark/Light Mode** - Automatic theme switching with system preferences
- ✅ **Cross-platform** - Works on Windows, macOS (Intel & Apple Silicon)
- ✅ **Fast & Efficient** - Multi-threaded compression using Rust backend

## Technology Stack

### Desktop Framework

- **Tauri v2** - Secure, lightweight desktop runtime
- **Rust** - High-performance backend with `image_compressor` library

### Frontend

- **SvelteKit** - Modern web framework with static adapter
- **Svelte 5** - Reactive UI with runes (`$state`, `$derived`, `$effect`)
- **TypeScript** - Type-safe development with strict mode
- **TailwindCSS v4** - Utility-first styling
- **shadcn-svelte** - Beautiful, accessible UI components

### Internationalization

- **Paraglide.js** - Type-safe i18n with localStorage persistence
- **Languages**: English (en), German (de - default)

## Quick Start

### Prerequisites

Before running the application, ensure you have:

- **Node.js 18+** and npm
- **Rust** (latest stable) - [Install Rust](https://rustup.rs/)
- **Platform-specific dependencies** - [See Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone git@github.com:aithericon/image-compressor-tauri.git
   cd image-compressor-tauri
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run tauri:dev
   ```

### Building for Production

Build the application for your platform:

```bash
npm run tauri:build
```

Output locations:

- **Windows**: `src-tauri/target/release/bundle/msi/` (MSI installer)
- **macOS**: `src-tauri/target/release/bundle/dmg/` (DMG disk image)

## Development

### Available Commands

```bash
# Development
npm run dev              # Start SvelteKit dev server (web preview)
npm run tauri:dev        # Start Tauri app with hot reload

# Building
npm run build            # Build SvelteKit for production
npm run tauri:build      # Build Tauri app for production
npm run preview          # Preview production build

# Testing
npm run test             # Run all tests
npm run test:unit        # Run Vitest unit tests
npm run test:e2e         # Run Playwright e2e tests

# Code Quality
npm run check            # TypeScript type checking
npm run check:watch      # Type checking in watch mode
npm run lint             # Lint code with ESLint and Prettier
npm run format           # Format code with Prettier
```

### Project Structure

```
├── src/
│   ├── routes/
│   │   ├── +page.svelte         # Main application page
│   │   ├── +page.ts             # Page load function
│   │   └── license/             # License page
│   ├── lib/
│   │   ├── components/          # Svelte components
│   │   │   ├── ui/              # shadcn-svelte components
│   │   │   ├── FileSelector.svelte
│   │   │   ├── ImageList.svelte
│   │   │   ├── ImageCard.svelte
│   │   │   ├── CompressionSettings.svelte
│   │   │   ├── CompressButton.svelte
│   │   │   ├── ProgressBar.svelte
│   │   │   ├── ResultsSummary.svelte
│   │   │   └── ActionButtons.svelte
│   │   ├── stores/              # Svelte 5 rune-based state
│   │   │   └── compression-state.svelte.ts
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # Helper functions
│   └── app.html                 # HTML template
├── src-tauri/
│   ├── src/
│   │   ├── compression/         # Compression logic
│   │   │   ├── analyzer.rs      # Image analysis & thumbnails
│   │   │   ├── processor.rs     # Batch compression
│   │   │   └── types.rs         # Rust data structures
│   │   ├── commands/            # Tauri commands
│   │   │   ├── file_ops.rs      # File/folder selection
│   │   │   └── compress.rs      # Compression operations
│   │   └── lib.rs               # Main entry point
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
├── messages/                    # i18n translations
│   ├── en.json                  # English
│   └── de.json                  # German
└── static/                      # Static assets
    └── logo.png                 # Aithericon logo
```

## Key Features Explained

### 1. Image Analysis with Thumbnails

When you select images, the app:

- Scans all images in parallel
- Generates 64x64px thumbnails (base64-encoded)
- Calculates original and estimated compressed sizes
- Displays file format, dimensions, and size information

**Implementation**: `src-tauri/src/compression/analyzer.rs`

### 2. Configurable Compression

Two main settings control compression:

- **Quality (0-100%)**: JPEG quality level
  - 90-100%: Minimal compression, best quality
  - 70-89%: Good balance (recommended)
  - Below 70%: Higher compression, visible quality loss

- **Size Ratio (10-100%)**: Target size as percentage of original
  - Works in combination with quality setting
  - Useful for meeting specific file size requirements

**Implementation**: `src-tauri/src/compression/processor.rs`

### 3. Multi-threaded Processing

Compression uses all available CPU cores:

- Thread pool sized to `num_cpus::get()`
- Progress updates sent via Tauri events
- Error handling per-image (one failure doesn't stop the batch)

### 4. Real-time Progress Tracking

Progress updates include:

- Current image being processed
- Images completed count
- Success/failure counts
- Processing rate (images/sec)

Events are sent from Rust backend to frontend via `compression:progress` and `compression:complete` events.

### 5. State Management (Svelte 5 Runes)

Modern reactive state using Svelte 5 runes:

```typescript
// compression-state.svelte.ts
export const compressionState = $state({
	selectedImages: [],
	quality: 85,
	sizeRatio: 100,
	isCompressing: false,
	progress: null,
	result: null,
	showResults: false
});
```

Components automatically react to state changes without manual subscriptions.

### 6. Internationalization

Type-safe translations with Paraglide:

```typescript
import * as m from '$lib/paraglide/messages';

// Usage in components
<h1>{m.app_title()}</h1>
```

Language preference persists in `localStorage` and works in both dev and production builds.

## Automated Builds

The project includes GitHub Actions workflows for automated building:

### Release Workflow (`.github/workflows/release.yml`)

Triggered by version tags (e.g., `v1.0.0`):

- Builds for Windows (x64), macOS Intel (x64), and macOS Apple Silicon (aarch64)
- Creates GitHub release with installers
- Supports code signing (optional, requires secrets)

### Test Workflow (`.github/workflows/test.yml`)

Runs on push to `main` or `develop`:

- TypeScript type checking
- Linting and formatting checks
- Frontend build verification
- Rust code checks and tests
- Debug Tauri build

For detailed release instructions, see [RELEASE.md](./RELEASE.md).

## Creating a Release

To create a new release:

1. **Update version numbers** in:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`

2. **Create and push a tag:**

   ```bash
   git add .
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin main
   git push origin v1.0.0
   ```

3. **GitHub Actions will automatically:**
   - Build installers for all platforms
   - Create a draft release
   - Upload build artifacts

4. **Publish the release** from GitHub's releases page

## Architecture

### Backend (Rust/Tauri)

**Core Libraries:**

- `image_compressor` (v1.5.2) - JPEG compression
- `image` (v0.24) - Image decoding and thumbnail generation
- `tokio` - Async runtime for parallel processing
- `walkdir` - Directory traversal for folder scanning
- `base64` - Encoding thumbnails for frontend

**Key Tauri Commands:**

| Command                       | Purpose                              |
| ----------------------------- | ------------------------------------ |
| `select_folder()`             | Open folder picker dialog            |
| `select_files()`              | Open file picker for multiple images |
| `analyze_images()`            | Scan images and generate thumbnails  |
| `compress_images()`           | Perform batch compression            |
| `open_in_explorer()`          | Open output folder in file manager   |
| `get_default_output_folder()` | Get platform-specific default path   |

### Frontend (SvelteKit)

**State Management:**

- Svelte 5 runes (`$state`, `$derived`, `$effect`)
- No external state management library needed
- Reactive by default

**Component Architecture:**

- Modular components for each UI section
- shadcn-svelte for consistent, accessible UI
- TailwindCSS for responsive styling

**Build Configuration:**

- Static adapter for Tauri compatibility
- Vite for fast development and building
- Paraglide plugin for i18n code generation

## Browser Compatibility

Since this is a desktop application built with Tauri, there are no browser compatibility concerns. The embedded WebView supports modern web standards on all platforms.

## Performance

**Compression Speed:**

- Depends on CPU cores and image sizes
- Typical: 5-15 images/second on modern hardware
- Progress updates sent every 100ms

**Memory Usage:**

- Base: ~50-100 MB
- Per image: ~5-10 KB (thumbnail + metadata)
- Efficient streaming processing (doesn't load all images into memory)

## Troubleshooting

### Common Issues

**1. App won't start:**

- Ensure Rust toolchain is installed: `rustc --version`
- Check Tauri prerequisites for your platform

**2. Build fails:**

- Clear caches: `rm -rf node_modules target && npm install`
- Update dependencies: `cargo update` and `npm update`

**3. Images not showing:**

- Check file permissions
- Verify image formats are supported
- Check console logs in dev tools (Cmd/Ctrl + Shift + I)

**4. Language not persisting:**

- Language is stored in localStorage
- Clearing browser data will reset to default (German)

### Getting Help

- **Email**: support@aithericon.eu
- **Issues**: [GitHub Issues](https://github.com/aithericon/image-compressor-tauri/issues)
- **Website**: [aithericon.eu](https://aithericon.eu)

## Contributing

This is a proprietary application by Aithericon GmbH. For feature requests or bug reports, please contact support@aithericon.eu.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

```
Copyright (c) 2025 Aithericon GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

Built with:

- [Tauri](https://tauri.app/) - Desktop application framework
- [SvelteKit](https://kit.svelte.dev/) - Web framework
- [Svelte](https://svelte.dev/) - Reactive UI library
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [shadcn-svelte](https://www.shadcn-svelte.com/) - UI components
- [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) - Internationalization

---

**Made with ❤️ by [Aithericon GmbH](https://aithericon.eu)**
