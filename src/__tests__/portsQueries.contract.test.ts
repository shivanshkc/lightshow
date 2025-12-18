import { describe, it, expect } from 'vitest';
import type { KernelQueries, SceneSnapshot } from '@ports';

describe('ports/queries contract', () => {
  it('KernelQueries exposes getSceneSnapshot', () => {
    const q: KernelQueries = {
      getSceneSnapshot: () =>
        ({
          objects: [
            {
              id: 'obj-1',
              name: 'Sphere 1',
              type: 'sphere',
              visible: true,
              transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
              material: {
                type: 'plastic',
                color: [1, 1, 1],
                ior: 1.5,
                intensity: 5,
              },
            },
          ],
          selectedObjectId: null,
          backgroundColor: [0, 0, 0],
          history: { canUndo: false, canRedo: false },
        }) satisfies SceneSnapshot,
    };

    expect(typeof q.getSceneSnapshot).toBe('function');
  });
});


