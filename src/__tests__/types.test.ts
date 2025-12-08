import { describe, it, expect } from 'vitest';
import {
  createDefaultTransform,
  createDefaultMaterial,
  createDefaultSphere,
  createDefaultCuboid,
  type Transform,
  type Material,
  type SceneObject,
  type PrimitiveType,
} from '../core/types';

describe('Transform', () => {
  describe('createDefaultTransform', () => {
    it('returns valid transform', () => {
      const transform = createDefaultTransform();
      
      expect(transform.position).toEqual([0, 0, 0]);
      expect(transform.rotation).toEqual([0, 0, 0]);
      expect(transform.scale).toEqual([1, 1, 1]);
    });

    it('position has 3 components', () => {
      const transform = createDefaultTransform();
      expect(transform.position.length).toBe(3);
    });

    it('rotation has 3 components', () => {
      const transform = createDefaultTransform();
      expect(transform.rotation.length).toBe(3);
    });

    it('scale has 3 components', () => {
      const transform = createDefaultTransform();
      expect(transform.scale.length).toBe(3);
    });
  });
});

describe('Material', () => {
  describe('createDefaultMaterial', () => {
    it('returns valid material', () => {
      const mat = createDefaultMaterial();
      
      expect(mat.color.length).toBe(3);
      expect(mat.emissionColor.length).toBe(3);
    });

    it('roughness is in valid range [0, 1]', () => {
      const mat = createDefaultMaterial();
      
      expect(mat.roughness).toBeGreaterThanOrEqual(0);
      expect(mat.roughness).toBeLessThanOrEqual(1);
    });

    it('metallic is in valid range [0, 1]', () => {
      const mat = createDefaultMaterial();
      
      expect(mat.metallic).toBeGreaterThanOrEqual(0);
      expect(mat.metallic).toBeLessThanOrEqual(1);
    });

    it('transparency is in valid range [0, 1]', () => {
      const mat = createDefaultMaterial();
      
      expect(mat.transparency).toBeGreaterThanOrEqual(0);
      expect(mat.transparency).toBeLessThanOrEqual(1);
    });

    it('emission is non-negative', () => {
      const mat = createDefaultMaterial();
      expect(mat.emission).toBeGreaterThanOrEqual(0);
    });

    it('ior is positive', () => {
      const mat = createDefaultMaterial();
      expect(mat.ior).toBeGreaterThan(0);
    });

    it('color components are in valid range [0, 1]', () => {
      const mat = createDefaultMaterial();
      
      for (const c of mat.color) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    });
  });
});

describe('SceneObject', () => {
  describe('createDefaultSphere', () => {
    it('has type sphere', () => {
      const sphere = createDefaultSphere();
      expect(sphere.type).toBe('sphere');
    });

    it('has default name', () => {
      const sphere = createDefaultSphere();
      expect(sphere.name).toBe('Sphere');
    });

    it('is visible by default', () => {
      const sphere = createDefaultSphere();
      expect(sphere.visible).toBe(true);
    });

    it('has transform', () => {
      const sphere = createDefaultSphere();
      expect(sphere.transform).toBeDefined();
      expect(sphere.transform.position).toBeDefined();
    });

    it('has material', () => {
      const sphere = createDefaultSphere();
      expect(sphere.material).toBeDefined();
      expect(sphere.material.color).toBeDefined();
    });
  });

  describe('createDefaultCuboid', () => {
    it('has type cuboid', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.type).toBe('cuboid');
    });

    it('has default name', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.name).toBe('Cuboid');
    });

    it('is visible by default', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.visible).toBe(true);
    });

    it('has transform', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.transform).toBeDefined();
    });

    it('has material', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.material).toBeDefined();
    });
  });
});

describe('Type Safety', () => {
  it('PrimitiveType is union of sphere and cuboid', () => {
    const sphere: PrimitiveType = 'sphere';
    const cuboid: PrimitiveType = 'cuboid';
    
    expect(sphere).toBe('sphere');
    expect(cuboid).toBe('cuboid');
  });

  it('SceneObject structure is correct', () => {
    const obj: SceneObject = {
      id: 'test-id',
      name: 'Test',
      type: 'sphere',
      transform: createDefaultTransform(),
      material: createDefaultMaterial(),
      visible: true,
    };
    
    expect(obj.id).toBe('test-id');
    expect(obj.type).toBe('sphere');
  });
});

