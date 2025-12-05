import { describe, it, expect } from 'vitest';
import {
  createDefaultMaterial,
  createDefaultTransform,
  createDefaultSphere,
  createDefaultCuboid,
  cloneTransform,
  cloneMaterial,
  cloneSceneObject,
  type SceneObject,
} from '../core/types';

describe('Scene Types', () => {
  describe('createDefaultMaterial', () => {
    it('returns valid material with roughness in range', () => {
      const mat = createDefaultMaterial();
      expect(mat.roughness).toBeGreaterThanOrEqual(0);
      expect(mat.roughness).toBeLessThanOrEqual(1);
    });

    it('returns material with 3-component color', () => {
      const mat = createDefaultMaterial();
      expect(mat.color.length).toBe(3);
      expect(mat.color.every(c => c >= 0 && c <= 1)).toBe(true);
    });

    it('returns material with valid emission color', () => {
      const mat = createDefaultMaterial();
      expect(mat.emissionColor.length).toBe(3);
    });

    it('returns material with non-negative emission', () => {
      const mat = createDefaultMaterial();
      expect(mat.emission).toBeGreaterThanOrEqual(0);
    });

    it('returns opaque material by default', () => {
      const mat = createDefaultMaterial();
      expect(mat.transparency).toBe(0);
    });
  });

  describe('createDefaultTransform', () => {
    it('returns transform at origin', () => {
      const t = createDefaultTransform();
      expect(t.position).toEqual([0, 0, 0]);
    });

    it('returns transform with zero rotation', () => {
      const t = createDefaultTransform();
      expect(t.rotation).toEqual([0, 0, 0]);
    });

    it('returns transform with unit scale', () => {
      const t = createDefaultTransform();
      expect(t.scale).toEqual([1, 1, 1]);
    });
  });

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
  });

  describe('Clone functions', () => {
    it('cloneTransform creates independent copy', () => {
      const original = createDefaultTransform();
      const clone = cloneTransform(original);
      
      clone.position[0] = 100;
      expect(original.position[0]).toBe(0);
    });

    it('cloneMaterial creates independent copy', () => {
      const original = createDefaultMaterial();
      const clone = cloneMaterial(original);
      
      clone.color[0] = 0.5;
      expect(original.color[0]).toBe(0.8);
    });

    it('cloneSceneObject creates independent copy', () => {
      const original: SceneObject = {
        id: 'test-id',
        ...createDefaultSphere(),
      };
      const clone = cloneSceneObject(original);
      
      clone.transform.position[0] = 100;
      clone.material.color[0] = 0.5;
      
      expect(original.transform.position[0]).toBe(0);
      expect(original.material.color[0]).toBe(0.8);
    });
  });
});

