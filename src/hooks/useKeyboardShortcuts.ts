import { useEffect } from 'react';
import { useSceneStore } from '../store/sceneStore';

/**
 * Global keyboard shortcuts for scene operations.
 * - Delete/Backspace: delete selected
 * - Ctrl/Cmd + D: duplicate selected
 * - Ctrl/Cmd + Z: undo
 * - Ctrl/Cmd + Shift + Z / Ctrl/Cmd + Y: redo
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.includes('Mac');
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (cmdKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        (useSceneStore.getState() as any).undo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (cmdKey && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        (useSceneStore.getState() as any).redo();
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        useSceneStore.getState().deleteSelected();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (cmdKey && e.key === 'd') {
        e.preventDefault();
        useSceneStore.getState().duplicateSelected();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}


