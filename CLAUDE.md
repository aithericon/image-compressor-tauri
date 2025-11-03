# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimal SvelteKit + Tauri starter kit using Svelte 5 with TypeScript, TailwindCSS, and shadcn-svelte components. The starter includes a basic application shell with sidebar navigation, two example pages (Dashboard and Settings), and demonstrates frontend-backend communication with Tauri commands. The project uses static adapter for deployment and includes internationalization support via Paraglide.

## Development Commands

All commands should be run from the `/frontend` directory:

```bash
cd frontend

# Development
npm run dev                # Start development server
npm run dev -- --open      # Start dev server and open browser

# Building
npm run build              # Build for production
npm run preview            # Preview production build

# Testing
npm run test               # Run all tests (unit + e2e)
npm run test:unit          # Run Vitest unit tests
npm run test:e2e           # Run Playwright e2e tests

# Code Quality
npm run check              # Type-check with svelte-check
npm run check:watch        # Type-check in watch mode
npm run lint               # Check formatting and lint
npm run format             # Format code with Prettier
```

## Architecture

### Technology Stack

- **Framework**: SvelteKit with Svelte 5
- **Language**: TypeScript with strict mode
- **Styling**: TailwindCSS v4 with @tailwindcss/vite
- **Components**: shadcn-svelte UI components
- **Testing**: Vitest for unit tests, Playwright for e2e tests
- **Internationalization**: Paraglide.js with messages in `/frontend/messages`
- **Build**: Vite with static adapter

### Directory Structure

All frontend code is located in `/frontend`:

- `/frontend/src/routes/` - SvelteKit pages and routing
- `/frontend/src/lib/components/` - Reusable Svelte components
  - `/ui/` - shadcn-svelte UI components (button, card, dialog, etc.)
  - App-specific components (app-sidebar, nav-\*, team-switcher)
- `/frontend/src/lib/hooks/` - Svelte hooks and utilities
- `/frontend/src/lib/paraglide/` - Generated i18n code (auto-generated, do not edit)
- `/frontend/messages/` - Translation files (en.json, de.json)
- `/frontend/e2e/` - Playwright end-to-end tests
- `/frontend/static/` - Static assets

### Key Configuration Files

All configuration files are in `/frontend`:

- `/frontend/svelte.config.js` - Uses static adapter, MDsveX preprocessor
- `/frontend/vite.config.ts` - Includes Paraglide plugin, TailwindCSS, separated client/server test configs
- `/frontend/components.json` - shadcn-svelte configuration with path aliases
- `/frontend/playwright.config.ts` - E2E test configuration
- `/frontend/package.json` - Project dependencies and scripts
- `/frontend/tsconfig.json` - TypeScript configuration

### Component Architecture

The project uses shadcn-svelte, a port of shadcn/ui for Svelte. Components follow a composable pattern where complex components are built from smaller, reusable parts. Each UI component typically has:

- Main component file
- Sub-components for different parts
- An index.ts for exports

### Testing Strategy

- **Unit Tests**: Vitest with separate configurations for client (browser) and server (node) environments
- **E2E Tests**: Playwright tests in `/e2e/` directory
- Client tests use `.svelte.{test,spec}.{js,ts}` pattern
- Server tests exclude Svelte component tests

### Svelte 5 Specific Patterns

- Uses `$props()` for component props
- Uses `@render` for rendering children
- Rune-based reactivity system
- `.svelte.ts` files for reactive state modules

## Development Approach: Repository Pattern with API Mocking

This is an excellent, and very common, challenge in modern web development. Your instinct to solve the user experience and application logic first, before getting bogged down in backend infrastructure, is exactly right. The friction is real, and overcoming it is the key to rapid, high-quality development.

Fortunately, there are well-established, proven methods for this exact "prototype-to-product" workflow, and SvelteKit is exceptionally well-suited for them.

The strategy I recommend is the **Repository Pattern with API Mocking**. This approach minimizes transition friction by making your frontend code completely agnostic of whether it's talking to a "real" backend or a "fake" one in the browser.

---

### **The Core Strategy: The Repository Pattern**

The Repository Pattern is a design pattern that isolates the data access logic of your application. Instead of your Svelte components directly calling `fetch` or accessing browser storage, they will ask a "repository" for data. This repository acts as a middleman.

Here's the step-by-step guide to implementing this for your prototype:

#### **Step 1: Define Your API Contract**

This is the single most important step. Before you write any other code, pretend your Rust backend already exists. What are the API endpoints it would expose? What is the shape of the JSON data (the "data model") it would send and receive?

Define this contract. You can use a tool like OpenAPI (Swagger) or just a simple TypeScript definitions file (`.d.ts`).

**Example: `src/lib/types/api.d.ts`**

```typescript
// This file is the single source of truth for our data models

export interface ProcessStep {
	instance_id: string;
	template_id: string | null;
	base_type: 'Form' | 'ApiCall' | 'Code';
	configuration: Record<string, any>;
	overrides?: Record<string, any>;
}

export interface Process {
	process_id: string;
	version_number: number;
	title: string;
	steps: ProcessStep[];
}
```

#### **Step 2: Create the Repository Abstraction (The "Interface")**

Create a file that defines the _functions_ your app will use to interact with data, but not the implementation.

**Example: `src/lib/repositories/processRepository.ts`**

```typescript
import type { Process } from '$lib/types/api';

// This is the "contract" for our data logic.
// Our Svelte components will only ever use these functions.
export interface IProcessRepository {
	getProcess(id: string): Promise<Process | null>;
	saveProcess(process: Process): Promise<void>;
	getAllProcesses(): Promise<Process[]>;
}
```

#### **Step 3: Implement the MOCK Repository using Browser Storage**

Now, create your fake "backend." This implementation of the repository will use the browser's own storage. For your use case, **IndexedDB is the perfect choice**. It's an actual, transactional, in-browser database that can handle complex objects and is surprisingly fast. `localStorage` is too simple for this.

To make IndexedDB easy to work with, use a lightweight wrapper library like **`dexie.js`**.

1.  **Install Dexie:** `npm install dexie`
2.  **Create your Mock Repository:**

**Example: `src/lib/repositories/mockProcessRepository.ts`**

```typescript
import type { IProcessRepository } from './processRepository';
import type { Process } from '$lib/types/api';
import Dexie, { type Table } from 'dexie';

// 1. Set up the in-browser database using Dexie
class MekhanMockDB extends Dexie {
	processes!: Table<Process>;
	constructor() {
		super('mekhanDB');
		this.version(1).stores({
			// Primary key is 'process_id'
			processes: 'process_id, title'
		});
	}
}

const db = new MekhanMockDB();

// 2. Implement the interface using the database
export const mockProcessRepository: IProcessRepository = {
	async getProcess(id: string): Promise<Process | null> {
		console.log(`[MOCK] Fetching process ${id}`);
		// Simulate network delay for realism
		await new Promise((res) => setTimeout(res, 300));
		const process = await db.processes.get(id);
		return process || null;
	},

	async saveProcess(process: Process): Promise<void> {
		console.log(`[MOCK] Saving process ${process.process_id}`);
		await new Promise((res) => setTimeout(res, 500));
		// 'put' is an upsert operation (create or update)
		await db.processes.put(process);
	},

	async getAllProcesses(): Promise<Process[]> {
		console.log(`[MOCK] Fetching all processes`);
		await new Promise((res) => setTimeout(res, 200));
		return await db.processes.toArray();
	}
};

// You can even add some initial seed data for your prototype
const seedData = async () => {
	if ((await db.processes.count()) === 0) {
		console.log('[MOCK] Seeding initial data...');
		await db.processes.put({
			process_id: 'proc-123',
			version_number: 1,
			title: 'Turbine Assembly Line',
			steps: []
		});
	}
};
seedData();
```

#### **Step 4: Use the Mock Repository in your SvelteKit App**

Now, in your SvelteKit `+page.svelte` or `+page.ts` files, you can import and use the mock repository.

**Example: `src/routes/processes/[id]/+page.ts`**

```typescript
import { mockProcessRepository as processRepository } from '$lib/repositories/mockProcessRepository';

export async function load({ params }) {
	const process = await processRepository.getProcess(params.id);
	return {
		process
	};
}
```

Your Svelte components can now work with this data. The logic inside them for handling steps, forms, and updates is **real logic**. You are just working against a fake, but fully functional, data source.

---

### **The Transition: How to Introduce the Real Backend with Zero Friction**

This is the beautiful part. When your Rust backend is ready and exposes the real API endpoints that conform to your contract from Step 1, the transition is trivial.

1.  **Create the REAL Repository:**

**Example: `src/lib/repositories/httpProcessRepository.ts`**

```typescript
import type { IProcessRepository } from './processRepository';
import type { Process } from '$lib/types/api';

export const httpProcessRepository: IProcessRepository = {
	async getProcess(id: string): Promise<Process | null> {
		const response = await fetch(`/api/processes/${id}`);
		if (!response.ok) return null;
		return response.json();
	},

	async saveProcess(process: Process): Promise<void> {
		await fetch(`/api/processes/${process.process_id}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(process)
		});
	},

	async getAllProcesses(): Promise<Process[]> {
		const response = await fetch('/api/processes');
		return response.json();
	}
};
```

2.  **Flip the Switch:**
    Now you just change one line in your application to switch from the mock to the real implementation. You can do this in the files that use it, or create a central barrel file (`src/lib/repositories/index.ts`) to manage the export.

**Before:**
`import { mockProcessRepository as processRepository } from '$lib/repositories/mockProcessRepository';`

**After:**
`import { httpProcessRepository as processRepository } from '$lib/repositories/httpProcessRepository';`

That's it. **None of your Svelte component code or application logic needs to change.** The transition friction is virtually zero because you coded against your own internal API (the repository) instead of the raw data source.

### **Handling Real-Time NATS Mocking**

You can apply the same pattern for NATS.

1.  **Create a mock NATS service:** This can be a simple class that uses a Svelte store under the hood.
2.  **Simulate events:** Use `setInterval` to have your mock service randomly push new "alarm" or "completion" events into the store.
3.  Your UI components will subscribe to this store.
4.  When you transition to the real NATS.ws, you'll create a real NATS service that subscribes to the actual NATS server and pushes messages into the same Svelte store. Again, the UI components don't need to change.

This proven method de-risks your project, allows for parallel development, and provides a high-fidelity prototype that directly evolves into your final product.
