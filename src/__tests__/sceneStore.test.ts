import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../store/sceneStore';

describe('sceneStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSceneStore.getState().clear();
    // Clear history stacks for deterministic tests (history middleware will otherwise track `clear`)
    useSceneStore.setState({ past: [], future: [] } as any);
  });

  describe('initial state', () => {
    it('starts with empty objects array', () => {
      expect(useSceneStore.getState().objects).toHaveLength(0);
    });

    it('starts with no selection', () => {
      expect(useSceneStore.getState().selectedObjectId).toBeNull();
    });
  });

  describe('addSphere', () => {
    it('adds sphere and returns id', () => {
      const id = useSceneStore.getState().addSphere();
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(useSceneStore.getState().objects).toHaveLength(1);
    });

    it('created sphere has type sphere', () => {
      useSceneStore.getState().addSphere();
      
      expect(useSceneStore.getState().objects[0].type).toBe('sphere');
    });

    it('increments sphere name number', () => {
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
    });

    it('created cuboid has type cuboid', () => {
      useSceneStore.getState().addCuboid();
      
      expect(useSceneStore.getState().objects[0].type).toBe('cuboid');
    });

    it('increments cuboid name number', () => {
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

    it('clears selection when selected object removed', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().selectObject(id);
      
      useSceneStore.getState().removeObject(id);
      
      expect(useSceneStore.getState().selectedObjectId).toBeNull();
    });

    it('preserves other objects', () => {
      const id1 = useSceneStore.getState().addSphere();
      const id2 = useSceneStore.getState().addSphere();
      
      useSceneStore.getState().removeObject(id1);
      
      expect(useSceneStore.getState().objects).toHaveLength(1);
      expect(useSceneStore.getState().objects[0].id).toBe(id2);
    });
  });

  describe('duplicateObject', () => {
    it('duplicates object and returns new id', () => {
      const id = useSceneStore.getState().addSphere();
      
      const newId = useSceneStore.getState().duplicateObject(id);
      
      expect(newId).toBeDefined();
      expect(newId).not.toBe(id);
      expect(useSceneStore.getState().objects).toHaveLength(2);
    });

    it('duplicate has offset position', () => {
      const id = useSceneStore.getState().addSphere();
      const original = useSceneStore.getState().getObject(id);
      
      const newId = useSceneStore.getState().duplicateObject(id);
      const duplicate = useSceneStore.getState().getObject(newId!);
      
      expect(duplicate?.transform.position[0]).toBe(original!.transform.position[0] + 0.5);
    });

    it('duplicate has "Copy" suffix in name', () => {
      const id = useSceneStore.getState().addSphere();
      
      const newId = useSceneStore.getState().duplicateObject(id);
      const duplicate = useSceneStore.getState().getObject(newId!);
      
      expect(duplicate?.name).toContain('Copy');
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
      
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe(id);
    });

    it('returns null when nothing selected', () => {
      useSceneStore.getState().addSphere();
      
      const selected = useSceneStore.getState().getSelectedObject();
      
      expect(selected).toBeNull();
    });
  });

  describe('updateObject', () => {
    it('updates object properties', () => {
      const id = useSceneStore.getState().addSphere();
      
      useSceneStore.getState().updateObject(id, { name: 'Custom Name' });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.name).toBe('Custom Name');
    });

    it('updates visibility', () => {
      const id = useSceneStore.getState().addSphere();
      
      useSceneStore.getState().updateObject(id, { visible: false });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.visible).toBe(false);
    });
  });

  describe('updateTransform', () => {
    it('updates object position', () => {
      const id = useSceneStore.getState().addSphere();
      
      useSceneStore.getState().updateTransform(id, { position: [1, 2, 3] });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.transform.position).toEqual([1, 2, 3]);
    });

    it('updates object rotation', () => {
      const id = useSceneStore.getState().addSphere();
      
      useSceneStore.getState().updateTransform(id, { rotation: [0.1, 0.2, 0.3] });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.transform.rotation).toEqual([0.1, 0.2, 0.3]);
    });

    it('updates object scale', () => {
      const id = useSceneStore.getState().addSphere();
      
      useSceneStore.getState().updateTransform(id, { scale: [2, 2, 2] });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.transform.scale).toEqual([2, 2, 2]);
    });

    it('preserves other transform properties', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().updateTransform(id, { position: [1, 2, 3] });
      
      useSceneStore.getState().updateTransform(id, { rotation: [0.1, 0.2, 0.3] });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.transform.position).toEqual([1, 2, 3]); // Still preserved
    });
  });

  describe('updateMaterial', () => {
    it('updates object color', () => {
      const id = useSceneStore.getState().addSphere();
      
      useSceneStore.getState().updateMaterial(id, { color: [1, 0, 0] });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.material.color).toEqual([1, 0, 0]);
    });

    it('updates ior', () => {
      const id = useSceneStore.getState().addSphere();
      
      useSceneStore.getState().updateMaterial(id, { ior: 1.8 });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.material.ior).toBe(1.8);
    });

    it('preserves other material properties', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().updateMaterial(id, { color: [1, 0, 0] });
      
      useSceneStore.getState().updateMaterial(id, { ior: 1.8 });
      
      const obj = useSceneStore.getState().getObject(id);
      expect(obj?.material.color).toEqual([1, 0, 0]); // Still preserved
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

  describe('history', () => {
    it('can undo addSphere', () => {
      useSceneStore.getState().addSphere();
      expect(useSceneStore.getState().objects.length).toBe(1);
      (useSceneStore.getState() as any).undo();
      expect(useSceneStore.getState().objects.length).toBe(0);
    });

    it('can undo removeObject', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().removeObject(id);
      expect(useSceneStore.getState().objects.length).toBe(0);
      (useSceneStore.getState() as any).undo();
      expect(useSceneStore.getState().objects.length).toBe(1);
    });

    it('can undo transform changes', () => {
      const id = useSceneStore.getState().addSphere();
      useSceneStore.getState().updateTransform(id, { position: [5, 0, 0] });
      (useSceneStore.getState() as any).undo();
      expect(useSceneStore.getState().getObject(id)?.transform.position[0]).toBe(0);
    });
  });
});

