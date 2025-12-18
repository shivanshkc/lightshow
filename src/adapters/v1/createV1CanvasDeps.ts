import { useCameraStore } from '@store';
import { useGizmoStore } from '@store';

/**
 * Temporary Milestone 07 adapter:
 * Canvas should not import v1 stores directly; only adapters may depend on store singletons.
 *
 * This adapter exposes the minimal read/write surface Canvas needs.
 */
export type V1CanvasDeps = {
  getCameraState: () => ReturnType<typeof useCameraStore.getState>;
  getGizmoState: () => ReturnType<typeof useGizmoStore.getState>;
};

export function createV1CanvasDeps(): V1CanvasDeps {
  return {
    getCameraState: () => useCameraStore.getState(),
    getGizmoState: () => useGizmoStore.getState(),
  };
}


