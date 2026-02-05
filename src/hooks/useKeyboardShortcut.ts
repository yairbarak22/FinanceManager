'use client';

import { useEffect, useCallback, useMemo } from 'react';

interface UseKeyboardShortcutOptions {
  key: string | string[];
  callback: () => void;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  disabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcut({
  key,
  callback,
  ctrlKey = false,
  metaKey = false,
  shiftKey = false,
  altKey = false,
  disabled = false,
  preventDefault = true,
}: UseKeyboardShortcutOptions) {
  // Memoize keys array to prevent dependency issues
  const keys = useMemo(() => Array.isArray(key) ? key : [key], [key]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Don't trigger if user is typing in an input
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInputField) return;

      // Check modifier keys
      if (ctrlKey && !event.ctrlKey) return;
      if (metaKey && !event.metaKey) return;
      if (shiftKey && !event.shiftKey) return;
      if (altKey && !event.altKey) return;

      // Check if the pressed key matches any of the target keys
      const keyMatched = keys.some((k) => {
        // Handle special cases
        if (k === '+' && event.key === '+') return true;
        if (k === '+' && event.shiftKey && event.key === '=') return true; // Shift+= is +
        return event.key.toLowerCase() === k.toLowerCase();
      });

      if (keyMatched) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    },
    [keys, callback, ctrlKey, metaKey, shiftKey, altKey, disabled, preventDefault]
  );

  useEffect(() => {
    if (disabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, disabled]);
}

export default useKeyboardShortcut;

