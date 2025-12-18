import { describe, it, expect } from 'vitest';
import type { KernelQueries, SceneSnapshot } from '@ports';

describe('ports/queries contract', () => {
  it('KernelQueries exposes getSceneSnapshot', () => {
    const q: KernelQueries = {
      getSceneSnapshot: () =>
        ({
          objects: [],
          selectedObjectId: null,
          backgroundColor: [0, 0, 0],
          history: { canUndo: false, canRedo: false },
        }) satisfies SceneSnapshot,
    };

    expect(typeof q.getSceneSnapshot).toBe('function');
  });
});


