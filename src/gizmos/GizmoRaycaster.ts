import { Ray, Vec3, normalize, sub, dot, length, add, mul } from '../core/math';
import { GizmoAxis, GizmoMode } from '../store/gizmoStore';

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
    gizmoScale: number,
    mode: GizmoMode = 'translate'
  ): GizmoAxis {
    switch (mode) {
      case 'translate':
        return this.pickTranslate(ray, gizmoPosition, gizmoScale);
      case 'rotate':
        return this.pickRotate(ray, gizmoPosition, gizmoScale);
      case 'scale':
        return this.pickScale(ray, gizmoPosition, gizmoScale);
      default:
        return null;
    }
  }

  /**
   * Pick translate gizmo (arrows and planes)
   */
  private static pickTranslate(
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
   * Pick rotation gizmo (torus rings)
   */
  private static pickRotate(
    ray: Ray,
    gizmoPosition: Vec3,
    gizmoScale: number
  ): GizmoAxis {
    const ringRadius = 1.0 * gizmoScale;
    const tubeRadius = 0.06 * gizmoScale; // Slightly larger for easier picking
    const trackballRadius = 1.15 * gizmoScale;
    const trackballTubeRadius = 0.05 * gizmoScale;

    let closestAxis: GizmoAxis = null;
    let closestDistance = Infinity;

    // Test rotation rings
    // Each ring is a torus around a specific axis
    const rings: Array<{ axis: GizmoAxis; normal: Vec3 }> = [
      { axis: 'x', normal: [1, 0, 0] }, // X ring rotates around X axis
      { axis: 'y', normal: [0, 1, 0] }, // Y ring rotates around Y axis
      { axis: 'z', normal: [0, 0, 1] }, // Z ring rotates around Z axis
    ];

    for (const { axis, normal } of rings) {
      const t = this.rayTorusDistance(
        ray,
        gizmoPosition,
        normal,
        ringRadius,
        tubeRadius
      );
      if (t !== null && t < closestDistance) {
        closestDistance = t;
        closestAxis = axis;
      }
    }

    // Test trackball (outer ring, use xyz for free rotation)
    const trackballT = this.rayTorusDistance(
      ray,
      gizmoPosition,
      [0, 0, 1], // Trackball is oriented in Z by default
      trackballRadius,
      trackballTubeRadius
    );
    if (trackballT !== null && trackballT < closestDistance) {
      closestDistance = trackballT;
      closestAxis = 'xyz';
    }

    return closestAxis;
  }

  /**
   * Pick scale gizmo (lines with cube endpoints)
   */
  private static pickScale(
    ray: Ray,
    gizmoPosition: Vec3,
    gizmoScale: number
  ): GizmoAxis {
    const lineLength = 1.0 * gizmoScale;
    const lineRadius = 0.05 * gizmoScale;
    const cubeSize = 0.12 * gizmoScale;
    const centerCubeSize = 0.15 * gizmoScale;

    let closestAxis: GizmoAxis = null;
    let closestDistance = Infinity;

    // Test center cube first (uniform scale)
    const centerT = this.rayCubeDistance(
      ray,
      gizmoPosition,
      centerCubeSize
    );
    if (centerT !== null && centerT < closestDistance) {
      closestDistance = centerT;
      closestAxis = 'xyz';
    }

    // Test axis lines and endpoint cubes
    const axes: Array<{ axis: GizmoAxis; dir: Vec3 }> = [
      { axis: 'x', dir: [1, 0, 0] },
      { axis: 'y', dir: [0, 1, 0] },
      { axis: 'z', dir: [0, 0, 1] },
    ];

    for (const { axis, dir } of axes) {
      // Test line
      const lineT = this.rayAxisDistance(ray, gizmoPosition, dir, lineLength, lineRadius);
      if (lineT !== null && lineT < closestDistance) {
        closestDistance = lineT;
        closestAxis = axis;
      }

      // Test endpoint cube
      const cubeCenter: Vec3 = [
        gizmoPosition[0] + dir[0] * lineLength,
        gizmoPosition[1] + dir[1] * lineLength,
        gizmoPosition[2] + dir[2] * lineLength,
      ];
      const cubeT = this.rayCubeDistance(ray, cubeCenter, cubeSize);
      if (cubeT !== null && cubeT < closestDistance) {
        closestDistance = cubeT;
        closestAxis = axis;
      }
    }

    return closestAxis;
  }

  /**
   * Test ray against a torus (ring)
   * Uses a simplified approach: find closest point on circle and check tube distance
   */
  private static rayTorusDistance(
    ray: Ray,
    center: Vec3,
    normal: Vec3, // Axis the ring is perpendicular to
    ringRadius: number,
    tubeRadius: number
  ): number | null {
    // Transform ray to local space where the torus is centered at origin
    // and the ring lies in the plane perpendicular to 'normal'
    const localOrigin = sub(ray.origin, center);

    // We'll sample multiple points along the ray and check if any are within
    // tube radius of the ring circle
    const maxDist = ringRadius * 4;
    const steps = 50;

    let closestT: number | null = null;
    let minDistance = tubeRadius;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * maxDist;
      const point: Vec3 = [
        localOrigin[0] + ray.direction[0] * t,
        localOrigin[1] + ray.direction[1] * t,
        localOrigin[2] + ray.direction[2] * t,
      ];

      // Project point onto the ring's plane
      const distAlongNormal = dot(point, normal);
      const pointOnPlane: Vec3 = [
        point[0] - normal[0] * distAlongNormal,
        point[1] - normal[1] * distAlongNormal,
        point[2] - normal[2] * distAlongNormal,
      ];

      // Distance from origin in the plane
      const distFromAxis = length(pointOnPlane);

      // Closest point on the ring circle
      let closestOnRing: Vec3;
      if (distFromAxis < 0.0001) {
        // Point is on the axis, pick any point on ring
        closestOnRing = [ringRadius, 0, 0];
        // Adjust based on normal direction
        if (Math.abs(normal[0]) > 0.9) {
          closestOnRing = [0, ringRadius, 0];
        }
      } else {
        const scale = ringRadius / distFromAxis;
        closestOnRing = [
          pointOnPlane[0] * scale,
          pointOnPlane[1] * scale,
          pointOnPlane[2] * scale,
        ];
      }

      // Distance from ray point to closest point on ring
      const toRing = sub(point, closestOnRing);
      const distToRing = length(toRing);

      if (distToRing < minDistance) {
        minDistance = distToRing;
        closestT = t;
      }
    }

    return closestT;
  }

  /**
   * Test ray against a cube (AABB)
   */
  private static rayCubeDistance(
    ray: Ray,
    cubeCenter: Vec3,
    cubeSize: number
  ): number | null {
    const halfSize = cubeSize / 2;
    const min: Vec3 = [
      cubeCenter[0] - halfSize,
      cubeCenter[1] - halfSize,
      cubeCenter[2] - halfSize,
    ];
    const max: Vec3 = [
      cubeCenter[0] + halfSize,
      cubeCenter[1] + halfSize,
      cubeCenter[2] + halfSize,
    ];

    let tmin = -Infinity;
    let tmax = Infinity;

    for (let i = 0; i < 3; i++) {
      if (Math.abs(ray.direction[i]) < 0.0001) {
        // Ray is parallel to slab
        if (ray.origin[i] < min[i] || ray.origin[i] > max[i]) {
          return null;
        }
      } else {
        const t1 = (min[i] - ray.origin[i]) / ray.direction[i];
        const t2 = (max[i] - ray.origin[i]) / ray.direction[i];

        const tNear = Math.min(t1, t2);
        const tFar = Math.max(t1, t2);

        tmin = Math.max(tmin, tNear);
        tmax = Math.min(tmax, tFar);

        if (tmin > tmax) {
          return null;
        }
      }
    }

    return tmin >= 0 ? tmin : (tmax >= 0 ? tmax : null);
  }

  /**
   * Test ray against an axis arrow (cylinder approximation)
   * Returns the distance to the hit, or null if no hit
   */
  private static rayAxisDistance(
    ray: Ray,
    gizmoPosition: Vec3,
    axisDir: Vec3,
    axisLength: number,
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
    if (t < 0 || s < 0 || s > axisLength) {
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
