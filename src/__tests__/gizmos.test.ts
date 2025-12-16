import { describe, it, expect } from 'vitest';
import { RotateGizmo } from '../gizmos/RotateGizmo';
import { ScaleGizmo } from '../gizmos/ScaleGizmo';
import { Vec3 } from '../core/math';

describe('RotateGizmo', () => {
  const objectCenter: Vec3 = [0, 0, 0];
  const cameraPosition: Vec3 = [0, 0, 5];

  describe('calculateRotation', () => {
    it('X rotation only affects X component', () => {
      const [rx, ry, rz] = RotateGizmo.calculateRotation(
        'x',
        objectCenter,
        [0, 0],
        [0, 100],
        cameraPosition
      );
      expect(rx).not.toBe(0);
      expect(ry).toBe(0);
      expect(rz).toBe(0);
    });

    it('Y rotation only affects Y component', () => {
      const [rx, ry, rz] = RotateGizmo.calculateRotation(
        'y',
        objectCenter,
        [0, 0],
        [100, 0],
        cameraPosition
      );
      expect(rx).toBe(0);
      expect(ry).not.toBe(0);
      expect(rz).toBe(0);
    });

    it('Z rotation only affects Z component', () => {
      const [rx, ry, rz] = RotateGizmo.calculateRotation(
        'z',
        objectCenter,
        [0, 0],
        [100, 0],
        cameraPosition
      );
      expect(rx).toBe(0);
      expect(ry).toBe(0);
      expect(rz).not.toBe(0);
    });

    it('trackball affects X and Y components', () => {
      const [rx, ry, rz] = RotateGizmo.calculateRotation(
        'trackball',
        objectCenter,
        [0, 0],
        [50, 50],
        cameraPosition
      );
      expect(rx).not.toBe(0);
      expect(ry).not.toBe(0);
      expect(rz).toBe(0);
    });
  });

  describe('snapAngle', () => {
    it('snaps to 15 degree increments', () => {
      const angle17deg = (17 * Math.PI) / 180;
      const snapped = RotateGizmo.snapAngle(angle17deg, 15);
      const expected = (15 * Math.PI) / 180;
      expect(snapped).toBeCloseTo(expected, 5);
    });

    it('snaps 22 degrees to 15', () => {
      const angle22deg = (22 * Math.PI) / 180;
      const snapped = RotateGizmo.snapAngle(angle22deg, 15);
      const expected = (15 * Math.PI) / 180;
      expect(snapped).toBeCloseTo(expected, 5);
    });

    it('snaps 23 degrees to 30', () => {
      const angle23deg = (23 * Math.PI) / 180;
      const snapped = RotateGizmo.snapAngle(angle23deg, 15);
      const expected = (30 * Math.PI) / 180;
      expect(snapped).toBeCloseTo(expected, 5);
    });
  });

  describe('addRotation', () => {
    it('adds rotation deltas', () => {
      const current: [number, number, number] = [0.1, 0.2, 0.3];
      const delta: [number, number, number] = [0.05, 0.1, 0.15];
      const result = RotateGizmo.addRotation(current, delta);
      expect(result[0]).toBeCloseTo(0.15, 5);
      expect(result[1]).toBeCloseTo(0.3, 5);
      expect(result[2]).toBeCloseTo(0.45, 5);
    });
  });

  describe('toDegrees/toRadians', () => {
    it('converts radians to degrees', () => {
      expect(RotateGizmo.toDegrees(Math.PI)).toBeCloseTo(180, 5);
      expect(RotateGizmo.toDegrees(Math.PI / 2)).toBeCloseTo(90, 5);
    });

    it('converts degrees to radians', () => {
      expect(RotateGizmo.toRadians(180)).toBeCloseTo(Math.PI, 5);
      expect(RotateGizmo.toRadians(90)).toBeCloseTo(Math.PI / 2, 5);
    });
  });
});

describe('ScaleGizmo', () => {
  const startScale: Vec3 = [1, 1, 1];

  describe('calculateScale', () => {
    it('uniform scale affects all axes equally', () => {
      const result = ScaleGizmo.calculateScale(
        'uniform',
        startScale,
        [0, 0],
        [100, -100], // Moving right and up increases scale
        'cuboid'
      );
      expect(result[0]).toBeGreaterThan(1);
      expect(result[1]).toBeGreaterThan(1);
      expect(result[2]).toBeGreaterThan(1);
      expect(result[0]).toBe(result[1]);
      expect(result[1]).toBe(result[2]);
    });

    it('X scale only affects X for cuboid', () => {
      const result = ScaleGizmo.calculateScale(
        'x',
        startScale,
        [0, 0],
        [50, 0],
        'cuboid'
      );
      expect(result[0]).not.toBe(1);
      expect(result[1]).toBe(1);
      expect(result[2]).toBe(1);
    });

    it('Y scale only affects Y for cuboid', () => {
      const result = ScaleGizmo.calculateScale(
        'y',
        startScale,
        [0, 0],
        [50, 0],
        'cuboid'
      );
      expect(result[0]).toBe(1);
      expect(result[1]).not.toBe(1);
      expect(result[2]).toBe(1);
    });

    it('Z scale only affects Z for cuboid', () => {
      const result = ScaleGizmo.calculateScale(
        'z',
        startScale,
        [0, 0],
        [50, 0],
        'cuboid'
      );
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(1);
      expect(result[2]).not.toBe(1);
    });

    it('sphere always scales uniformly regardless of axis', () => {
      const result = ScaleGizmo.calculateScale(
        'x',
        startScale,
        [0, 0],
        [50, 0],
        'sphere'
      );
      expect(result[0]).toBe(result[1]);
      expect(result[1]).toBe(result[2]);
    });

    it('enforces minimum scale of 0.1', () => {
      const result = ScaleGizmo.calculateScale(
        'x',
        startScale,
        [0, 0],
        [-1000, 1000], // Large negative movement
        'cuboid'
      );
      expect(result[0]).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('snapScale', () => {
    it('snaps to 0.25 increments by default', () => {
      const scale: Vec3 = [1.3, 0.6, 2.1];
      const result = ScaleGizmo.snapScale(scale);
      expect(result[0]).toBe(1.25);
      expect(result[1]).toBe(0.5);
      expect(result[2]).toBe(2.0);
    });

    it('enforces minimum scale when snapping', () => {
      const scale: Vec3 = [0.05, 1, 1];
      const result = ScaleGizmo.snapScale(scale);
      expect(result[0]).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('MIN_SCALE', () => {
    it('returns 0.1', () => {
      expect(ScaleGizmo.MIN_SCALE).toBe(0.1);
    });
  });
});

