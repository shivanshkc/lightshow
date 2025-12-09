import { Vec3, normalize, sub, dot } from '../core/math';

/**
 * Rotation gizmo drag logic
 * Calculates rotation angles from mouse drag
 */
export class RotateGizmo {
  /**
   * Calculate rotation delta from drag
   * Returns Euler angles delta [x, y, z] in radians
   */
  static calculateRotation(
    axis: 'x' | 'y' | 'z' | 'trackball',
    objectCenter: Vec3,
    startMousePos: [number, number],
    currentMousePos: [number, number],
    cameraPosition: Vec3,
    sensitivity: number = 0.01
  ): [number, number, number] {
    const dx = currentMousePos[0] - startMousePos[0];
    const dy = currentMousePos[1] - startMousePos[1];

    if (axis === 'trackball') {
      // Trackball rotation uses screen-space delta directly
      // Y screen movement = pitch (X rotation)
      // X screen movement = yaw (Y rotation)
      return [-dy * sensitivity, dx * sensitivity, 0];
    }

    // Single axis rotation
    // Calculate angle based on combined screen movement
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = distance * sensitivity;

    // Determine rotation direction based on camera position relative to object
    const toCamera = normalize(sub(cameraPosition, objectCenter));
    const axisVec: Vec3 =
      axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];

    // If camera is behind the axis (negative dot product), reverse rotation
    if (dot(toCamera, axisVec) < 0) {
      angle = -angle;
    }

    // Adjust angle based on mouse direction
    // This provides more intuitive rotation control
    const mouseAngle = Math.atan2(dy, dx);

    // Different axes respond to different screen directions
    if (axis === 'x') {
      // X rotation: vertical drag is primary
      angle *= Math.sign(dy) || Math.sign(-dx);
    } else if (axis === 'y') {
      // Y rotation: horizontal drag is primary
      angle *= Math.sign(dx) || Math.sign(dy);
    } else {
      // Z rotation: circular motion around center
      angle *= Math.cos(mouseAngle - Math.PI / 4);
    }

    return axis === 'x'
      ? [angle, 0, 0]
      : axis === 'y'
        ? [0, angle, 0]
        : [0, 0, angle];
  }

  /**
   * Add rotation delta to existing Euler angles
   */
  static addRotation(
    current: [number, number, number],
    delta: [number, number, number]
  ): [number, number, number] {
    return [current[0] + delta[0], current[1] + delta[1], current[2] + delta[2]];
  }

  /**
   * Snap angle to increments (e.g., 15 degrees)
   */
  static snapAngle(angle: number, incrementDegrees: number = 15): number {
    const incrementRadians = (incrementDegrees * Math.PI) / 180;
    return Math.round(angle / incrementRadians) * incrementRadians;
  }

  /**
   * Convert radians to degrees for display
   */
  static toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  /**
   * Convert degrees to radians
   */
  static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

