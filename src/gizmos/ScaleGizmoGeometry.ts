/**
 * Scale gizmo geometry generation
 * Creates lines with cube endpoints for each axis scale
 */

import { GizmoMesh } from './GizmoGeometry';

// Axis colors (RGBA)
const AXIS_COLORS = {
  x: [0.9, 0.22, 0.21, 1.0], // Red
  y: [0.26, 0.63, 0.28, 1.0], // Green
  z: [0.12, 0.53, 0.9, 1.0], // Blue
  uniform: [1.0, 1.0, 1.0, 1.0], // White (center)
};

// Axis IDs for shader
const AXIS_IDS = {
  x: 1,
  y: 2,
  z: 3,
  uniform: 7, // Use xyz ID for uniform scale
};

/**
 * Create geometry for the scale gizmo
 * Three axis lines with cube endpoints + center cube for uniform scale
 */
export function createScaleGizmoGeometry(): GizmoMesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  const lineLength = 1.0;
  const lineWidth = 0.015;
  const cubeSize = 0.1;
  const segments = 4; // For cylindrical lines

  // Create axis lines with cube endpoints
  const axes: Array<{
    name: 'x' | 'y' | 'z';
    dir: [number, number, number];
  }> = [
    { name: 'x', dir: [1, 0, 0] },
    { name: 'y', dir: [0, 1, 0] },
    { name: 'z', dir: [0, 0, 1] },
  ];

  for (const { name, dir } of axes) {
    // Create line (cylinder)
    const lineResult = createLine(
      [0, 0, 0],
      [dir[0] * lineLength, dir[1] * lineLength, dir[2] * lineLength],
      lineWidth,
      segments,
      AXIS_COLORS[name],
      AXIS_IDS[name],
      vertexOffset
    );
    vertices.push(...lineResult.vertices);
    indices.push(...lineResult.indices);
    vertexOffset += lineResult.vertexCount;

    // Create cube at endpoint
    const cubeCenter: [number, number, number] = [
      dir[0] * lineLength,
      dir[1] * lineLength,
      dir[2] * lineLength,
    ];
    const cubeResult = createCube(
      cubeCenter,
      cubeSize,
      AXIS_COLORS[name],
      AXIS_IDS[name],
      vertexOffset
    );
    vertices.push(...cubeResult.vertices);
    indices.push(...cubeResult.indices);
    vertexOffset += cubeResult.vertexCount;
  }

  // Create center cube for uniform scale (white, slightly larger)
  const centerResult = createCube(
    [0, 0, 0],
    cubeSize * 1.2,
    AXIS_COLORS.uniform,
    AXIS_IDS.uniform,
    vertexOffset
  );
  vertices.push(...centerResult.vertices);
  indices.push(...centerResult.indices);
  vertexOffset += centerResult.vertexCount;

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    vertexCount: vertexOffset,
    indexCount: indices.length,
  };
}

/**
 * Create line geometry (cylinder)
 */
function createLine(
  start: [number, number, number],
  end: [number, number, number],
  radius: number,
  segments: number,
  color: number[],
  axisId: number,
  indexOffset: number
): { vertices: number[]; indices: number[]; vertexCount: number } {
  const vertices: number[] = [];
  const indices: number[] = [];

  // Direction from start to end
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const dir: [number, number, number] = [dx / len, dy / len, dz / len];

  // Build coordinate system
  let up: [number, number, number] =
    Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const right = normalize3(cross3(dir, up));
  up = cross3(right, dir) as [number, number, number];

  // Create cylinder rings at start and end
  for (let ring = 0; ring <= 1; ring++) {
    const pos = ring === 0 ? start : end;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle) * radius;
      const sin = Math.sin(angle) * radius;

      // Position
      vertices.push(
        pos[0] + right[0] * cos + up[0] * sin,
        pos[1] + right[1] * cos + up[1] * sin,
        pos[2] + right[2] * cos + up[2] * sin
      );
      // Color
      vertices.push(...color);
      // Axis ID
      vertices.push(axisId);
    }
  }

  // Generate indices for cylinder sides
  const vertsPerRing = segments + 1;
  for (let i = 0; i < segments; i++) {
    const base = indexOffset + i;
    indices.push(base, base + vertsPerRing, base + 1);
    indices.push(base + 1, base + vertsPerRing, base + vertsPerRing + 1);
  }

  return { vertices, indices, vertexCount: vertsPerRing * 2 };
}

/**
 * Create cube geometry
 */
function createCube(
  center: [number, number, number],
  size: number,
  color: number[],
  axisId: number,
  indexOffset: number
): { vertices: number[]; indices: number[]; vertexCount: number } {
  const vertices: number[] = [];
  const h = size / 2;
  const [cx, cy, cz] = center;

  // 8 vertices of cube
  const cubeVerts: [number, number, number][] = [
    [cx - h, cy - h, cz - h],
    [cx + h, cy - h, cz - h],
    [cx + h, cy + h, cz - h],
    [cx - h, cy + h, cz - h],
    [cx - h, cy - h, cz + h],
    [cx + h, cy - h, cz + h],
    [cx + h, cy + h, cz + h],
    [cx - h, cy + h, cz + h],
  ];

  for (const v of cubeVerts) {
    // Position
    vertices.push(v[0], v[1], v[2]);
    // Color
    vertices.push(...color);
    // Axis ID
    vertices.push(axisId);
  }

  // 12 triangles (6 faces × 2 triangles)
  const cubeIndices = [
    0, 1, 2, 0, 2, 3, // Front (-Z)
    4, 6, 5, 4, 7, 6, // Back (+Z)
    0, 4, 5, 0, 5, 1, // Bottom (-Y)
    2, 6, 7, 2, 7, 3, // Top (+Y)
    0, 3, 7, 0, 7, 4, // Left (-X)
    1, 5, 6, 1, 6, 2, // Right (+X)
  ];

  const indices = cubeIndices.map((i) => i + indexOffset);

  return { vertices, indices, vertexCount: 8 };
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

