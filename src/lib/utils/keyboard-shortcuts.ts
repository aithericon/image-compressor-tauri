/**
 * Keyboard shortcut utilities for flow editor
 */

export interface KeyboardShortcut {
	key: string;
	ctrlKey?: boolean;
	metaKey?: boolean;
	shiftKey?: boolean;
	altKey?: boolean;
	preventDefault?: boolean;
	handler: (event: KeyboardEvent) => void;
}

export class KeyboardShortcutManager {
	private shortcuts: Map<string, KeyboardShortcut> = new Map();
	private isActive = false;
	private boundHandleKeyDown: (event: Event) => void;

	constructor() {
		this.boundHandleKeyDown = this.handleKeyDown.bind(this);
	}

	/**
	 * Register a keyboard shortcut
	 */
	register(id: string, shortcut: KeyboardShortcut) {
		this.shortcuts.set(id, shortcut);
	}

	/**
	 * Unregister a keyboard shortcut
	 */
	unregister(id: string) {
		this.shortcuts.delete(id);
	}

	/**
	 * Start listening for keyboard events
	 */
	activate(target: EventTarget = document) {
		if (this.isActive) return;
		
		target.addEventListener('keydown', this.boundHandleKeyDown);
		this.isActive = true;
	}

	/**
	 * Stop listening for keyboard events
	 */
	deactivate(target: EventTarget = document) {
		if (!this.isActive) return;
		
		target.removeEventListener('keydown', this.boundHandleKeyDown);
		this.isActive = false;
	}

	/**
	 * Handle keydown events
	 */
	private handleKeyDown(event: Event) {
		const keyboardEvent = event as KeyboardEvent;
		// Skip if user is typing in an input/textarea
		const target = event.target as HTMLElement;
		if (target && (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.contentEditable === 'true'
		)) {
			return;
		}

		for (const shortcut of this.shortcuts.values()) {
			if (this.matchesShortcut(keyboardEvent, shortcut)) {
				if (shortcut.preventDefault !== false) {
					keyboardEvent.preventDefault();
				}
				shortcut.handler(keyboardEvent);
				break;
			}
		}
	}

	/**
	 * Check if event matches shortcut
	 */
	private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
		const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
		const ctrlMatch = (shortcut.ctrlKey ?? false) === event.ctrlKey;
		const metaMatch = (shortcut.metaKey ?? false) === event.metaKey;
		const shiftMatch = (shortcut.shiftKey ?? false) === event.shiftKey;
		const altMatch = (shortcut.altKey ?? false) === event.altKey;

		return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
	}

	/**
	 * Get a human-readable description of a shortcut
	 */
	getShortcutDescription(shortcut: KeyboardShortcut): string {
		const parts: string[] = [];
		
		if (shortcut.ctrlKey) parts.push('Ctrl');
		if (shortcut.metaKey) parts.push('Cmd');
		if (shortcut.altKey) parts.push('Alt');
		if (shortcut.shiftKey) parts.push('Shift');
		
		parts.push(shortcut.key.toUpperCase());
		
		return parts.join(' + ');
	}

	/**
	 * Get all registered shortcuts
	 */
	getShortcuts(): Map<string, KeyboardShortcut> {
		return new Map(this.shortcuts);
	}
}

/**
 * Create flow editor keyboard shortcuts
 */
export function createFlowEditorShortcuts(store: any): KeyboardShortcut[] {
	return [
		{
			key: 'z',
			ctrlKey: true,
			handler: () => {
				store.undo();
			}
		},
		{
			key: 'y',
			ctrlKey: true,
			handler: () => {
				store.redo();
			}
		},
		{
			key: 'z',
			ctrlKey: true,
			shiftKey: true,
			handler: () => {
				store.redo();
			}
		},
		{
			key: 's',
			ctrlKey: true,
			handler: (event: KeyboardEvent) => {
				event.preventDefault();
				store.save();
			}
		},
		{
			key: 'Delete',
			handler: () => {
				const selectedNodeId = store.getSelectedNodeId();
				if (selectedNodeId) {
					store.deleteNode(selectedNodeId);
				}
			}
		},
		{
			key: 'Backspace',
			handler: () => {
				const selectedNodeId = store.getSelectedNodeId();
				if (selectedNodeId) {
					store.deleteNode(selectedNodeId);
				}
			}
		},
		{
			key: 'Escape',
			handler: () => {
				store.selectNode(null);
			}
		},
		{
			key: 'a',
			ctrlKey: true,
			handler: (event: KeyboardEvent) => {
				event.preventDefault();
				// Select all nodes (could be implemented if needed)
				console.log('Select all nodes');
			}
		}
	];
}

/**
 * Platform-specific modifier detection
 */
export function getModifierKey(): 'ctrlKey' | 'metaKey' {
	return navigator.platform.toLowerCase().includes('mac') ? 'metaKey' : 'ctrlKey';
}

/**
 * Create platform-aware shortcut
 */
export function createPlatformShortcut(
	key: string, 
	handler: (event: KeyboardEvent) => void,
	options: Omit<KeyboardShortcut, 'key' | 'handler' | 'ctrlKey' | 'metaKey'> = {}
): KeyboardShortcut {
	const modifierKey = getModifierKey();
	
	return {
		key,
		[modifierKey]: true,
		...options,
		handler
	};
}

// Export singleton instance
export const keyboardShortcutManager = new KeyboardShortcutManager();