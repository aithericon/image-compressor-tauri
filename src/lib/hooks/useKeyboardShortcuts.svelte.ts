/**
 * Keyboard shortcuts hook for the compression workspace
 * Provides platform-aware keyboard shortcuts for common actions
 */

import { onMount } from 'svelte';

export interface KeyboardShortcut {
	key: string;
	modifiers?: {
		ctrl?: boolean;
		shift?: boolean;
		alt?: boolean;
		meta?: boolean; // Command key on Mac
	};
	handler: (event: KeyboardEvent) => void;
	description: string;
}

// Platform detection
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Creates a keyboard shortcut listener
 * @param shortcuts Array of keyboard shortcuts to register
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
	onMount(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Don't trigger shortcuts when typing in inputs
			const target = event.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
				return;
			}

			for (const shortcut of shortcuts) {
				const modifiers = shortcut.modifiers || {};

				// Check if the key matches
				const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();

				// Platform-aware modifier matching
				// If both meta and ctrl are specified, it means "use the platform-appropriate one"
				const wantsCmdCtrl = modifiers.meta && modifiers.ctrl;
				const hasCmdCtrl = isMac ? event.metaKey : event.ctrlKey;

				// Check if modifiers match
				const ctrlMatches = wantsCmdCtrl
					? hasCmdCtrl  // Platform-appropriate key
					: (modifiers.ctrl === undefined || event.ctrlKey === modifiers.ctrl);
				const metaMatches = wantsCmdCtrl
					? hasCmdCtrl  // Platform-appropriate key
					: (modifiers.meta === undefined || event.metaKey === modifiers.meta);
				const shiftMatches = modifiers.shift === undefined || event.shiftKey === modifiers.shift;
				const altMatches = modifiers.alt === undefined || event.altKey === modifiers.alt;

				if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
					event.preventDefault();
					shortcut.handler(event);
					break;
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});
}

/**
 * Formats a keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
	const parts: string[] = [];
	const modifiers = shortcut.modifiers || {};

	if (isMac) {
		if (modifiers.meta || modifiers.ctrl) parts.push('⌘');
		if (modifiers.shift) parts.push('⇧');
		if (modifiers.alt) parts.push('⌥');
	} else {
		if (modifiers.ctrl || modifiers.meta) parts.push('Ctrl');
		if (modifiers.shift) parts.push('Shift');
		if (modifiers.alt) parts.push('Alt');
	}

	parts.push(shortcut.key.toUpperCase());
	return parts.join(isMac ? '' : '+');
}
