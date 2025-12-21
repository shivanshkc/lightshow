import { describe, it, expect } from 'vitest';
import { GizmoRaycaster } from '../gizmos/GizmoRaycaster';
import type { Ray, Vec3 } from '@core';

describe('GizmoRaycaster.pick (pickTolerance)', () => {
  it('translate: misses without tolerance and hits with tolerance', () => {
    const ray: Ray = {
      origin: [0.5, 0.16, 2],
      direction: [0, 0, -1],
    };

    const gizmoPos: Vec3 = [0, 0, 0];
    const scale = 1;

    // arrowRadius = 0.1 * scale => 0.1. y-offset is 0.16 => miss.
    expect(GizmoRaycaster.pick(ray, gizmoPos, scale, 'translate')).toBeNull();

    // With +0.07 tolerance, effective radius is 0.17 => hit.
    expect(GizmoRaycaster.pick(ray, gizmoPos, scale, 'translate', 0.07)).toBe('x');
  });

  it('rotate: misses without tolerance and hits with tolerance', () => {
    const ray: Ray = {
      origin: [1.26, 0, 2],
      direction: [0, 0, -1],
    };

    const gizmoPos: Vec3 = [0, 0, 0];
    const scale = 1;

    // Trackball radius is 1.15 and uses tubeRadius*2 where tubeRadius=0.05 => 0.10.
    // distFromCenter=1.26 => ringDist=0.11, miss (and all axis rings also miss at this distance).
    expect(GizmoRaycaster.pick(ray, gizmoPos, scale, 'rotate')).toBeNull();

    // With +0.02 tolerance, trackball tubeRadius becomes 0.07, threshold becomes 0.14 => hit trackball ('xyz').
    expect(GizmoRaycaster.pick(ray, gizmoPos, scale, 'rotate', 0.02)).toBe('xyz');
  });

  it('scale: misses without tolerance and hits with tolerance', () => {
    const ray: Ray = {
      origin: [0.08, 0.06, 2],
      direction: [0, 0, -1],
    };

    const gizmoPos: Vec3 = [0, 0, 0];
    const scale = 1;

    // centerCubeSize = 0.15 => half=0.075. x=0.08 is just outside while y is inside => miss.
    expect(GizmoRaycaster.pick(ray, gizmoPos, scale, 'scale')).toBeNull();

    // With +0.01 tolerance, cubeSize grows by 2*tol => half grows by tol => half=0.085 => hit.
    expect(GizmoRaycaster.pick(ray, gizmoPos, scale, 'scale', 0.01)).toBe('xyz');
  });
});


