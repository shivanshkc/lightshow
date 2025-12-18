import { describe, it, expect } from 'vitest';
import type { Command, SceneSnapshot } from '@ports';
import { KernelShell, type KernelBackingStore } from '../Kernel';

function baseScene(): SceneSnapshot {
  return {
    objects: [],
    selectedObjectId: null,
    backgroundColor: [0, 0, 0],
    history: { canUndo: false, canRedo: false },
  };
}

function createMockStore(initial: SceneSnapshot = baseScene()): KernelBackingStore & { state: SceneSnapshot } {
  const store: KernelBackingStore & { state: SceneSnapshot } = {
    state: initial,
    getSceneSnapshot() {
      return this.state;
    },
    apply(command: Command) {
      switch (command.type) {
        case 'selection.set': {
          const next = { ...this.state, selectedObjectId: command.objectId };
          const changed = next.selectedObjectId !== this.state.selectedObjectId;
          this.state = next;
          // Selection must not invalidate render accumulation.
          return { stateChanged: changed, renderInvalidated: false };
        }
        default: {
          // For Step 3.1, treat other commands as committed edits.
          return { stateChanged: true, renderInvalidated: true };
        }
      }
    },
  };
  return store;
}

describe('kernel/KernelShell contract', () => {
  it('queries.getSceneSnapshot delegates to backing store', () => {
    const store = createMockStore({ ...baseScene(), selectedObjectId: 'a' });
    const kernel = new KernelShell(store);
    expect(kernel.queries.getSceneSnapshot().selectedObjectId).toBe('a');
  });

  it('dispatch emits state.changed then render.invalidated (for committed edits)', () => {
    const store = createMockStore();
    const kernel = new KernelShell(store);
    const events: string[] = [];
    kernel.events.subscribe((e) => events.push(e.type));

    kernel.dispatch({ v: 1, type: 'history.undo' });

    expect(events).toEqual(['state.changed', 'render.invalidated']);
  });

  it('dispatch does not emit render.invalidated for selection-only changes', () => {
    const store = createMockStore();
    const kernel = new KernelShell(store);
    const events: string[] = [];
    kernel.events.subscribe((e) => events.push(e.type));

    kernel.dispatch({ v: 1, type: 'selection.set', objectId: 'obj-1' });

    expect(events).toEqual(['state.changed']);
  });

  it('unsubscribe stops delivery', () => {
    const store = createMockStore();
    const kernel = new KernelShell(store);
    const events: string[] = [];

    const unsub = kernel.events.subscribe((e) => events.push(e.type));
    kernel.dispatch({ v: 1, type: 'history.undo' });
    unsub();
    kernel.dispatch({ v: 1, type: 'history.redo' });

    expect(events).toEqual(['state.changed', 'render.invalidated']);
  });
});


