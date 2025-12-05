import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSceneStore } from '../store/sceneStore';

describe('Scene integration', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
  });

  it('renderer receives scene updates via subscription', () => {
    const callback = vi.fn();
    const unsubscribe = useSceneStore.subscribe(callback);
    
    useSceneStore.getState().addSphere();
    expect(callback).toHaveBeenCalled();
    
    unsubscribe();
  });

  it('scene changes trigger multiple updates', () => {
    const callback = vi.fn();
    const unsubscribe = useSceneStore.subscribe(callback);
    
    useSceneStore.getState().addSphere();
    useSceneStore.getState().addCuboid();
    useSceneStore.getState().addSphere();
    
    expect(callback).toHaveBeenCalledTimes(3);
    
    unsubscribe();
  });

  it('subscription receives correct state', () => {
    let objectCount = 0;
    const unsubscribe = useSceneStore.subscribe((state) => {
      objectCount = state.objects.length;
    });
    
    useSceneStore.getState().addSphere();
    expect(objectCount).toBe(1);
    
    useSceneStore.getState().addCuboid();
    expect(objectCount).toBe(2);
    
    unsubscribe();
  });

  it('can unsubscribe from store', () => {
    const callback = vi.fn();
    const unsubscribe = useSceneStore.subscribe(callback);
    
    useSceneStore.getState().addSphere();
    expect(callback).toHaveBeenCalledTimes(1);
    
    unsubscribe();
    
    useSceneStore.getState().addSphere();
    expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
  });
});

describe('Scene rendering flow', () => {
  it('objects are serializable for GPU', () => {
    useSceneStore.getState().addSphere();
    const objects = useSceneStore.getState().objects;
    
    // Check that object has all required fields for GPU serialization
    const obj = objects[0];
    expect(obj.transform.position).toBeDefined();
    expect(obj.transform.position.length).toBe(3);
    expect(obj.transform.rotation).toBeDefined();
    expect(obj.transform.scale).toBeDefined();
    expect(obj.material.color).toBeDefined();
    expect(obj.material.roughness).toBeDefined();
    expect(obj.type).toBeDefined();
  });
});

