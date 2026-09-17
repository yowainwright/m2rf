'use client';

import { useEffect } from 'react';

export function useSaveShortcut(callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey;
      const isSaveShortcut = hasModifier && event.key.toLowerCase() === 's';
      const shouldIgnore = !isSaveShortcut || event.altKey || event.shiftKey || event.isComposing;
      if (shouldIgnore) return;
      event.preventDefault();
      if (event.repeat) return;
      callback();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callback]);
}
