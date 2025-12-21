import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '@store';
import { createDefaultSphere } from '@core';
import { ZustandSceneBackingStore } from '../zustand/ZustandSceneBackingStore';

describe('adapters/zustand ZustandSceneBackingStore', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
  });

  it('selection.set changes state but does not invalidate render', () => {
    const backing = new ZustandSceneBackingStore();
    const id = useSceneStore.getState().addSphere()!;

    const res = backing.apply({ v: 1, type: 'selection.set', objectId: id });

    expect(res).toEqual({ stateChanged: true, renderInvalidated: false });
    expect(useSceneStore.getState().selectedObjectId).toBe(id);
  });

  it('selection.pick chooses the closest visible hit and does not invalidate render', () => {
    const backing = new ZustandSceneBackingStore();

    useSceneStore.setState({
      objects: [
        {
          id: 'near',
          ...createDefaultSphere(),
          name: 'Near',
          visible: true,
          transform: { position: [0, 0, 2], rotation: [0, 0, 0], scale: [1, 1, 1] },
        },
        {
          id: 'far',
          ...createDefaultSphere(),
          name: 'Far',
          visible: true,
          transform: { position: [0, 0, -2], rotation: [0, 0, 0], scale: [1, 1, 1] },
        },
        {
          id: 'hidden',
          ...createDefaultSphere(),
          name: 'Hidden',
          visible: false,
          transform: { position: [0, 0, 3], rotation: [0, 0, 0], scale: [2, 2, 2] },
        },
      ],
      selectedObjectId: null,
    } as any);

    const res = backing.apply({
      v: 1,
      type: 'selection.pick',
      ray: { origin: [0, 0, 5], direction: [0, 0, -1] },
    });

    expect(res).toEqual({ stateChanged: true, renderInvalidated: false });
    expect(useSceneStore.getState().selectedObjectId).toBe('near');
  });

  it('object.add invalidates render when object is created', () => {
    const backing = new ZustandSceneBackingStore();

    const primitives = [
      'sphere',
      'cuboid',
      'cylinder',
      'cone',
      'capsule',
      'torus',
    ] as const;

    for (const primitive of primitives) {
      useSceneStore.getState().clear();
      const res = backing.apply({ v: 1, type: 'object.add', primitive });
      expect(res.stateChanged).toBe(true);
      expect(res.renderInvalidated).toBe(true);
      expect(useSceneStore.getState().objects.length).toBe(1);
      expect(useSceneStore.getState().objects[0]?.type).toBe(primitive);
    }
  });

  it('transform.update changes state and invalidates render', () => {
    const backing = new ZustandSceneBackingStore();
    const id = useSceneStore.getState().addSphere()!;

    const res = backing.apply({
      v: 1,
      type: 'transform.update',
      objectId: id,
      transform: { position: [1, 2, 3] },
    });

    expect(res).toEqual({ stateChanged: true, renderInvalidated: true });
    expect(useSceneStore.getState().getObject(id)?.transform.position).toEqual([1, 2, 3]);
  });

});


