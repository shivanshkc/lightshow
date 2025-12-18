import type { Kernel } from '@kernel';

/**
 * DOM keyboard input controller.
 *
 * Translates key bindings into kernel Commands.
 * This replaces the previous React hook-based keyboard listener.
 */
export class DomKeyboardController {
  private boundKeyDown: (e: KeyboardEvent) => void;
  private attached = false;

  constructor(private readonly kernel: Kernel) {
    this.boundKeyDown = this.onKeyDown.bind(this);
  }

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', this.boundKeyDown);
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    window.removeEventListener('keydown', this.boundKeyDown);
  }

  private onKeyDown(e: KeyboardEvent) {
    // Don't trigger if typing in input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Esc: deselect
    if (e.key === 'Escape') {
      e.preventDefault();
      // Prevent other global listeners (e.g. legacy CameraController) from also handling Escape.
      e.stopImmediatePropagation();
      this.kernel.dispatch({ v: 1, type: 'selection.set', objectId: null });
      return;
    }

    const isMac = navigator.platform.includes('Mac');
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // Undo: Ctrl/Cmd + Z
    if (cmdKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.kernel.dispatch({ v: 1, type: 'history.undo' });
      return;
    }

    // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
    if (cmdKey && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
      e.preventDefault();
      this.kernel.dispatch({ v: 1, type: 'history.redo' });
      return;
    }

    const selectedObjectId = this.kernel.queries.getSceneSnapshot().selectedObjectId;

    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (selectedObjectId) {
        this.kernel.dispatch({ v: 1, type: 'object.remove', objectId: selectedObjectId });
      }
      return;
    }

    // Duplicate: Ctrl/Cmd + D
    if (cmdKey && e.key === 'd') {
      e.preventDefault();
      if (selectedObjectId) {
        this.kernel.dispatch({ v: 1, type: 'object.duplicate', objectId: selectedObjectId });
      }
      return;
    }
  }
}


