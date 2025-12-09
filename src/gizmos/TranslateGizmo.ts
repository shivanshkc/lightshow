import { Vec3, Ray, add, sub, dot, mul, normalize } from '../core/math';
import { GizmoAxis } from '../store/gizmoStore';

/**
 * Translation gizmo drag logic
 * Uses ray-plane intersection for accurate straight-line movement
 * regardless of perspective foreshortening.
 */
export class TranslateGizmo {
  /**
   * Calculate new position using ray-plane intersection
   * For single-axis: intersect with plane containing the axis (perpendicular to best view)
   * For plane handles: intersect directly with that plane
   */
  static calculateDragPositionRayPlane(
    axis: GizmoAxis,
    startPosition: Vec3,
    startRay: Ray,
    currentRay: Ray,
    cameraForward: Vec3
  ): Vec3 {
    if (!axis) return startPosition;

    // Determine constraint plane based on axis
    const { planeNormal, planePoint } = this.getConstraintPlane(
      axis,
      startPosition,
      cameraForward
    );

    // Find intersection points on the plane
    const startHit = this.rayPlaneIntersect(startRay, planePoint, planeNormal);
    const currentHit = this.rayPlaneIntersect(
      currentRay,
      planePoint,
      planeNormal
    );

    if (!startHit || !currentHit) return startPosition;

    // Calculate movement delta on the plane
    let delta = sub(currentHit, startHit);

    // For single-axis constraints, project onto that axis
    if (axis === 'x' || axis === 'y' || axis === 'z') {
      const axisDir: Vec3 =
        axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];
      const projected = dot(delta, axisDir);
      delta = [
        axisDir[0] * projected,
        axisDir[1] * projected,
        axisDir[2] * projected,
      ];
    }

    return add(startPosition, delta);
  }

  /**
   * Get the constraint plane for a given axis
   * For single-axis: choose plane that's most perpendicular to view for best interaction
   * For plane handles: use that plane directly
   */
  private static getConstraintPlane(
    axis: GizmoAxis,
    objectPosition: Vec3,
    cameraForward: Vec3
  ): { planeNormal: Vec3; planePoint: Vec3 } {
    let planeNormal: Vec3;

    switch (axis) {
      case 'x': {
        // For X axis, choose plane based on which gives better interaction
        // Use plane whose normal is more perpendicular to view
        const dotY = Math.abs(cameraForward[1]);
        const dotZ = Math.abs(cameraForward[2]);
        // If looking more along Y, use XZ plane; if along Z, use XY plane
        planeNormal = dotY > dotZ ? [0, 1, 0] : [0, 0, 1];
        break;
      }
      case 'y': {
        // For Y axis
        const dotX = Math.abs(cameraForward[0]);
        const dotZ = Math.abs(cameraForward[2]);
        planeNormal = dotX > dotZ ? [1, 0, 0] : [0, 0, 1];
        break;
      }
      case 'z': {
        // For Z axis
        const dotX = Math.abs(cameraForward[0]);
        const dotY = Math.abs(cameraForward[1]);
        planeNormal = dotX > dotY ? [1, 0, 0] : [0, 1, 0];
        break;
      }
      case 'xy':
        planeNormal = [0, 0, 1]; // XY plane has Z normal
        break;
      case 'xz':
        planeNormal = [0, 1, 0]; // XZ plane has Y normal
        break;
      case 'yz':
        planeNormal = [1, 0, 0]; // YZ plane has X normal
        break;
      case 'xyz':
      default:
        // Free movement: use plane perpendicular to camera
        planeNormal = normalize([
          cameraForward[0],
          cameraForward[1],
          cameraForward[2],
        ]);
        break;
    }

    return { planeNormal, planePoint: objectPosition };
  }

  /**
   * Ray-plane intersection
   * Returns intersection point or null if parallel/behind
   */
  private static rayPlaneIntersect(
    ray: Ray,
    planePoint: Vec3,
    planeNormal: Vec3
  ): Vec3 | null {
    const denom = dot(ray.direction, planeNormal);
    if (Math.abs(denom) < 0.0001) return null; // Ray parallel to plane

    const t = dot(sub(planePoint, ray.origin), planeNormal) / denom;
    if (t < 0) return null; // Plane behind ray

    return add(ray.origin, mul(ray.direction, t));
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
