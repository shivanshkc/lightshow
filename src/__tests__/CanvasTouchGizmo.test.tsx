import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { KernelProvider } from '@adapters';
import * as adapters from '@adapters';
import { KernelShell } from '@kernel';
import { ZustandSceneBackingStore } from '@adapters';
import { GizmoRaycaster } from '../gizmos/GizmoRaycaster';
import { useGizmoStore } from '../store/gizmoStore';
import { CameraController } from '../core/CameraController';

// Avoid WebGPU complexity in this test: mock init + renderer so Canvas can reach "ready" state.
vi.mock('../renderer/webgpu', () => ({
  initWebGPU: vi.fn(async (canvas: HTMLCanvasElement) => ({
    device: {
      destroy: vi.fn(),
      lost: new Promise(() => {}),
    },
    context: { configure: vi.fn() },
    format: 'bgra8unorm',
    canvas,
  })),
}));

vi.mock('../renderer/Renderer', () => ({
  Renderer: class {
    constructor(_ctx: any, _deps: any) {}
    start() {}
    resize() {}
    destroy() {}
    resetAccumulation() {}
  },
}));

import { Canvas } from '../components/Canvas';

describe('Canvas touch gizmo interaction (hit-test wins)', () => {
  beforeEach(() => {
    // Keep module mock implementations (initWebGPU/Renderer) intact.
    vi.clearAllMocks();

    useGizmoStore.setState({ mode: 'translate', hoveredAxis: null, activeAxis: null, isDragging: false } as any);
  });

  it('starts a gizmo drag on touchstart when gizmo pick hits, disables camera, and updates via touchmove', async () => {
    const kernel = new KernelShell(new ZustandSceneBackingStore());
    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'cuboid' });
    const snap = kernel.queries.getSceneSnapshot();
    const objectId = snap.objects[0]!.id;
    kernel.dispatch({ v: 1, type: 'selection.set', objectId });

    const dispatchSpy = vi.spyOn(kernel, 'dispatch');
    const setEnabledSpy = vi.spyOn(CameraController.prototype, 'setEnabled');
    const pickSpy = vi.spyOn(GizmoRaycaster, 'pick').mockReturnValue('x');

    const dragCmd = { v: 1, type: 'transform.update', objectId, transform: { position: [1, 2, 3] } } as const;
    const dragSpy = vi.spyOn(adapters, 'computeGizmoDragCommand').mockReturnValue(dragCmd as any);

    const { container } = render(
      <KernelProvider kernel={kernel}>
        <Canvas />
      </KernelProvider>
    );

    // Wait for init effect to complete (controllerRef exists) and for the loading overlay to be removed.
    await waitFor(() => {
      expect(screen.queryByText('Initializing WebGPU...')).toBeNull();
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();

    // Stabilize geometry for ray math (even though pick is mocked).
    (canvas as any).getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 50, clientY: 50, identifier: 1 }],
      changedTouches: [{ clientX: 50, clientY: 50, identifier: 1 }],
    });

    expect(pickSpy).toHaveBeenCalled();
    // Should compute a non-zero pickTolerance for touch.
    const args = pickSpy.mock.calls[0]!;
    expect(args.length).toBe(5);
    expect(args[4]).toBeGreaterThan(0);

    expect(useGizmoStore.getState().isDragging).toBe(true);
    expect(useGizmoStore.getState().activeAxis).toBe('x');
    expect(setEnabledSpy).toHaveBeenCalledWith(false);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'history.group.begin', label: 'transform' })
    );

    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 60, clientY: 55, identifier: 1 }],
    });

    expect(dragSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'transform.update' }));

    fireEvent.touchEnd(canvas, {
      touches: [],
      changedTouches: [{ clientX: 60, clientY: 55, identifier: 1 }],
    });

    expect(useGizmoStore.getState().isDragging).toBe(false);
    expect(setEnabledSpy).toHaveBeenCalledWith(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'history.group.end' })
    );
  });

  it('does not start a gizmo drag on touchstart when gizmo pick misses', async () => {
    const kernel = new KernelShell(new ZustandSceneBackingStore());
    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'cuboid' });
    const snap = kernel.queries.getSceneSnapshot();
    const objectId = snap.objects[0]!.id;
    kernel.dispatch({ v: 1, type: 'selection.set', objectId });

    vi.spyOn(GizmoRaycaster, 'pick').mockReturnValue(null);
    const setEnabledSpy = vi.spyOn(CameraController.prototype, 'setEnabled');

    const { container } = render(
      <KernelProvider kernel={kernel}>
        <Canvas />
      </KernelProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Initializing WebGPU...')).toBeNull();
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    (canvas as any).getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 50, clientY: 50, identifier: 1 }],
      changedTouches: [{ clientX: 50, clientY: 50, identifier: 1 }],
    });

    expect(useGizmoStore.getState().isDragging).toBe(false);
    expect(setEnabledSpy).not.toHaveBeenCalledWith(false);
  });
});


