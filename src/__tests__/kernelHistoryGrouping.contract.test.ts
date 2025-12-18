import { describe, it, expect, beforeEach } from 'vitest';
import { KernelShell } from '@kernel';
import { V1ZustandBackingStore } from '@adapters';
import { useSceneStore } from '@store';

describe('m06 history grouping (continuous transforms)', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
  });

  it('records one undo step for a grouped transform drag', () => {
    // Seed the scene outside the kernel so the kernel starts with empty history.
    const id = useSceneStore.getState().addSphere()!;
    const kernel = new KernelShell(new V1ZustandBackingStore());

    kernel.dispatch({ v: 1, type: 'history.group.begin', label: 'transform' });
    kernel.dispatch({ v: 1, type: 'transform.update', objectId: id, transform: { position: [1, 0, 0] } });
    kernel.dispatch({ v: 1, type: 'transform.update', objectId: id, transform: { position: [2, 0, 0] } });
    kernel.dispatch({ v: 1, type: 'transform.update', objectId: id, transform: { position: [3, 0, 0] } });

    // Until the group ends, undo should still be unavailable.
    expect(kernel.queries.getSceneSnapshot().history.canUndo).toBe(false);

    kernel.dispatch({ v: 1, type: 'history.group.end' });
    expect(kernel.queries.getSceneSnapshot().history.canUndo).toBe(true);

    kernel.dispatch({ v: 1, type: 'history.undo' });
    const pos = kernel.queries.getSceneSnapshot().objects.find((o) => o.id === id)!.transform.position;
    expect(pos).toEqual([0, 0, 0]);
  });

  it('discrete actions create immediate undo steps', () => {
    const kernel = new KernelShell(new V1ZustandBackingStore());
    expect(kernel.queries.getSceneSnapshot().history.canUndo).toBe(false);
    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'sphere' });
    expect(kernel.queries.getSceneSnapshot().history.canUndo).toBe(true);
  });
});


