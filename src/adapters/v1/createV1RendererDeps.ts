import type { RendererDeps } from '@renderer';
import type { KernelEvents, KernelQueries } from '@ports';
import { useCameraStore } from '@store';
import { useGizmoStore } from '@store';

function axisToId(axis: string | null): number {
  switch (axis) {
    case 'x':
      return 1;
    case 'y':
      return 2;
    case 'z':
      return 3;
    case 'xy':
      return 4;
    case 'xz':
      return 5;
    case 'yz':
      return 6;
    case 'xyz':
      return 7;
    case 'trackball':
      return 8;
    case 'uniform':
      return 9;
    default:
      return 0;
  }
}

/**
 * Temporary Milestone 03 adapter: provide the Renderer with kernel notifications
 * (events/queries) while still sourcing camera + gizmo state from v1 stores.
 */
export function createV1RendererDeps(kernel: {
  queries: KernelQueries;
  events: KernelEvents;
}): RendererDeps {
  return {
    queries: kernel.queries,
    events: kernel.events,
    getCameraState: () => {
      const s = useCameraStore.getState();
      return {
        position: s.position,
        target: s.target,
        fovY: s.fovY,
        distance: s.distance,
      };
    },
    getGizmoState: () => {
      const g = useGizmoStore.getState();
      return {
        mode: g.mode,
        hoveredAxisId: axisToId(g.hoveredAxis as any),
        activeAxisId: axisToId(g.activeAxis as any),
      };
    },
  };
}


