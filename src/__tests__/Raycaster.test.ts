import { describe, it, expect } from 'vitest';
import { Raycaster, raycaster } from '../core/Raycaster';
import { SceneObject, createDefaultSphere, createDefaultCuboid } from '../core/types';

describe('Raycaster', () => {
  describe('singleton', () => {
    it('exports a raycaster instance', () => {
      expect(raycaster).toBeDefined();
      expect(raycaster).toBeInstanceOf(Raycaster);
    });
  });

  describe('pickWithRay', () => {
    it('returns no hit for empty scene', () => {
      const ray = {
        origin: [0, 0, 5] as [number, number, number],
        direction: [0, 0, -1] as [number, number, number],
      };

      const result = raycaster.pickWithRay(ray, []);

      expect(result.objectId).toBeNull();
      expect(result.point).toBeNull();
      expect(result.distance).toBe(Infinity);
    });

    it('hits a sphere at origin', () => {
      const sphere: SceneObject = {
        id: 'sphere-1',
        ...createDefaultSphere(),
        name: 'Test Sphere',
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };

      const ray = {
        origin: [0, 0, 5] as [number, number, number],
        direction: [0, 0, -1] as [number, number, number],
      };

      const result = raycaster.pickWithRay(ray, [sphere]);

      expect(result.objectId).toBe('sphere-1');
      expect(result.point).not.toBeNull();
      expect(result.distance).toBeCloseTo(4, 1); // Hit at z=1 (radius 1)
    });

    it('hits a cuboid at origin', () => {
      const cuboid: SceneObject = {
        id: 'cuboid-1',
        ...createDefaultCuboid(),
        name: 'Test Cuboid',
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };

      const ray = {
        origin: [0, 0, 5] as [number, number, number],
        direction: [0, 0, -1] as [number, number, number],
      };

      const result = raycaster.pickWithRay(ray, [cuboid]);

      expect(result.objectId).toBe('cuboid-1');
      expect(result.point).not.toBeNull();
      expect(result.distance).toBeCloseTo(4, 1); // Hit at z=1 (half-extent 1)
    });

    it('misses objects not in ray path', () => {
      const sphere: SceneObject = {
        id: 'sphere-1',
        ...createDefaultSphere(),
        name: 'Test Sphere',
        transform: {
          position: [10, 0, 0], // Far to the right
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };

      const ray = {
        origin: [0, 0, 5] as [number, number, number],
        direction: [0, 0, -1] as [number, number, number],
      };

      const result = raycaster.pickWithRay(ray, [sphere]);

      expect(result.objectId).toBeNull();
    });

    it('picks the closest object', () => {
      const nearSphere: SceneObject = {
        id: 'near',
        ...createDefaultSphere(),
        name: 'Near Sphere',
        transform: {
          position: [0, 0, 2],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };

      const farSphere: SceneObject = {
        id: 'far',
        ...createDefaultSphere(),
        name: 'Far Sphere',
        transform: {
          position: [0, 0, -2],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };

      const ray = {
        origin: [0, 0, 5] as [number, number, number],
        direction: [0, 0, -1] as [number, number, number],
      };

      const result = raycaster.pickWithRay(ray, [nearSphere, farSphere]);

      expect(result.objectId).toBe('near');
    });

    it('ignores invisible objects', () => {
      const sphere: SceneObject = {
        id: 'sphere-1',
        ...createDefaultSphere(),
        name: 'Test Sphere',
        visible: false, // Hidden!
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };

      const ray = {
        origin: [0, 0, 5] as [number, number, number],
        direction: [0, 0, -1] as [number, number, number],
      };

      const result = raycaster.pickWithRay(ray, [sphere]);

      expect(result.objectId).toBeNull();
    });

    it('works with scaled objects', () => {
      const sphere: SceneObject = {
        id: 'sphere-1',
        ...createDefaultSphere(),
        name: 'Test Sphere',
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [2, 2, 2], // Radius 2
        },
      };

      const ray = {
        origin: [0, 0, 5] as [number, number, number],
        direction: [0, 0, -1] as [number, number, number],
      };

      const result = raycaster.pickWithRay(ray, [sphere]);

      expect(result.objectId).toBe('sphere-1');
      expect(result.distance).toBeCloseTo(3, 1); // Hit at z=2 (radius 2)
    });

    it('works with positioned objects', () => {
      const sphere: SceneObject = {
        id: 'sphere-1',
        ...createDefaultSphere(),
        name: 'Test Sphere',
        transform: {
          position: [3, 0, 0], // Offset to the right
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };

      const ray = {
        origin: [3, 0, 5] as [number, number, number], // Aiming at the sphere
        direction: [0, 0, -1] as [number, number, number],
      };

      const result = raycaster.pickWithRay(ray, [sphere]);

      expect(result.objectId).toBe('sphere-1');
    });
  });
});

