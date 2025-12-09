import { Vec3, add, sub, dot, normalize, cross } from '../core/math';
import { GizmoAxis } from '../store/gizmoStore';

/**
 * Translation gizmo drag logic
 * Handles converting screen-space mouse movement to world-space object translation
 */
export class TranslateGizmo {
  /**
   * Calculate new position during drag
   * Projects mouse movement onto the constrained axis/plane
   */
  static calculateDragPosition(
    axis: GizmoAxis,
    startPosition: Vec3,
    startMousePos: [number, number],
    currentMousePos: [number, number],
    cameraRight: Vec3,
    cameraUp: Vec3,
    screenScale: number
  ): Vec3 {
    if (!axis) return startPosition;

    // Calculate screen-space delta
    const deltaX = (currentMousePos[0] - startMousePos[0]) * screenScale;
    const deltaY = -(currentMousePos[1] - startMousePos[1]) * screenScale; // Flip Y

    let movement: Vec3 = [0, 0, 0];

    switch (axis) {
      case 'x': {
        // Project onto X axis
        const xDir: Vec3 = [1, 0, 0];
        const screenX = dot(xDir, cameraRight);
        const screenY = dot(xDir, cameraUp);
        const projected = deltaX * screenX + deltaY * screenY;
        movement = [projected, 0, 0];
        break;
      }
      case 'y': {
        // Project onto Y axis
        const yDir: Vec3 = [0, 1, 0];
        const screenX = dot(yDir, cameraRight);
        const screenY = dot(yDir, cameraUp);
        const projected = deltaX * screenX + deltaY * screenY;
        movement = [0, projected, 0];
        break;
      }
      case 'z': {
        // Project onto Z axis
        const zDir: Vec3 = [0, 0, 1];
        const screenX = dot(zDir, cameraRight);
        const screenY = dot(zDir, cameraUp);
        const projected = deltaX * screenX + deltaY * screenY;
        movement = [0, 0, projected];
        break;
      }
      case 'xy': {
        // Move in XY plane
        movement = [
          deltaX * cameraRight[0] + deltaY * cameraUp[0],
          deltaX * cameraRight[1] + deltaY * cameraUp[1],
          0,
        ];
        break;
      }
      case 'xz': {
        // Move in XZ plane
        // Project camera vectors onto XZ plane
        const rightXZ = normalize([cameraRight[0], 0, cameraRight[2]]);
        const upXZ = normalize([cameraUp[0], 0, cameraUp[2]]);
        movement = [
          deltaX * rightXZ[0] + deltaY * upXZ[0],
          0,
          deltaX * rightXZ[2] + deltaY * upXZ[2],
        ];
        break;
      }
      case 'yz': {
        // Move in YZ plane
        // Project camera vectors onto YZ plane
        const rightYZ = normalize([0, cameraRight[1], cameraRight[2]]);
        const upYZ = normalize([0, cameraUp[1], cameraUp[2]]);
        movement = [
          0,
          deltaX * rightYZ[1] + deltaY * upYZ[1],
          deltaX * rightYZ[2] + deltaY * upYZ[2],
        ];
        break;
      }
      case 'xyz': {
        // Free movement following camera plane
        movement = [
          deltaX * cameraRight[0] + deltaY * cameraUp[0],
          deltaX * cameraRight[1] + deltaY * cameraUp[1],
          deltaX * cameraRight[2] + deltaY * cameraUp[2],
        ];
        break;
      }
    }

    return add(startPosition, movement);
  }

  /**
   * Snap position to grid
   */
  static snapToGrid(position: Vec3, gridSize: number): Vec3 {
    return [
      Math.round(position[0] / gridSize) * gridSize,
      Math.round(position[1] / gridSize) * gridSize,
      Math.round(position[2] / gridSize) * gridSize,
    ];
  }

  /**
   * Apply precision modifier (slower movement when Shift is held)
   */
  static applyPrecision(
    movement: Vec3,
    isPrecision: boolean,
    factor: number = 0.1
  ): Vec3 {
    if (!isPrecision) return movement;
    return [movement[0] * factor, movement[1] * factor, movement[2] * factor];
  }
}

