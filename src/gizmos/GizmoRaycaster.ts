import { Ray, Vec3, normalize, sub, dot, length } from '../core/math';
import { GizmoAxis } from '../store/gizmoStore';

/**
 * Gizmo raycasting for picking gizmo handles
 */
export class GizmoRaycaster {
  /**
   * Pick a gizmo axis from a ray
   * Returns the axis that was hit, or null if no hit
   */
  static pick(
    ray: Ray,
    gizmoPosition: Vec3,
    gizmoScale: number
  ): GizmoAxis {
    // Gizmo dimensions (scaled)
    const arrowLength = 1.25 * gizmoScale;
    const arrowRadius = 0.1 * gizmoScale;
    const planeSize = 0.3 * gizmoScale;
    const planeOffset = 0.35 * gizmoScale;

    let closestAxis: GizmoAxis = null;
    let closestDistance = Infinity;

    // Test axis arrows (as cylinders)
    const axes: Array<{ axis: GizmoAxis; dir: Vec3 }> = [
      { axis: 'x', dir: [1, 0, 0] },
      { axis: 'y', dir: [0, 1, 0] },
      { axis: 'z', dir: [0, 0, 1] },
    ];

    for (const { axis, dir } of axes) {
      const t = this.rayAxisDistance(ray, gizmoPosition, dir, arrowLength, arrowRadius);
      if (t !== null && t < closestDistance) {
        closestDistance = t;
        closestAxis = axis;
      }
    }

    // Test plane handles (as quads)
    const planes: Array<{
      axis: GizmoAxis;
      normal: Vec3;
      u: Vec3;
      v: Vec3;
    }> = [
      { axis: 'xy', normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
      { axis: 'xz', normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
      { axis: 'yz', normal: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
    ];

    for (const { axis, normal, u, v } of planes) {
      const t = this.rayPlaneDistance(
        ray,
        gizmoPosition,
        normal,
        u,
        v,
        planeOffset,
        planeSize
      );
      if (t !== null && t < closestDistance) {
        closestDistance = t;
        closestAxis = axis;
      }
    }

    return closestAxis;
  }

  /**
   * Test ray against an axis arrow (cylinder approximation)
   * Returns the distance to the hit, or null if no hit
   */
  private static rayAxisDistance(
    ray: Ray,
    gizmoPosition: Vec3,
    axisDir: Vec3,
    length: number,
    radius: number
  ): number | null {
    // Transform ray to gizmo local space
    const localOrigin: Vec3 = sub(ray.origin, gizmoPosition);

    // Distance from ray to axis line
    const rayDir = ray.direction;
    
    // For a line-to-line distance calculation
    // Axis goes from gizmoPosition to gizmoPosition + axisDir * length
    
    // Cross product to get perpendicular direction
    const crossDir = [
      rayDir[1] * axisDir[2] - rayDir[2] * axisDir[1],
      rayDir[2] * axisDir[0] - rayDir[0] * axisDir[2],
      rayDir[0] * axisDir[1] - rayDir[1] * axisDir[0],
    ] as Vec3;
    
    const crossLen = Math.sqrt(crossDir[0] ** 2 + crossDir[1] ** 2 + crossDir[2] ** 2);
    
    if (crossLen < 0.0001) {
      // Ray parallel to axis - check if within cylinder
      const dist = this.pointToLineDistance(localOrigin, [0, 0, 0], axisDir);
      if (dist < radius) {
        // Return approximate distance
        const t = -dot(localOrigin, rayDir);
        return t > 0 ? t : null;
      }
      return null;
    }
    
    // Calculate closest approach
    const normalizedCross = normalize(crossDir);
    const distance = Math.abs(dot(localOrigin, normalizedCross));
    
    if (distance > radius) {
      return null;
    }
    
    // Find where ray is closest to axis
    // Using parametric ray equation: P = O + t*D
    // and axis line: Q = A * s (where A is axis direction, s in [0, length])
    
    // Solve for t where ray is closest to axis
    const a = dot(rayDir, rayDir);
    const b = dot(rayDir, axisDir);
    const c = dot(axisDir, axisDir);
    const d = dot(rayDir, localOrigin);
    const e = dot(axisDir, localOrigin);
    
    const denom = a * c - b * b;
    if (Math.abs(denom) < 0.0001) return null;
    
    const t = (b * e - c * d) / denom;
    const s = (a * e - b * d) / denom;
    
    // Check if intersection is within arrow bounds
    if (t < 0 || s < 0 || s > length) {
      return null;
    }
    
    return t;
  }

  /**
   * Test ray against a plane quad
   */
  private static rayPlaneDistance(
    ray: Ray,
    gizmoPosition: Vec3,
    normal: Vec3,
    u: Vec3,
    v: Vec3,
    offset: number,
    size: number
  ): number | null {
    // Plane equation: dot(P - planePoint, normal) = 0
    // Ray: P = origin + t * direction
    // Solve for t: dot(origin + t * direction - planePoint, normal) = 0
    
    const denom = dot(ray.direction, normal);
    if (Math.abs(denom) < 0.0001) {
      return null; // Ray parallel to plane
    }
    
    // Plane point is at gizmo position (since plane contains origin in local space)
    const t = dot(sub(gizmoPosition, ray.origin), normal) / denom;
    
    if (t < 0) {
      return null; // Plane behind ray
    }
    
    // Calculate hit point in gizmo local space
    const hitWorld: Vec3 = [
      ray.origin[0] + t * ray.direction[0],
      ray.origin[1] + t * ray.direction[1],
      ray.origin[2] + t * ray.direction[2],
    ];
    
    const hitLocal = sub(hitWorld, gizmoPosition);
    
    // Project onto plane's U and V axes
    const uCoord = dot(hitLocal, u);
    const vCoord = dot(hitLocal, v);
    
    // Check if within quad bounds
    if (
      uCoord >= offset &&
      uCoord <= offset + size &&
      vCoord >= offset &&
      vCoord <= offset + size
    ) {
      return t;
    }
    
    return null;
  }

  /**
   * Calculate distance from point to line
   */
  private static pointToLineDistance(
    point: Vec3,
    lineStart: Vec3,
    lineDir: Vec3
  ): number {
    const toPoint = sub(point, lineStart);
    const projected = dot(toPoint, lineDir);
    const closestOnLine: Vec3 = [
      lineStart[0] + lineDir[0] * projected,
      lineStart[1] + lineDir[1] * projected,
      lineStart[2] + lineDir[2] * projected,
    ];
    return length(sub(point, closestOnLine));
  }
}

