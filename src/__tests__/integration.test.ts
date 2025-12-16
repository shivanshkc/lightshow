import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSceneStore } from '../store/sceneStore';

describe('Scene Integration', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
  });

  describe('Store subscription', () => {
    it('callback is triggered when scene changes', () => {
      const callback = vi.fn();
      const unsubscribe = useSceneStore.subscribe(callback);

      useSceneStore.getState().addSphere();

      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });

    it('callback receives current state', () => {
      let capturedState: unknown = null;
      const unsubscribe = useSceneStore.subscribe((state) => {
        capturedState = state;
      });

      useSceneStore.getState().addSphere();

      expect(capturedState).not.toBeNull();
      expect((capturedState as { objects: unknown[] }).objects.length).toBe(1);

      unsubscribe();
    });

    it('multiple objects trigger multiple callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = useSceneStore.subscribe(callback);

      useSceneStore.getState().addSphere();
      useSceneStore.getState().addCuboid();
      useSceneStore.getState().addSphere();

      expect(callback).toHaveBeenCalledTimes(3);

      unsubscribe();
    });

    it('unsubscribe stops callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = useSceneStore.subscribe(callback);

      useSceneStore.getState().addSphere();
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      useSceneStore.getState().addCuboid();
      expect(callback).toHaveBeenCalledTimes(1); // No additional calls
    });
  });

  describe('Empty scene', () => {
    it('initial state has empty objects array', () => {
      expect(useSceneStore.getState().objects).toHaveLength(0);
    });

    it('clear removes all objects', () => {
      useSceneStore.getState().addSphere();
      useSceneStore.getState().addCuboid();
      expect(useSceneStore.getState().objects).toHaveLength(2);

      useSceneStore.getState().clear();
      expect(useSceneStore.getState().objects).toHaveLength(0);
    });
  });

  describe('Object visibility', () => {
    it('new objects are visible by default', () => {
      const id = useSceneStore.getState().addSphere()!;
      const obj = useSceneStore.getState().getObject(id);

      expect(obj?.visible).toBe(true);
    });

    it('visibility can be toggled', () => {
      const id = useSceneStore.getState().addSphere()!;

      useSceneStore.getState().updateObject(id, { visible: false });
      expect(useSceneStore.getState().getObject(id)?.visible).toBe(false);

      useSceneStore.getState().updateObject(id, { visible: true });
      expect(useSceneStore.getState().getObject(id)?.visible).toBe(true);
    });
  });

  describe('Object properties for GPU', () => {
    it('object has all required transform properties', () => {
      const id = useSceneStore.getState().addSphere()!;
      const obj = useSceneStore.getState().getObject(id);

      expect(obj?.transform.position).toBeDefined();
      expect(obj?.transform.position.length).toBe(3);
      expect(obj?.transform.rotation).toBeDefined();
      expect(obj?.transform.rotation.length).toBe(3);
      expect(obj?.transform.scale).toBeDefined();
      expect(obj?.transform.scale.length).toBe(3);
    });

    it('object has all required material properties', () => {
      const id = useSceneStore.getState().addSphere()!;
      const obj = useSceneStore.getState().getObject(id);

      expect(obj?.material.type).toBeDefined();
      expect(obj?.material.color).toBeDefined();
      expect(obj?.material.color.length).toBe(3);
      expect(typeof obj?.material.ior).toBe('number');
      expect(typeof obj?.material.intensity).toBe('number');
    });
  });
});

