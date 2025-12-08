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

