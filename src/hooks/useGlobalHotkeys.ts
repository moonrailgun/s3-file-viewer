import { useEffect } from 'react';

interface HotkeyHandler {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

/**
 * Global hotkey hook
 * Handles keyboard shortcuts across the application
 */
export function useGlobalHotkeys(handlers: HotkeyHandler[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const hotkey of handlers) {
        // Check if key matches
        if (event.key.toLowerCase() !== hotkey.key.toLowerCase()) continue;

        // Check modifier keys
        const ctrlMatch = hotkey.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = hotkey.metaKey ? event.metaKey : !event.metaKey;
        const shiftMatch = hotkey.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = hotkey.altKey ? event.altKey : !event.altKey;

        if (ctrlMatch && metaMatch && shiftMatch && altMatch) {
          // For Cmd+F and similar, allow even when in input
          const allowInInput =
            hotkey.key === 'f' && (event.metaKey || event.ctrlKey);

          if (!isInput || allowInInput) {
            if (hotkey.preventDefault !== false) {
              event.preventDefault();
            }
            hotkey.handler(event);
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}

/**
 * Get the display string for hotkey tooltip
 * @param key - The key character
 * @param useCmd - Whether to use Cmd (Mac) or Ctrl (Windows/Linux)
 */
export function getHotkeyDisplay(key: string, useCmd = true): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac && useCmd ? '⌘' : 'Ctrl';
  return `${modifierKey}+${key.toUpperCase()}`;
}
