import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../store/sceneStore';

describe('sceneStore', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
  });

  it('starts with empty objects array', () => {
    expect(useSceneStore.getState().objects).toHaveLength(0);
  });

  it('starts with null selection', () => {
    expect(useSceneStore.getState().selectedObjectId).toBeNull();
  });

  describe('addSphere', () => {
    it('adds sphere and returns id', () => {
      const id = useSceneStore.getState().addSphere();
      expect(id).toBeDefined();
      expect(useSceneStore.getState().objects).toHaveLength(1);
      expect(useSceneStore.getState().objects[0].type).toBe('sphere');
    });

    it('generates unique ids', () => {
      const id1 = useSceneStore.getState().addSphere();
      const id2 = useSceneStore.getState().addSphere();
      expect(id1).not.toBe(id2);
    });

    it('increments sphere name count', () => {
      useSceneStore.getState().addSphere();
      useSceneStore.getState().addSphere();
      const objects = useSceneStore.getState().objects;
      expect(objects[0].name).toBe('Sphere 1');
      expect(objects[1].name).toBe('Sphere 2');
    });
  });

  describe('addCuboid', () => {
    it('adds cuboid and returns id', () => {
      const id = useSceneStore.getState().addCuboid();
      expect(id).toBeDefined();
      expect(useSceneStore.getState().objects).toHaveLength(1);
      expect(useSceneStore.getState().objects[0].type).toBe('cuboid');
    });

    it('increments cuboid name count', () => {
      useSceneStore.getState().addCuboid();
      useSceneStore.getState().addCuboid();
      const objects = useSceneStore.getState().objects;
      expect(objects[0].name).toBe('Cuboid 1');
      expect(objects[1].name).toBe('Cuboid 2');
    });
  });

  describe('removeObject', () => {
    it('removes object by id', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().removeObject(id);
      expect(useSceneStore.getState().objects).toHaveLength(0);
    });

    it('clears selection when selected object is removed', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().selectObject(id);
      expect(useSceneStore.getState().selectedObjectId).toBe(id);
      
      useSceneStore.getState().removeObject(id);
      expect(useSceneStore.getState().selectedObjectId).toBeNull();
    });

    it('keeps selection when non-selected object is removed', () => {
      const id1 = useSceneStore.getState().addSphere();
      const id2 = useSceneStore.getState().addSphere();
      useSceneStore.getState().selectObject(id1);
      
      useSceneStore.getState().removeObject(id2);
      expect(useSceneStore.getState().selectedObjectId).toBe(id1);
    });
  });

  describe('duplicateObject', () => {
    it('creates a copy of the object', () => {
      const id = useSceneStore.getState().addSphere();
      const newId = useSceneStore.getState().duplicateObject(id);
      
      expect(newId).toBeDefined();
      expect(useSceneStore.getState().objects).toHaveLength(2);
    });

    it('offsets position of duplicate', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().duplicateObject(id);
      
      const objects = useSceneStore.getState().objects;
      expect(objects[1].transform.position[0]).toBe(1); // Offset by 1
    });

    it('appends Copy to name', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().duplicateObject(id);
      
      const objects = useSceneStore.getState().objects;
      expect(objects[1].name).toBe('Sphere 1 Copy');
    });

    it('returns null for non-existent id', () => {
      const result = useSceneStore.getState().duplicateObject('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('selectObject', () => {
    it('selects object by id', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().selectObject(id);
      expect(useSceneStore.getState().selectedObjectId).toBe(id);
    });

    it('deselects with null', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().selectObject(id);
      useSceneStore.getState().selectObject(null);
      expect(useSceneStore.getState().selectedObjectId).toBeNull();
    });
  });

  describe('getSelectedObject', () => {
    it('returns selected object', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().selectObject(id);
      
      const selected = useSceneStore.getState().getSelectedObject();
      expect(selected).toBeDefined();
      expect(selected?.id).toBe(id);
    });

    it('returns null when nothing selected', () => {
      const selected = useSceneStore.getState().getSelectedObject();
      expect(selected).toBeNull();
    });
  });

  describe('updateTransform', () => {
    it('updates position', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().updateTransform(id, { position: [1, 2, 3] });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.transform.position).toEqual([1, 2, 3]);
    });

    it('preserves other transform properties', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().updateTransform(id, { position: [1, 2, 3] });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.transform.scale).toEqual([1, 1, 1]);
      expect(obj?.transform.rotation).toEqual([0, 0, 0]);
    });
  });

  describe('updateMaterial', () => {
    it('updates color', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().updateMaterial(id, { color: [1, 0, 0] });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.material.color).toEqual([1, 0, 0]);
    });

    it('preserves other material properties', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().updateMaterial(id, { color: [1, 0, 0] });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.material.roughness).toBe(0.5);
    });
  });

  describe('getObject', () => {
    it('returns object by id', () => {
      const id = useSceneStore.getState().addSphere();
      const obj = useSceneStore.getState().getObject(id);
      expect(obj).toBeDefined();
      expect(obj?.id).toBe(id);
    });

    it('returns undefined for non-existent id', () => {
      const obj = useSceneStore.getState().getObject('non-existent');
      expect(obj).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('removes all objects', () => {
      useSceneStore.getState().addSphere();
      useSceneStore.getState().addCuboid();
      useSceneStore.getState().clear();
      expect(useSceneStore.getState().objects).toHaveLength(0);
    });

    it('clears selection', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().selectObject(id);
      useSceneStore.getState().clear();
      expect(useSceneStore.getState().selectedObjectId).toBeNull();
    });
  });
});

