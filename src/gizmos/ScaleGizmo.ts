import { Vec3 } from '../core/math';

/**
 * Scale gizmo drag logic
 * Calculates scale factors from mouse drag
 */
export class ScaleGizmo {
  /**
   * Calculate new scale from drag
   * Moving right/up = increase, left/down = decrease
   */
  static calculateScale(
    axis: 'x' | 'y' | 'z' | 'uniform',
    startScale: Vec3,
    startMousePos: [number, number],
    currentMousePos: [number, number],
    objectType: 'sphere' | 'cuboid',
    sensitivity: number = 0.01
  ): Vec3 {
    const dx = currentMousePos[0] - startMousePos[0];
    const dy = currentMousePos[1] - startMousePos[1];

    // Scale factor based on combined mouse movement
    // Diagonal movement (right+up or left+down) has strongest effect
    const delta = (dx - dy) * sensitivity;
    const scaleFactor = Math.max(0.1, 1 + delta);

    // Spheres always scale uniformly
    if (axis === 'uniform' || objectType === 'sphere') {
      return [
        startScale[0] * scaleFactor,
        startScale[1] * scaleFactor,
        startScale[2] * scaleFactor,
      ];
    }

    // Single axis scale for cuboids
    const result: Vec3 = [startScale[0], startScale[1], startScale[2]];

    switch (axis) {
      case 'x':
        result[0] = Math.max(0.1, startScale[0] * scaleFactor);
        break;
      case 'y':
        result[1] = Math.max(0.1, startScale[1] * scaleFactor);
        break;
      case 'z':
        result[2] = Math.max(0.1, startScale[2] * scaleFactor);
        break;
    }

    return result;
  }

  /**
   * Snap scale to increments (e.g., 0.25 units)
   */
  static snapScale(scale: Vec3, increment: number = 0.25): Vec3 {
    return [
      Math.max(0.1, Math.round(scale[0] / increment) * increment),
      Math.max(0.1, Math.round(scale[1] / increment) * increment),
      Math.max(0.1, Math.round(scale[2] / increment) * increment),
    ];
  }

  /**
   * Get minimum scale value
   */
  static get MIN_SCALE(): number {
    return 0.1;
  }
}

