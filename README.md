# SvelteKit + Tauri Starter Kit

A minimal, production-ready starter template for building cross-platform desktop applications with modern web technologies.

## Tech Stack

- **Frontend Framework**: SvelteKit with Svelte 5 (using runes)
- **Desktop Runtime**: Tauri v2
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn-svelte
- **Testing**: Vitest (unit tests) + Playwright (e2e tests)
- **Internationalization**: Paraglide.js
- **Secure Storage**: Tauri Stronghold plugin

## Features

- ✅ Fully typed TypeScript with strict mode
- ✅ Responsive sidebar layout with collapsible navigation
- ✅ Dark/light mode support
- ✅ Beautiful UI components from shadcn-svelte
- ✅ Secure encrypted storage with Tauri Stronghold
- ✅ Hot module reloading in development
- ✅ Production-ready build configuration
- ✅ Example Tauri commands (Rust ↔ Frontend communication)
- ✅ Testing setup for unit and e2e tests

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Rust (latest stable)
- Platform-specific dependencies for Tauri ([see Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

### Installation

1. Clone or download this starter kit

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install Rust dependencies (automatic on first build)

### Development

Start the development server with hot reload:

```bash
npm run tauri:dev
```

This will:
- Start the SvelteKit dev server
- Launch the Tauri application
- Enable hot module reloading for frontend changes
- Rebuild Rust code when modified

### Building for Production

Build the application for your platform:

```bash
npm run tauri:build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Available Commands

```bash
# Development
npm run dev                # Start SvelteKit dev server (web only)
npm run tauri:dev          # Start Tauri app with dev server

# Building
npm run build              # Build SvelteKit for production
npm run tauri:build        # Build Tauri app for production
npm run preview            # Preview production build (web)

# Testing
npm run test               # Run all tests
npm run test:unit          # Run Vitest unit tests
npm run test:e2e           # Run Playwright e2e tests

# Code Quality
npm run check              # Type-check with svelte-check
npm run lint               # Check formatting and lint
npm run format             # Format code with Prettier
```

## Project Structure

```
├── src/
│   ├── routes/              # SvelteKit pages
│   │   └── (app)/          # App layout group
│   │       ├── dashboard/  # Dashboard page
│   │       └── settings/   # Settings page
│   ├── lib/
│   │   ├── components/     # Reusable components
│   │   │   ├── ui/        # shadcn-svelte components
│   │   │   └── ...        # Layout components
│   │   └── utils/         # Utilities
│   └── app.html           # HTML template
├── src-tauri/             # Rust backend
│   ├── src/lib.rs        # Tauri commands
│   └── Cargo.toml        # Rust dependencies
├── messages/              # i18n translations
└── static/               # Static assets
```

## Customization Guide

### Adding New Routes

Create a new page in `src/routes/(app)/[page-name]/+page.svelte` and update navigation in `app-sidebar.svelte`.

### Adding Tauri Commands

1. Add command in `src-tauri/src/lib.rs`
2. Register in `invoke_handler`
3. Call from frontend using `invoke()`

### Using Secure Storage

Use Tauri Stronghold for encrypted storage of sensitive data.

For detailed documentation, see the full README in the repository.

## License

This starter kit is provided as-is for you to use in your projects.
