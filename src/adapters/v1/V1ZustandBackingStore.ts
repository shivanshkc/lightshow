import type { KernelBackingStore } from '@kernel';
import type { Command, SceneObjectSnapshot, SceneSnapshot, Vec3 } from '@ports';
import { useSceneStore } from '@store';
import { raycaster } from '@core';

function vec3Equals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Temporary adapter (Milestone 03 / Step 3.2):
 * Bridges KernelBackingStore to the existing Zustand scene store.
 *
 * This allows Kernel to remain framework/state-library agnostic while the app
 * is progressively rewired to use ports.
 */
export class V1ZustandBackingStore implements KernelBackingStore {
  private last:
    | {
        objectsRef: unknown;
        selectedObjectId: string | null;
        backgroundRef: unknown;
        canUndo: boolean;
        canRedo: boolean;
        snapshot: SceneSnapshot;
      }
    | null = null;

  getSceneSnapshot(): SceneSnapshot {
    const s = useSceneStore.getState();

    const objectsRef = s.objects as unknown;
    const selectedObjectId = s.selectedObjectId;
    const backgroundRef = s.backgroundColor as unknown;
    const canUndo = (s as any).canUndo?.() ?? false;
    const canRedo = (s as any).canRedo?.() ?? false;

    // Allocation-light + referentially stable for useSyncExternalStore:
    // reuse the exact same snapshot object when nothing changed.
    if (
      this.last &&
      this.last.objectsRef === objectsRef &&
      this.last.selectedObjectId === selectedObjectId &&
      this.last.backgroundRef === backgroundRef &&
      this.last.canUndo === canUndo &&
      this.last.canRedo === canRedo
    ) {
      return this.last.snapshot;
    }

    const snapshot: SceneSnapshot = {
      objects: s.objects as unknown as readonly SceneObjectSnapshot[],
      selectedObjectId,
      backgroundColor: s.backgroundColor as Vec3,
      history: { canUndo, canRedo },
    };

    this.last = { objectsRef, selectedObjectId, backgroundRef, canUndo, canRedo, snapshot };
    return snapshot;
  }

  apply(command: Command): { stateChanged: boolean; renderInvalidated: boolean } {
    const s = useSceneStore.getState();

    switch (command.type) {
      case 'selection.set': {
        if (s.selectedObjectId === command.objectId) {
          return { stateChanged: false, renderInvalidated: false };
        }
        s.selectObject(command.objectId);
        return { stateChanged: true, renderInvalidated: false };
      }

      case 'selection.pick': {
        const result = raycaster.pickWithRay(command.ray as any, s.objects as any);
        if (s.selectedObjectId === result.objectId) {
          return { stateChanged: false, renderInvalidated: false };
        }
        s.selectObject(result.objectId);
        return { stateChanged: true, renderInvalidated: false };
      }

      case 'object.add': {
        const id =
          command.primitive === 'sphere' ? s.addSphere() : s.addCuboid();
        return { stateChanged: id !== null, renderInvalidated: id !== null };
      }

      case 'object.remove': {
        const exists = !!s.getObject(command.objectId);
        if (!exists) return { stateChanged: false, renderInvalidated: false };
        s.removeObject(command.objectId);
        return { stateChanged: true, renderInvalidated: true };
      }

      case 'object.duplicate': {
        const newId = s.duplicateObject(command.objectId);
        return {
          stateChanged: newId !== null,
          renderInvalidated: newId !== null,
        };
      }

      case 'object.rename': {
        const obj = s.getObject(command.objectId);
        if (!obj) return { stateChanged: false, renderInvalidated: false };
        if (obj.name === command.name) return { stateChanged: false, renderInvalidated: false };
        s.renameObject(command.objectId, command.name);
        return { stateChanged: true, renderInvalidated: false };
      }

      case 'object.visibility.set': {
        const obj = s.getObject(command.objectId);
        if (!obj) return { stateChanged: false, renderInvalidated: false };
        if (obj.visible === command.visible) return { stateChanged: false, renderInvalidated: false };
        if (obj.visible !== command.visible) s.toggleVisibility(command.objectId);
        return { stateChanged: true, renderInvalidated: true };
      }

      case 'transform.update': {
        const obj = s.getObject(command.objectId);
        if (!obj) return { stateChanged: false, renderInvalidated: false };
        const hasPatch =
          !!command.transform.position ||
          !!command.transform.rotation ||
          !!command.transform.scale;
        if (!hasPatch) return { stateChanged: false, renderInvalidated: false };
        s.updateTransform(command.objectId, command.transform as any);
        return { stateChanged: true, renderInvalidated: true };
      }

      case 'material.update': {
        const obj = s.getObject(command.objectId);
        if (!obj) return { stateChanged: false, renderInvalidated: false };
        const keys = Object.keys(command.material);
        if (keys.length === 0) return { stateChanged: false, renderInvalidated: false };
        s.updateMaterial(command.objectId, command.material as any);
        return { stateChanged: true, renderInvalidated: true };
      }

      case 'environment.background.set': {
        if (vec3Equals(s.backgroundColor as Vec3, command.color)) {
          return { stateChanged: false, renderInvalidated: false };
        }
        s.setBackgroundColor(command.color as any);
        return { stateChanged: true, renderInvalidated: true };
      }

      case 'environment.background.preset': {
        // Compute target without allocating a new array unless it differs.
        const presets: Record<'day' | 'dusk' | 'night', Vec3> = {
          day: [0.5, 0.7, 1.0],
          dusk: [0.18, 0.22, 0.35],
          night: [0.04, 0.05, 0.1],
        };
        const next = presets[command.preset];
        if (vec3Equals(s.backgroundColor as Vec3, next)) {
          return { stateChanged: false, renderInvalidated: false };
        }
        s.applyBackgroundPreset(command.preset);
        return { stateChanged: true, renderInvalidated: true };
      }

      case 'history.undo': {
        const can = (s as any).canUndo?.() ?? false;
        if (!can) return { stateChanged: false, renderInvalidated: false };
        (s as any).undo();
        return { stateChanged: true, renderInvalidated: true };
      }

      case 'history.redo': {
        const can = (s as any).canRedo?.() ?? false;
        if (!can) return { stateChanged: false, renderInvalidated: false };
        (s as any).redo();
        return { stateChanged: true, renderInvalidated: true };
      }
    }
  }
}


