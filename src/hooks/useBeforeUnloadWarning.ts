import { useEffect } from 'react';

/**
 * Registers a browser "are you sure you want to leave?" prompt when navigating away.
 * Note: Modern browsers show a generic message; custom text is ignored.
 */
export function useBeforeUnloadWarning(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required for Chrome/Safari to trigger the confirmation dialog.
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [enabled]);
}


