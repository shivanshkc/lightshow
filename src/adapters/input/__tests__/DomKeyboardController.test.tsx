import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DomKeyboardController } from '../DomKeyboardController';
import type { Kernel } from '@kernel';

function makeKernel(selectedObjectId: string | null = null): Kernel {
  return {
    dispatch: vi.fn(),
    queries: {
      getSceneSnapshot: () =>
        ({
          objects: [],
          selectedObjectId,
          backgroundColor: [0, 0, 0],
          history: { canUndo: false, canRedo: false },
        }) as any,
    },
    events: {
      subscribe: () => () => {},
    },
  };
}

describe('DomKeyboardController', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Ensure no listeners leak across tests.
    window.onkeydown = null;
  });

  it('dispatches history.undo on Ctrl/Cmd+Z', () => {
    const kernel = makeKernel();
    const c = new DomKeyboardController(kernel);
    c.attach();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));

    expect(kernel.dispatch).toHaveBeenCalledWith({ v: 1, type: 'history.undo' });
    c.detach();
  });

  it('dispatches object.remove for Delete when selection exists', () => {
    const kernel = makeKernel('obj-1');
    const c = new DomKeyboardController(kernel);
    c.attach();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));

    expect(kernel.dispatch).toHaveBeenCalledWith({ v: 1, type: 'object.remove', objectId: 'obj-1' });
    c.detach();
  });

  it('dispatches selection.set(null) on Escape', () => {
    const kernel = makeKernel('obj-1');
    const c = new DomKeyboardController(kernel);
    c.attach();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(kernel.dispatch).toHaveBeenCalledWith({ v: 1, type: 'selection.set', objectId: null });
    c.detach();
  });

  it('does nothing on Delete when no selection', () => {
    const kernel = makeKernel(null);
    const c = new DomKeyboardController(kernel);
    c.attach();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));

    expect(kernel.dispatch).not.toHaveBeenCalled();
    c.detach();
  });
});


