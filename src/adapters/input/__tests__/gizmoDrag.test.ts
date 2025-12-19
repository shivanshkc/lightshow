import { describe, it, expect } from 'vitest';
import { computeGizmoDragCommand } from '../gizmoDrag';

describe('adapters/input gizmoDrag', () => {
  it('produces a transform.update(position) for translate drag', () => {
    const cmd = computeGizmoDragCommand({
      mode: 'translate',
      axis: 'x',
      objectId: 'obj-1',
      objectType: 'cuboid',
      objectPosition: [0, 0, 0],
      startPosition: [0, 0, 0],
      startRotation: null,
      startScale: null,
      dragStartRay: { origin: [0, 0, 5], direction: [0, 0, -1] },
      dragStartMouse: [0, 0],
      currentMouse: { x: 10, y: 10 },
      rect: { left: 0, top: 0, width: 100, height: 100 },
      camera: {
        position: [0, 0, 5],
        fovY: Math.PI / 3,
        getViewMatrix: () => [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        ] as any,
      },
      modifiers: { ctrlOrMeta: false, shift: false },
      cameraForward: [0, 0, -1],
    });

    expect(cmd?.type).toBe('transform.update');
    expect(cmd && 'transform' in cmd && (cmd as any).transform.position).toBeDefined();
  });

  it('produces a transform.update(rotation) for rotate drag', () => {
    const cmd = computeGizmoDragCommand({
      mode: 'rotate',
      axis: 'y',
      objectId: 'obj-1',
      objectType: 'cuboid',
      objectPosition: [0, 0, 0],
      startPosition: [0, 0, 0],
      startRotation: [0, 0, 0],
      startScale: null,
      dragStartRay: null,
      dragStartMouse: [0, 0],
      currentMouse: { x: 30, y: 10 },
      rect: { left: 0, top: 0, width: 100, height: 100 },
      camera: {
        position: [0, 0, 5],
        fovY: Math.PI / 3,
        getViewMatrix: () => [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        ] as any,
      },
      modifiers: { ctrlOrMeta: false, shift: false },
      cameraForward: [0, 0, -1],
    });

    expect(cmd?.type).toBe('transform.update');
    expect(cmd && 'transform' in cmd && (cmd as any).transform.rotation).toBeDefined();
  });

  it('produces a transform.update(scale) for scale drag', () => {
    const cmd = computeGizmoDragCommand({
      mode: 'scale',
      axis: 'uniform',
      objectId: 'obj-1',
      objectType: 'sphere',
      objectPosition: [0, 0, 0],
      startPosition: [0, 0, 0],
      startRotation: null,
      startScale: [1, 1, 1],
      dragStartRay: null,
      dragStartMouse: [0, 0],
      currentMouse: { x: 40, y: 10 },
      rect: { left: 0, top: 0, width: 100, height: 100 },
      camera: {
        position: [0, 0, 5],
        fovY: Math.PI / 3,
        getViewMatrix: () => [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        ] as any,
      },
      modifiers: { ctrlOrMeta: false, shift: false },
      cameraForward: [0, 0, -1],
    });

    expect(cmd?.type).toBe('transform.update');
    expect(cmd && 'transform' in cmd && (cmd as any).transform.scale).toBeDefined();
  });
});


