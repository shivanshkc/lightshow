/**
 * 3D Math utilities for vectors and matrices
 * Matrices are column-major for GPU compatibility
 */

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Mat4 = Float32Array; // 16 elements, column-major

// ============================================
// Vector Creation
// ============================================

export const vec3 = (x: number, y: number, z: number): Vec3 => [x, y, z];

// ============================================
// Vector Operations
// ============================================

export const add = (a: Vec3, b: Vec3): Vec3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];

export const sub = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];

export const mul = (v: Vec3, s: number): Vec3 => [
  v[0] * s,
  v[1] * s,
  v[2] * s,
];

export const div = (v: Vec3, s: number): Vec3 => [
  v[0] / s,
  v[1] / s,
  v[2] / s,
];

export const dot = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const length = (v: Vec3): number => Math.sqrt(dot(v, v));

export const normalize = (v: Vec3): Vec3 => {
  const l = length(v);
  return l > 0 ? mul(v, 1 / l) : [0, 0, 0];
};

export const negate = (v: Vec3): Vec3 => [-v[0], -v[1], -v[2]];

// ============================================
// Matrix Operations
// ============================================

/**
 * Create a 4x4 identity matrix
 */
export function mat4Identity(): Mat4 {
  const m = new Float32Array(16);
  m[0] = 1;
  m[5] = 1;
  m[10] = 1;
  m[15] = 1;
  return m;
}

/**
 * Create a perspective projection matrix
 * @param fovY - Vertical field of view in radians
 * @param aspect - Aspect ratio (width/height)
 * @param near - Near clipping plane
 * @param far - Far clipping plane
 */
export function mat4Perspective(
  fovY: number,
  aspect: number,
  near: number,
  far: number
): Mat4 {
  const m = new Float32Array(16);
  const f = 1.0 / Math.tan(fovY / 2);
  const rangeInv = 1.0 / (near - far);

  m[0] = f / aspect;
  m[5] = f;
  m[10] = far * rangeInv;
  m[11] = -1;
  m[14] = near * far * rangeInv;

  return m;
}

/**
 * Convert a vertical screen-space pixel distance (CSS px) into world units at a given depth,
 * using a perspective camera with vertical field-of-view `fovY` and viewport height.
 *
 * This is useful for approximating a world-space tolerance that corresponds to a constant
 * on-screen size (e.g. touch hit slop).
 */
export function pixelsToWorldUnitsAtDepth(
  pixelsCss: number,
  depth: number,
  fovY: number,
  viewportHeightCss: number
): number {
  if (!Number.isFinite(pixelsCss)) return 0;
  if (!Number.isFinite(depth)) return 0;
  if (!Number.isFinite(fovY)) return 0;
  if (!Number.isFinite(viewportHeightCss) || viewportHeightCss <= 0) return 0;

  const d = Math.abs(depth);
  if (d <= 0) return 0;

  // Visible vertical world height at distance d is: 2 * d * tan(fovY/2)
  const worldHeightAtDepth = 2 * d * Math.tan(fovY / 2);
  const worldUnitsPerCssPx = worldHeightAtDepth / viewportHeightCss;
  return pixelsCss * worldUnitsPerCssPx;
}

/**
 * Create a look-at view matrix
 * @param eye - Camera position
 * @param target - Look-at target
 * @param up - Up vector
 */
export function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
  const zAxis = normalize(sub(eye, target)); // Forward (camera looks down -Z)
  const xAxis = normalize(cross(up, zAxis)); // Right
  const yAxis = cross(zAxis, xAxis); // Up

  const m = new Float32Array(16);

  // Column 0
  m[0] = xAxis[0];
  m[1] = yAxis[0];
  m[2] = zAxis[0];
  m[3] = 0;

  // Column 1
  m[4] = xAxis[1];
  m[5] = yAxis[1];
  m[6] = zAxis[1];
  m[7] = 0;

  // Column 2
  m[8] = xAxis[2];
  m[9] = yAxis[2];
  m[10] = zAxis[2];
  m[11] = 0;

  // Column 3 (translation)
  m[12] = -dot(xAxis, eye);
  m[13] = -dot(yAxis, eye);
  m[14] = -dot(zAxis, eye);
  m[15] = 1;

  return m;
}

/**
 * Multiply two 4x4 matrices: result = a * b
 */
export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const result = new Float32Array(16);

  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row + k * 4] * b[k + col * 4];
      }
      result[row + col * 4] = sum;
    }
  }

  return result;
}

/**
 * Compute the inverse of a 4x4 matrix
 * Uses the adjugate method
 */
export function mat4Inverse(m: Mat4): Mat4 {
  const inv = new Float32Array(16);

  const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
  const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
  const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];
  const m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15];

  const b00 = m00 * m11 - m01 * m10;
  const b01 = m00 * m12 - m02 * m10;
  const b02 = m00 * m13 - m03 * m10;
  const b03 = m01 * m12 - m02 * m11;
  const b04 = m01 * m13 - m03 * m11;
  const b05 = m02 * m13 - m03 * m12;
  const b06 = m20 * m31 - m21 * m30;
  const b07 = m20 * m32 - m22 * m30;
  const b08 = m20 * m33 - m23 * m30;
  const b09 = m21 * m32 - m22 * m31;
  const b10 = m21 * m33 - m23 * m31;
  const b11 = m22 * m33 - m23 * m32;

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (Math.abs(det) < 1e-8) {
    // Return identity if matrix is singular
    return mat4Identity();
  }

  det = 1.0 / det;

  inv[0] = (m11 * b11 - m12 * b10 + m13 * b09) * det;
  inv[1] = (m02 * b10 - m01 * b11 - m03 * b09) * det;
  inv[2] = (m31 * b05 - m32 * b04 + m33 * b03) * det;
  inv[3] = (m22 * b04 - m21 * b05 - m23 * b03) * det;
  inv[4] = (m12 * b08 - m10 * b11 - m13 * b07) * det;
  inv[5] = (m00 * b11 - m02 * b08 + m03 * b07) * det;
  inv[6] = (m32 * b02 - m30 * b05 - m33 * b01) * det;
  inv[7] = (m20 * b05 - m22 * b02 + m23 * b01) * det;
  inv[8] = (m10 * b10 - m11 * b08 + m13 * b06) * det;
  inv[9] = (m01 * b08 - m00 * b10 - m03 * b06) * det;
  inv[10] = (m30 * b04 - m31 * b02 + m33 * b00) * det;
  inv[11] = (m21 * b02 - m20 * b04 - m23 * b00) * det;
  inv[12] = (m11 * b07 - m10 * b09 - m12 * b06) * det;
  inv[13] = (m00 * b09 - m01 * b07 + m02 * b06) * det;
  inv[14] = (m31 * b01 - m30 * b03 - m32 * b00) * det;
  inv[15] = (m20 * b03 - m21 * b01 + m22 * b00) * det;

  return inv;
}

// ============================================
// Ray and Intersection Types
// ============================================

export interface Ray {
  origin: Vec3;
  direction: Vec3;
}

export interface HitResult {
  hit: boolean;
  t: number;
  point: Vec3;
  normal: Vec3;
}

// ============================================
// Matrix-Vector Operations
// ============================================

/**
 * Multiply a 4x4 matrix by a Vec4
 */
export function mat4MultiplyVec4(m: Mat4, v: Vec4): Vec4 {
  return [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
    m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3],
  ];
}

// ============================================
// 3x3 Matrix Operations (for rotation)
// ============================================

export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number
];

/**
 * Create a 3x3 rotation matrix from Euler angles (ZYX order)
 */
export function mat3FromRotation(euler: Vec3): Mat3 {
  const cx = Math.cos(euler[0]);
  const sx = Math.sin(euler[0]);
  const cy = Math.cos(euler[1]);
  const sy = Math.sin(euler[1]);
  const cz = Math.cos(euler[2]);
  const sz = Math.sin(euler[2]);

  return [
    cy * cz,                      cy * sz,                     -sy,
    sx * sy * cz - cx * sz,       sx * sy * sz + cx * cz,      sx * cy,
    cx * sy * cz + sx * sz,       cx * sy * sz - sx * cz,      cx * cy,
  ];
}

/**
 * Transpose a 3x3 matrix
 */
export function mat3Transpose(m: Mat3): Mat3 {
  return [
    m[0], m[3], m[6],
    m[1], m[4], m[7],
    m[2], m[5], m[8],
  ];
}

/**
 * Multiply a 3x3 matrix by a Vec3
 */
export function mat3MultiplyVec3(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
    m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
    m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
  ];
}

// ============================================
// Ray Generation
// ============================================

/**
 * Create a ray from screen coordinates through the camera
 */
export function screenToWorldRay(
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  inverseProjection: Mat4,
  inverseView: Mat4,
  cameraPosition: Vec3
): Ray {
  // Convert to NDC (-1 to 1)
  const ndcX = (screenX / canvasWidth) * 2 - 1;
  const ndcY = 1 - (screenY / canvasHeight) * 2; // Flip Y

  // Create clip space point
  const clipPoint: Vec4 = [ndcX, ndcY, -1, 1];

  // Transform to eye space
  let eyePoint = mat4MultiplyVec4(inverseProjection, clipPoint);
  eyePoint = [eyePoint[0], eyePoint[1], -1, 0];

  // Transform to world space
  const worldDir = mat4MultiplyVec4(inverseView, eyePoint);
  const direction = normalize([worldDir[0], worldDir[1], worldDir[2]]);

  return {
    origin: cameraPosition,
    direction,
  };
}

// ============================================
// Ray-Object Intersections
// ============================================

/**
 * Ray-sphere intersection
 */
export function intersectRaySphere(
  ray: Ray,
  center: Vec3,
  radius: number
): { hit: boolean; t: number } {
  const oc = sub(ray.origin, center);
  const a = dot(ray.direction, ray.direction);
  const b = 2 * dot(oc, ray.direction);
  const c = dot(oc, oc) - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return { hit: false, t: Infinity };
  }

  const sqrtD = Math.sqrt(discriminant);
  let t = (-b - sqrtD) / (2 * a);

  if (t < 0.001) {
    t = (-b + sqrtD) / (2 * a);
  }

  if (t < 0.001) {
    return { hit: false, t: Infinity };
  }

  return { hit: true, t };
}

/**
 * Ray-box intersection (AABB)
 */
export function intersectRayBox(
  ray: Ray,
  center: Vec3,
  halfExtents: Vec3
): { hit: boolean; t: number } {
  const invDir: Vec3 = [
    1 / ray.direction[0],
    1 / ray.direction[1],
    1 / ray.direction[2],
  ];

  const t1 = (center[0] - halfExtents[0] - ray.origin[0]) * invDir[0];
  const t2 = (center[0] + halfExtents[0] - ray.origin[0]) * invDir[0];
  const t3 = (center[1] - halfExtents[1] - ray.origin[1]) * invDir[1];
  const t4 = (center[1] + halfExtents[1] - ray.origin[1]) * invDir[1];
  const t5 = (center[2] - halfExtents[2] - ray.origin[2]) * invDir[2];
  const t6 = (center[2] + halfExtents[2] - ray.origin[2]) * invDir[2];

  const tmin = Math.max(
    Math.max(Math.min(t1, t2), Math.min(t3, t4)),
    Math.min(t5, t6)
  );
  const tmax = Math.min(
    Math.min(Math.max(t1, t2), Math.max(t3, t4)),
    Math.max(t5, t6)
  );

  if (tmax < 0 || tmin > tmax) {
    return { hit: false, t: Infinity };
  }

  const t = tmin < 0 ? tmax : tmin;

  if (t < 0.001) {
    return { hit: false, t: Infinity };
  }

  return { hit: true, t };
}

function isFinitePositive(v: number): boolean {
  return Number.isFinite(v) && v > 0;
}

function minPositiveT(a: number, b: number, eps = 0.001): number {
  let t = Infinity;
  if (a > eps && a < t) t = a;
  if (b > eps && b < t) t = b;
  return t;
}

/**
 * Ray-cylinder intersection (finite, capped).
 * Cylinder is centered at origin, aligned to local +Y axis.
 * Radius = r, cap planes at y = ±halfHeight.
 */
export function intersectRayCylinderCapped(ray: Ray, radius: number, halfHeight: number): { hit: boolean; t: number } {
  if (!isFinitePositive(radius) || !isFinitePositive(halfHeight)) return { hit: false, t: Infinity };

  const ox = ray.origin[0];
  const oy = ray.origin[1];
  const oz = ray.origin[2];
  const dx = ray.direction[0];
  const dy = ray.direction[1];
  const dz = ray.direction[2];

  const r2 = radius * radius;
  let bestT = Infinity;

  // Side surface: x^2 + z^2 = r^2
  const a = dx * dx + dz * dz;
  const b = 2 * (ox * dx + oz * dz);
  const c = ox * ox + oz * oz - r2;

  if (Math.abs(a) > 1e-12) {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      const t0 = (-b - s) / (2 * a);
      const t1 = (-b + s) / (2 * a);
      const tSide = minPositiveT(t0, t1);
      if (tSide !== Infinity) {
        const y = oy + dy * tSide;
        if (y >= -halfHeight && y <= halfHeight) bestT = Math.min(bestT, tSide);
      }
      // If the nearer root is out of bounds, the farther root may still be in bounds.
      const tSide2 = tSide === t0 ? t1 : t0;
      if (tSide2 > 0.001 && tSide2 < bestT) {
        const y2 = oy + dy * tSide2;
        if (y2 >= -halfHeight && y2 <= halfHeight) bestT = Math.min(bestT, tSide2);
      }
    }
  }

  // Caps: y = ±halfHeight, radial <= r
  if (Math.abs(dy) > 1e-12) {
    for (const yCap of [-halfHeight, halfHeight] as const) {
      const tCap = (yCap - oy) / dy;
      if (tCap > 0.001 && tCap < bestT) {
        const x = ox + dx * tCap;
        const z = oz + dz * tCap;
        if (x * x + z * z <= r2) bestT = tCap;
      }
    }
  }

  return bestT !== Infinity ? { hit: true, t: bestT } : { hit: false, t: Infinity };
}

/**
 * Ray-cone intersection (finite, capped).
 * Cone is centered at origin, aligned to local +Y axis.
 * Convention (PRP v3.2 EC4): base cap at y=-halfHeight with radius=baseRadius; apex at y=+halfHeight with radius=0.
 */
export function intersectRayConeCapped(ray: Ray, baseRadius: number, halfHeight: number): { hit: boolean; t: number } {
  if (!isFinitePositive(baseRadius) || !isFinitePositive(halfHeight)) return { hit: false, t: Infinity };

  const ox = ray.origin[0];
  const oy = ray.origin[1];
  const oz = ray.origin[2];
  const dx = ray.direction[0];
  const dy = ray.direction[1];
  const dz = ray.direction[2];

  // Radius at y: r(y) = baseRadius * (halfHeight - y) / (2*halfHeight)
  // Implicit: x^2 + z^2 - k^2 * (halfHeight - y)^2 = 0, where k = baseRadius / (2*halfHeight)
  const k = baseRadius / (2 * halfHeight);
  const k2 = k * k;

  // Let q(t) = halfHeight - (oy + dy t) = (halfHeight - oy) - dy t
  const q0 = halfHeight - oy;

  // Quadratic coefficients for f(t) = (ox+dx t)^2 + (oz+dz t)^2 - k^2 * (q0 - dy t)^2
  const a = (dx * dx + dz * dz) - k2 * (dy * dy);
  const b = 2 * (ox * dx + oz * dz) + 2 * k2 * q0 * dy;
  const c = (ox * ox + oz * oz) - k2 * (q0 * q0);

  let bestT = Infinity;

  if (Math.abs(a) > 1e-12) {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      const t0 = (-b - s) / (2 * a);
      const t1 = (-b + s) / (2 * a);
      // Check both roots (the nearer may be outside y-range).
      for (const t of [t0, t1]) {
        if (t > 0.001 && t < bestT) {
          const y = oy + dy * t;
          if (y >= -halfHeight && y <= halfHeight) bestT = t;
        }
      }
    }
  } else if (Math.abs(b) > 1e-12) {
    // Degenerate to linear
    const t = -c / b;
    if (t > 0.001) {
      const y = oy + dy * t;
      if (y >= -halfHeight && y <= halfHeight) bestT = t;
    }
  }

  // Base cap at y = -halfHeight with radius = baseRadius
  if (Math.abs(dy) > 1e-12) {
    const tCap = (-halfHeight - oy) / dy;
    if (tCap > 0.001 && tCap < bestT) {
      const x = ox + dx * tCap;
      const z = oz + dz * tCap;
      if (x * x + z * z <= baseRadius * baseRadius) bestT = tCap;
    }
  }

  return bestT !== Infinity ? { hit: true, t: bestT } : { hit: false, t: Infinity };
}

/**
 * Ray-capsule intersection in object space.
 * Capsule is aligned to local +Y axis.
 * Encoding: radius = scale.x, halfHeightTotal = scale.y
 * Segment half-length: segmentHalf = max(halfHeightTotal - radius, 0)
 */
export function intersectRayCapsule(ray: Ray, radius: number, halfHeightTotal: number): { hit: boolean; t: number } {
  if (!isFinitePositive(radius) || !isFinitePositive(halfHeightTotal)) return { hit: false, t: Infinity };
  const segmentHalf = Math.max(halfHeightTotal - radius, 0);

  let bestT = Infinity;

  // Cylinder part (if any)
  if (segmentHalf > 0) {
    const cyl = intersectRayCylinderCapped(ray, radius, segmentHalf);
    if (cyl.hit) bestT = Math.min(bestT, cyl.t);
  }

  // Spherical caps
  const top = intersectRaySphere(ray, [0, segmentHalf, 0], radius);
  if (top.hit) bestT = Math.min(bestT, top.t);

  const bottom = intersectRaySphere(ray, [0, -segmentHalf, 0], radius);
  if (bottom.hit) bestT = Math.min(bestT, bottom.t);

  return bestT !== Infinity ? { hit: true, t: bestT } : { hit: false, t: Infinity };
}

