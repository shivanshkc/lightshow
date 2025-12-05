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
  mat4Identity,
  mat4Perspective,
  mat4LookAt,
  mat4Inverse,
  mat4Multiply,
  type Vec3,
} from '../core/math';

describe('Vector3 operations', () => {
  it('creates vectors', () => {
    const v = vec3(1, 2, 3);
    expect(v).toEqual([1, 2, 3]);
  });

  it('adds vectors', () => {
    const a: Vec3 = [1, 2, 3];
    const b: Vec3 = [4, 5, 6];
    expect(add(a, b)).toEqual([5, 7, 9]);
  });

  it('subtracts vectors', () => {
    const a: Vec3 = [4, 5, 6];
    const b: Vec3 = [1, 2, 3];
    expect(sub(a, b)).toEqual([3, 3, 3]);
  });

  it('multiplies vector by scalar', () => {
    const v: Vec3 = [1, 2, 3];
    expect(mul(v, 2)).toEqual([2, 4, 6]);
  });

  it('computes dot product', () => {
    expect(dot([1, 0, 0], [0, 1, 0])).toBe(0);
    expect(dot([1, 0, 0], [1, 0, 0])).toBe(1);
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('computes cross product', () => {
    expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
    expect(cross([0, 1, 0], [1, 0, 0])).toEqual([0, 0, -1]);
  });

  it('computes vector length', () => {
    expect(length([3, 4, 0])).toBe(5);
    expect(length([1, 0, 0])).toBe(1);
  });

  it('normalizes vectors', () => {
    expect(length(normalize([3, 4, 0]))).toBeCloseTo(1);
    expect(length(normalize([1, 2, 3]))).toBeCloseTo(1);
  });

  it('handles zero vector normalization', () => {
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe('Matrix4x4 operations', () => {
  it('creates identity matrix', () => {
    const m = mat4Identity();
    expect(m.length).toBe(16);
    expect(m[0]).toBe(1);
    expect(m[5]).toBe(1);
    expect(m[10]).toBe(1);
    expect(m[15]).toBe(1);
    // Check off-diagonals are 0
    expect(m[1]).toBe(0);
    expect(m[4]).toBe(0);
  });

  it('creates perspective matrix', () => {
    const m = mat4Perspective(Math.PI / 3, 16 / 9, 0.1, 1000);
    expect(m.length).toBe(16);
    // Perspective matrix should have -1 at position [3][2] (index 11)
    expect(m[11]).toBe(-1);
  });

  it('creates lookAt matrix', () => {
    const eye: Vec3 = [0, 0, 5];
    const target: Vec3 = [0, 0, 0];
    const up: Vec3 = [0, 1, 0];
    const m = mat4LookAt(eye, target, up);
    expect(m.length).toBe(16);
  });

  it('inverts identity matrix', () => {
    const identity = mat4Identity();
    const inv = mat4Inverse(identity);
    // Inverse of identity is identity
    expect(inv[0]).toBeCloseTo(1);
    expect(inv[5]).toBeCloseTo(1);
    expect(inv[10]).toBeCloseTo(1);
    expect(inv[15]).toBeCloseTo(1);
  });

  it('multiplies matrices', () => {
    const a = mat4Identity();
    const b = mat4Identity();
    const result = mat4Multiply(a, b);
    // Identity * Identity = Identity
    expect(result[0]).toBeCloseTo(1);
    expect(result[5]).toBeCloseTo(1);
    expect(result[10]).toBeCloseTo(1);
    expect(result[15]).toBeCloseTo(1);
  });

  it('inverse * original ≈ identity', () => {
    const eye: Vec3 = [0, 2, 5];
    const target: Vec3 = [0, 0, 0];
    const up: Vec3 = [0, 1, 0];
    const view = mat4LookAt(eye, target, up);
    const invView = mat4Inverse(view);
    const result = mat4Multiply(view, invView);
    
    // Should be approximately identity
    expect(result[0]).toBeCloseTo(1, 4);
    expect(result[5]).toBeCloseTo(1, 4);
    expect(result[10]).toBeCloseTo(1, 4);
    expect(result[15]).toBeCloseTo(1, 4);
    expect(result[1]).toBeCloseTo(0, 4);
    expect(result[4]).toBeCloseTo(0, 4);
  });
});

