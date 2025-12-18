import { useCameraStore } from '@store';
import { useGizmoStore } from '@store';

/**
 * Canvas deps adapter backed by the legacy Zustand stores.
 *
 * Canvas should not import store singletons directly; only adapters may depend on stores.
 * This adapter exposes the minimal read/write surface Canvas needs.
 */
export type CanvasDepsFromStores = {
  getCameraState: () => ReturnType<typeof useCameraStore.getState>;
  getGizmoState: () => ReturnType<typeof useGizmoStore.getState>;
};

export function createCanvasDepsFromStores(): CanvasDepsFromStores {
  return {
    getCameraState: () => useCameraStore.getState(),
    getGizmoState: () => useGizmoStore.getState(),
  };
}


