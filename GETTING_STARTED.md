# Getting Started with SvelteKit + Tauri Starter Kit

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run tauri:dev
   ```

3. **Build for production:**
   ```bash
   npm run tauri:build
   ```

## What's Included

This starter kit provides a minimal but complete foundation for building cross-platform desktop applications:

### Frontend
- **SvelteKit** with **Svelte 5** (using runes)
- **TypeScript** with strict mode
- **TailwindCSS v4** for styling
- **shadcn-svelte** UI components
- **mode-watcher** for dark/light theme support
- Responsive sidebar layout with collapsible navigation

### Backend (Tauri)
- **Tauri v2** for native desktop capabilities
- **Rust** backend with example commands
- **Tauri Stronghold** plugin for secure encrypted storage
- Example commands for frontend-backend communication

### Example Pages
- **Dashboard** - Demonstrates Tauri command invocation and UI layout
- **Settings** - Shows theme switching and settings management

## Project Structure

```
├── src/
│   ├── routes/
│   │   ├── (app)/              # App layout group
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   ├── settings/       # Settings page
│   │   │   └── +layout.svelte  # App layout with sidebar
│   │   ├── +page.svelte        # Root redirects to /dashboard
│   │   └── +layout.svelte      # Root layout (theme, head)
│   └── lib/
│       ├── components/
│       │   ├── ui/             # shadcn-svelte components
│       │   ├── app-sidebar.svelte
│       │   ├── nav-*.svelte
│       │   └── topbar.svelte
│       ├── hooks/              # Svelte hooks
│       ├── utils/              # Utility functions
│       └── paraglide/          # i18n (auto-generated)
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs             # Tauri commands
│   │   └── main.rs            # Entry point
│   └── Cargo.toml             # Rust dependencies
└── messages/                   # i18n translations
```

## Customization Guide

### 1. Adding New Routes

Create a new page in `src/routes/(app)/[your-page]/+page.svelte`:

```svelte
<script lang="ts">
  import Topbar from '$lib/components/topbar.svelte';
</script>

<div class="flex h-screen flex-col">
  <Topbar title="Your Page" />
  <div class="flex-1 overflow-auto p-6">
    <!-- Your content here -->
  </div>
</div>
```

Then update the navigation in `src/lib/components/app-sidebar.svelte`.

### 2. Adding Tauri Commands

In `src-tauri/src/lib.rs`:

```rust
#[tauri::command]
fn my_command(arg: String) -> String {
    format!("Received: {}", arg)
}
```

Register it:

```rust
.invoke_handler(tauri::generate_handler![
    greet,
    get_app_version,
    my_command  // Add here
])
```

Call from frontend:

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<string>('my_command', { arg: 'test' });
```

### 3. Using Secure Storage (Stronghold)

```typescript
import { Client } from '@tauri-apps/plugin-stronghold';

// Initialize
const client = await Client.create('my-app', 'my-vault');

// Store data
await client.insert('api-key', 'secret-value');

// Retrieve data
const value = await client.get('api-key');
```

### 4. Adding UI Components

Install more shadcn-svelte components:

```bash
npx shadcn-svelte@latest add [component-name]
```

Available components: dialog, dropdown-menu, input, textarea, select, checkbox, radio-group, etc.

### 5. Customizing the Theme

Edit `src/app.css` to customize TailwindCSS theme:

```css
@theme {
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
  /* Add your colors */
}
```

### 6. Branding

Update the app name and logo:

- **Sidebar**: Edit `src/lib/components/team-switcher.svelte`
- **App Name**: Edit `package.json` and `src-tauri/Cargo.toml`
- **Icon**: Replace `src-tauri/icons/` with your app icons

## Development Tips

### Hot Reload
Changes to Svelte/TS code hot reload automatically. Rust changes require a rebuild (automatic in dev mode).

### Debugging
- **Frontend**: Use browser DevTools (Cmd/Ctrl + Shift + I in dev mode)
- **Backend**: Check terminal output for Rust println! statements

### Testing
```bash
npm run test:unit   # Run Vitest tests
npm run test:e2e    # Run Playwright tests
```

### Code Quality
```bash
npm run check       # Type-check TypeScript
npm run lint        # Check formatting
npm run format      # Format code
```

## Next Steps

1. **Remove example code** you don't need
2. **Add your routes** and navigation
3. **Implement your features** using Tauri commands
4. **Customize styling** with TailwindCSS
5. **Add tests** for your features
6. **Build and distribute** your app

## Resources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Svelte 5 Documentation](https://svelte.dev/docs)
- [Tauri Documentation](https://v2.tauri.app/)
- [shadcn-svelte](https://www.shadcn-svelte.com/)
- [TailwindCSS](https://tailwindcss.com/)

## License

This starter kit is provided as-is for you to use in your projects.
