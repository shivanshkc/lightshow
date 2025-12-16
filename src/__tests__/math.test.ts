import { describe, it, expect } from 'vitest';
import {
  vec3,
  add,
  sub,
  mul,
  dot,
  cross,
  length,
  normalize,
  negate,
  mat4Identity,
  mat4Perspective,
  mat4LookAt,
  mat4Inverse,
  mat4Multiply,
  intersectRaySphere,
  intersectRayBox,
  mat3FromRotation,
  mat3Transpose,
  mat3MultiplyVec3,
  type Vec3,
  type Ray,
} from '../core/math';

describe('Vector Operations', () => {
  describe('vec3', () => {
    it('creates a vector', () => {
      const v = vec3(1, 2, 3);
      expect(v).toEqual([1, 2, 3]);
    });
  });

  describe('add', () => {
    it('adds two vectors', () => {
      expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
    });
  });

  describe('sub', () => {
    it('subtracts two vectors', () => {
      expect(sub([5, 7, 9], [4, 5, 6])).toEqual([1, 2, 3]);
    });
  });

  describe('mul', () => {
    it('multiplies vector by scalar', () => {
      expect(mul([1, 2, 3], 2)).toEqual([2, 4, 6]);
    });
  });

  describe('dot', () => {
    it('computes dot product', () => {
      expect(dot([1, 0, 0], [0, 1, 0])).toBe(0);
      expect(dot([1, 0, 0], [1, 0, 0])).toBe(1);
      expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
    });
  });

  describe('cross', () => {
    it('computes cross product', () => {
      expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
      expect(cross([0, 1, 0], [1, 0, 0])).toEqual([0, 0, -1]);
    });
  });

  describe('length', () => {
    it('computes vector length', () => {
      expect(length([3, 4, 0])).toBe(5);
      expect(length([1, 0, 0])).toBe(1);
    });
  });

  describe('normalize', () => {
    it('normalizes vectors correctly', () => {
      expect(length(normalize([3, 4, 0]))).toBeCloseTo(1);
      expect(length(normalize([1, 2, 3]))).toBeCloseTo(1);
    });

    it('returns zero vector for zero input', () => {
      expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
    });
  });

  describe('negate', () => {
    it('negates a vector', () => {
      expect(negate([1, -2, 3])).toEqual([-1, 2, -3]);
    });
  });
});

describe('Matrix Operations', () => {
  describe('mat4Identity', () => {
    it('creates identity matrix', () => {
      const m = mat4Identity();
      expect(m[0]).toBe(1);
      expect(m[5]).toBe(1);
      expect(m[10]).toBe(1);
      expect(m[15]).toBe(1);
      expect(m[1]).toBe(0);
      expect(m[4]).toBe(0);
    });

    it('has correct length', () => {
      const m = mat4Identity();
      expect(m.length).toBe(16);
    });
  });

  describe('mat4Perspective', () => {
    it('creates perspective matrix', () => {
      const m = mat4Perspective(Math.PI / 3, 16 / 9, 0.1, 1000);
      expect(m.length).toBe(16);
      expect(m[0]).not.toBe(0);
      expect(m[5]).not.toBe(0);
    });
  });

  describe('mat4LookAt', () => {
    it('creates view matrix', () => {
      const eye: Vec3 = [0, 0, 5];
      const target: Vec3 = [0, 0, 0];
      const up: Vec3 = [0, 1, 0];
      const m = mat4LookAt(eye, target, up);
      expect(m.length).toBe(16);
    });

    it('produces correct view direction', () => {
      const eye: Vec3 = [0, 2, 5];
      const target: Vec3 = [0, 0, 0];
      const up: Vec3 = [0, 1, 0];
      const m = mat4LookAt(eye, target, up);
      // Translation should be in last column
      expect(m[15]).toBe(1);
    });
  });

  describe('mat4Multiply', () => {
    it('multiplies identity correctly', () => {
      const identity = mat4Identity();
      const result = mat4Multiply(identity, identity);
      expect(result[0]).toBe(1);
      expect(result[5]).toBe(1);
      expect(result[10]).toBe(1);
      expect(result[15]).toBe(1);
    });
  });

  describe('mat4Inverse', () => {
    it('inverts identity to identity', () => {
      const identity = mat4Identity();
      const inv = mat4Inverse(identity);
      expect(inv[0]).toBeCloseTo(1);
      expect(inv[5]).toBeCloseTo(1);
      expect(inv[10]).toBeCloseTo(1);
      expect(inv[15]).toBeCloseTo(1);
    });

    it('inverse multiplied by original gives identity', () => {
      const m = mat4LookAt([0, 2, 5], [0, 0, 0], [0, 1, 0]);
      const inv = mat4Inverse(m);
      const result = mat4Multiply(m, inv);
      
      // Should be close to identity
      expect(result[0]).toBeCloseTo(1, 4);
      expect(result[5]).toBeCloseTo(1, 4);
      expect(result[10]).toBeCloseTo(1, 4);
      expect(result[15]).toBeCloseTo(1, 4);
    });
  });
});

describe('Mat3 Operations', () => {
  describe('mat3FromRotation', () => {
    it('creates identity for zero rotation', () => {
      const m = mat3FromRotation([0, 0, 0]);
      expect(m[0]).toBeCloseTo(1);
      expect(m[4]).toBeCloseTo(1);
      expect(m[8]).toBeCloseTo(1);
    });
  });

  describe('mat3Transpose', () => {
    it('transposes a matrix', () => {
      const m = mat3FromRotation([0.5, 0.3, 0.1]);
      const t = mat3Transpose(m);
      expect(t[1]).toBeCloseTo(m[3]);
      expect(t[3]).toBeCloseTo(m[1]);
    });
  });

  describe('mat3MultiplyVec3', () => {
    it('multiplies identity by vector', () => {
      const identity = mat3FromRotation([0, 0, 0]);
      const v: Vec3 = [1, 2, 3];
      const result = mat3MultiplyVec3(identity, v);
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(2);
      expect(result[2]).toBeCloseTo(3);
    });
  });
});

describe('Ray Intersections', () => {
  describe('intersectRaySphere', () => {
    it('hits sphere in front of ray', () => {
      const ray: Ray = {
        origin: [0, 0, 5],
        direction: [0, 0, -1],
      };
      const result = intersectRaySphere(ray, [0, 0, 0], 1);
      expect(result.hit).toBe(true);
      expect(result.t).toBeCloseTo(4);
    });

    it('misses sphere not in path', () => {
      const ray: Ray = {
        origin: [0, 0, 5],
        direction: [0, 0, -1],
      };
      const result = intersectRaySphere(ray, [10, 0, 0], 1);
      expect(result.hit).toBe(false);
    });

    it('misses sphere behind ray', () => {
      const ray: Ray = {
        origin: [0, 0, 5],
        direction: [0, 0, 1], // pointing away
      };
      const result = intersectRaySphere(ray, [0, 0, 0], 1);
      expect(result.hit).toBe(false);
    });

    it('handles larger radius', () => {
      const ray: Ray = {
        origin: [0, 0, 5],
        direction: [0, 0, -1],
      };
      const result = intersectRaySphere(ray, [0, 0, 0], 2);
      expect(result.hit).toBe(true);
      expect(result.t).toBeCloseTo(3);
    });
  });

  describe('intersectRayBox', () => {
    it('hits box in front of ray', () => {
      const ray: Ray = {
        origin: [0, 0, 5],
        direction: [0, 0, -1],
      };
      const result = intersectRayBox(ray, [0, 0, 0], [1, 1, 1]);
      expect(result.hit).toBe(true);
      expect(result.t).toBeCloseTo(4);
    });

    it('misses box not in path', () => {
      const ray: Ray = {
        origin: [0, 0, 5],
        direction: [0, 0, -1],
      };
      const result = intersectRayBox(ray, [10, 0, 0], [1, 1, 1]);
      expect(result.hit).toBe(false);
    });

    it('misses box behind ray', () => {
      const ray: Ray = {
        origin: [0, 0, 5],
        direction: [0, 0, 1], // pointing away
      };
      const result = intersectRayBox(ray, [0, 0, 0], [1, 1, 1]);
      expect(result.hit).toBe(false);
    });

    it('handles different half-extents', () => {
      const ray: Ray = {
        origin: [0, 0, 5],
        direction: [0, 0, -1],
      };
      const result = intersectRayBox(ray, [0, 0, 0], [0.5, 0.5, 0.5]);
      expect(result.hit).toBe(true);
      expect(result.t).toBeCloseTo(4.5);
    });
  });
});

