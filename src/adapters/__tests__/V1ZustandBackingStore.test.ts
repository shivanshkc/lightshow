import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '@store';
import { V1ZustandBackingStore } from '../v1/V1ZustandBackingStore';

describe('adapters/v1 V1ZustandBackingStore', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
    useSceneStore.setState({ past: [], future: [] } as any);
  });

  it('selection.set changes state but does not invalidate render', () => {
    const backing = new V1ZustandBackingStore();
    const id = useSceneStore.getState().addSphere()!;

    const res = backing.apply({ v: 1, type: 'selection.set', objectId: id });

    expect(res).toEqual({ stateChanged: true, renderInvalidated: false });
    expect(useSceneStore.getState().selectedObjectId).toBe(id);
  });

  it('object.add invalidates render when object is created', () => {
    const backing = new V1ZustandBackingStore();

    const res = backing.apply({ v: 1, type: 'object.add', primitive: 'sphere' });

    expect(res.stateChanged).toBe(true);
    expect(res.renderInvalidated).toBe(true);
    expect(useSceneStore.getState().objects.length).toBe(1);
  });

  it('history.undo is a no-op when cannot undo', () => {
    const backing = new V1ZustandBackingStore();
    const res = backing.apply({ v: 1, type: 'history.undo' });
    expect(res).toEqual({ stateChanged: false, renderInvalidated: false });
  });
});


