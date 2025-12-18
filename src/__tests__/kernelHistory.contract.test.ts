import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '@store';
import { KernelShell } from '@kernel';
import { ZustandSceneBackingStore } from '@adapters';

describe('m06 history slice (kernel-facing contract)', () => {
  beforeEach(() => {
    // Start from an empty scene.
    useSceneStore.getState().clear();
  });

  it('exposes canUndo/canRedo via queries.getSceneSnapshot().history', () => {
    const kernel = new KernelShell(new ZustandSceneBackingStore());

    const snap0 = kernel.queries.getSceneSnapshot();
    expect(snap0.history.canUndo).toBe(false);
    expect(snap0.history.canRedo).toBe(false);

    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'sphere' });

    const snap1 = kernel.queries.getSceneSnapshot();
    expect(snap1.history.canUndo).toBe(true);
    expect(snap1.history.canRedo).toBe(false);

    kernel.dispatch({ v: 1, type: 'history.undo' });

    const snap2 = kernel.queries.getSceneSnapshot();
    expect(snap2.history.canUndo).toBe(false);
    expect(snap2.history.canRedo).toBe(true);
  });

  it('undo/redo roll back and forward a core operation (object.add)', () => {
    const kernel = new KernelShell(new ZustandSceneBackingStore());

    expect(kernel.queries.getSceneSnapshot().objects.length).toBe(0);

    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'sphere' });
    expect(kernel.queries.getSceneSnapshot().objects.length).toBe(1);

    kernel.dispatch({ v: 1, type: 'history.undo' });
    expect(kernel.queries.getSceneSnapshot().objects.length).toBe(0);

    kernel.dispatch({ v: 1, type: 'history.redo' });
    expect(kernel.queries.getSceneSnapshot().objects.length).toBe(1);
  });

  it('undo/redo are no-ops when unavailable (no events emitted)', () => {
    const kernel = new KernelShell(new ZustandSceneBackingStore());
    const events: string[] = [];
    kernel.events.subscribe((e) => events.push(e.type));

    // No history yet.
    kernel.dispatch({ v: 1, type: 'history.undo' });
    kernel.dispatch({ v: 1, type: 'history.redo' });

    expect(events).toEqual([]);
  });
});


