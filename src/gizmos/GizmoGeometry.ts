/**
 * Gizmo geometry generation
 * Creates vertices for translation gizmo arrows and plane handles
 */

export interface GizmoMesh {
  // Interleaved vertex data: position(3) + color(4) + axisId(1) = 8 floats per vertex
  vertices: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  indexCount: number;
}

// Axis colors (RGBA)
const AXIS_COLORS = {
  x: [0.9, 0.22, 0.21, 1.0], // Red
  y: [0.26, 0.63, 0.28, 1.0], // Green
  z: [0.12, 0.53, 0.9, 1.0], // Blue
  xy: [1.0, 0.92, 0.23, 0.5], // Yellow (semi-transparent)
  xz: [0.0, 0.74, 0.83, 0.5], // Cyan
  yz: [0.88, 0.25, 0.98, 0.5], // Magenta
};

// Axis IDs for shader (must match gizmoStore.ts)
const AXIS_IDS = {
  x: 1,
  y: 2,
  z: 3,
  xy: 4,
  xz: 5,
  yz: 6,
};

/**
 * Create geometry for the translation gizmo
 */
export function createTranslateGizmoGeometry(): GizmoMesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  // Arrow parameters
  const shaftLength = 1.0;
  const shaftRadius = 0.025;
  const headLength = 0.25;
  const headRadius = 0.08;
  const segments = 8;

  // Create arrows for each axis
  const axes: Array<{
    name: 'x' | 'y' | 'z';
    dir: [number, number, number];
  }> = [
    { name: 'x', dir: [1, 0, 0] },
    { name: 'y', dir: [0, 1, 0] },
    { name: 'z', dir: [0, 0, 1] },
  ];

  for (const { name, dir } of axes) {
    const result = createArrow(
      dir,
      shaftLength,
      shaftRadius,
      headLength,
      headRadius,
      segments,
      AXIS_COLORS[name],
      AXIS_IDS[name],
      vertexOffset
    );
    vertices.push(...result.vertices);
    indices.push(...result.indices);
    vertexOffset += result.vertexCount;
  }

  // Create plane handles
  const planeSize = 0.3;
  const planeOffset = 0.35;

  const planes: Array<{
    name: 'xy' | 'xz' | 'yz';
    u: [number, number, number];
    v: [number, number, number];
  }> = [
    { name: 'xy', u: [1, 0, 0], v: [0, 1, 0] },
    { name: 'xz', u: [1, 0, 0], v: [0, 0, 1] },
    { name: 'yz', u: [0, 1, 0], v: [0, 0, 1] },
  ];

  for (const { name, u, v } of planes) {
    const result = createPlaneHandle(
      u,
      v,
      planeSize,
      planeOffset,
      AXIS_COLORS[name],
      AXIS_IDS[name],
      vertexOffset
    );
    vertices.push(...result.vertices);
    indices.push(...result.indices);
    vertexOffset += result.vertexCount;
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    vertexCount: vertexOffset,
    indexCount: indices.length,
  };
}

/**
 * Create arrow geometry (shaft cylinder + cone head)
 */
function createArrow(
  direction: [number, number, number],
  shaftLength: number,
  shaftRadius: number,
  headLength: number,
  headRadius: number,
  segments: number,
  color: number[],
  axisId: number,
  indexOffset: number
): { vertices: number[]; indices: number[]; vertexCount: number } {
  const vertices: number[] = [];
  const indices: number[] = [];

  // Build local coordinate system
  const [dx, dy, dz] = direction;
  let up: [number, number, number] =
    Math.abs(dy) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const right = normalize3(cross3(direction, up));
  up = cross3(right, direction) as [number, number, number];

  let localOffset = 0;

  // Shaft cylinder - create rings at bottom and top
  for (let ring = 0; ring <= 1; ring++) {
    const z = ring * shaftLength;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle) * shaftRadius;
      const sin = Math.sin(angle) * shaftRadius;

      // Position
      vertices.push(
        dx * z + right[0] * cos + up[0] * sin,
        dy * z + right[1] * cos + up[1] * sin,
        dz * z + right[2] * cos + up[2] * sin
      );
      // Color
      vertices.push(...color);
      // Axis ID (as float)
      vertices.push(axisId);
    }
  }

  // Shaft indices
  const vertsPerRing = segments + 1;
  for (let i = 0; i < segments; i++) {
    const base = indexOffset + i;
    indices.push(base, base + vertsPerRing, base + 1);
    indices.push(base + 1, base + vertsPerRing, base + vertsPerRing + 1);
  }
  localOffset += vertsPerRing * 2;

  // Cone base ring
  const coneBaseStart = indexOffset + localOffset;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle) * headRadius;
    const sin = Math.sin(angle) * headRadius;

    vertices.push(
      dx * shaftLength + right[0] * cos + up[0] * sin,
      dy * shaftLength + right[1] * cos + up[1] * sin,
      dz * shaftLength + right[2] * cos + up[2] * sin
    );
    vertices.push(...color);
    vertices.push(axisId);
  }
  localOffset += vertsPerRing;

  // Cone tip
  const tipIndex = indexOffset + localOffset;
  vertices.push(
    dx * (shaftLength + headLength),
    dy * (shaftLength + headLength),
    dz * (shaftLength + headLength)
  );
  vertices.push(...color);
  vertices.push(axisId);
  localOffset += 1;

  // Cone indices
  for (let i = 0; i < segments; i++) {
    indices.push(coneBaseStart + i, tipIndex, coneBaseStart + i + 1);
  }

  return { vertices, indices, vertexCount: localOffset };
}

/**
 * Create plane handle (quad)
 */
function createPlaneHandle(
  u: [number, number, number],
  v: [number, number, number],
  size: number,
  offset: number,
  color: number[],
  axisId: number,
  indexOffset: number
): { vertices: number[]; indices: number[]; vertexCount: number } {
  const vertices: number[] = [];

  // Quad corners
  const corners = [
    [offset, offset],
    [offset + size, offset],
    [offset + size, offset + size],
    [offset, offset + size],
  ];

  for (const [a, b] of corners) {
    vertices.push(u[0] * a + v[0] * b, u[1] * a + v[1] * b, u[2] * a + v[2] * b);
    vertices.push(...color);
    vertices.push(axisId);
  }

  const indices = [
    indexOffset,
    indexOffset + 1,
    indexOffset + 2,
    indexOffset,
    indexOffset + 2,
    indexOffset + 3,
  ];

  return { vertices, indices, vertexCount: 4 };
}

// Helper functions
function cross3(
  a: number[] | [number, number, number],
  b: number[] | [number, number, number]
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

