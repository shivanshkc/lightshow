/**
 * Rotation gizmo geometry generation
 * Creates torus rings for each axis rotation
 */

import { GizmoMesh } from './GizmoGeometry';

// Axis colors (RGBA)
const AXIS_COLORS = {
  x: [0.9, 0.22, 0.21, 1.0], // Red
  y: [0.26, 0.63, 0.28, 1.0], // Green
  z: [0.12, 0.53, 0.9, 1.0], // Blue
  trackball: [0.5, 0.5, 0.5, 0.6], // Gray (semi-transparent)
};

// Axis IDs for shader
const AXIS_IDS = {
  x: 1,
  y: 2,
  z: 3,
  trackball: 7, // Use xyz ID for trackball
};

/**
 * Create geometry for the rotation gizmo
 * Three torus rings (X, Y, Z) plus outer trackball ring
 */
export function createRotateGizmoGeometry(): GizmoMesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  const ringRadius = 1.0;
  const tubeRadius = 0.02;
  const ringSegments = 64;
  const tubeSegments = 8;

  // Create rings for each axis
  const axes: Array<{
    name: 'x' | 'y' | 'z';
    normal: [number, number, number];
  }> = [
    { name: 'x', normal: [1, 0, 0] },
    { name: 'y', normal: [0, 1, 0] },
    { name: 'z', normal: [0, 0, 1] },
  ];

  for (const { name, normal } of axes) {
    const result = createTorus(
      normal,
      ringRadius,
      tubeRadius,
      ringSegments,
      tubeSegments,
      AXIS_COLORS[name],
      AXIS_IDS[name],
      vertexOffset
    );
    vertices.push(...result.vertices);
    indices.push(...result.indices);
    vertexOffset += result.vertexCount;
  }

  // Outer trackball ring (slightly larger, gray, screen-aligned in Z by default)
  const trackballResult = createTorus(
    [0, 0, 1], // Will be reoriented by shader to face camera
    ringRadius * 1.15,
    tubeRadius * 0.8,
    ringSegments,
    tubeSegments,
    AXIS_COLORS.trackball,
    AXIS_IDS.trackball,
    vertexOffset
  );
  vertices.push(...trackballResult.vertices);
  indices.push(...trackballResult.indices);
  vertexOffset += trackballResult.vertexCount;

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    vertexCount: vertexOffset,
    indexCount: indices.length,
  };
}

/**
 * Create torus (donut) geometry around a given axis
 */
function createTorus(
  normal: [number, number, number],
  ringRadius: number,
  tubeRadius: number,
  ringSegments: number,
  tubeSegments: number,
  color: number[],
  axisId: number,
  indexOffset: number
): { vertices: number[]; indices: number[]; vertexCount: number } {
  const vertices: number[] = [];
  const indices: number[] = [];

  // Build coordinate system from normal
  let up: [number, number, number] =
    Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const tangent = normalize3(cross3(normal, up));
  const bitangent = cross3(tangent, normal) as [number, number, number];

  // Generate torus vertices
  for (let i = 0; i <= ringSegments; i++) {
    const ringAngle = (i / ringSegments) * Math.PI * 2;
    const ringCos = Math.cos(ringAngle);
    const ringSin = Math.sin(ringAngle);

    // Center of tube at this ring position
    const cx = tangent[0] * ringCos + bitangent[0] * ringSin;
    const cy = tangent[1] * ringCos + bitangent[1] * ringSin;
    const cz = tangent[2] * ringCos + bitangent[2] * ringSin;

    // Tube direction (pointing outward from ring center)
    const tubeOut: [number, number, number] = [cx, cy, cz];

    for (let j = 0; j <= tubeSegments; j++) {
      const tubeAngle = (j / tubeSegments) * Math.PI * 2;
      const tubeCos = Math.cos(tubeAngle);
      const tubeSin = Math.sin(tubeAngle);

      // Position on tube surface
      const px =
        cx * ringRadius +
        (tubeOut[0] * tubeCos + normal[0] * tubeSin) * tubeRadius;
      const py =
        cy * ringRadius +
        (tubeOut[1] * tubeCos + normal[1] * tubeSin) * tubeRadius;
      const pz =
        cz * ringRadius +
        (tubeOut[2] * tubeCos + normal[2] * tubeSin) * tubeRadius;

      // Position (3 floats)
      vertices.push(px, py, pz);
      // Color (4 floats)
      vertices.push(...color);
      // Axis ID (1 float)
      vertices.push(axisId);
    }
  }

  // Generate indices
  const vertsPerRing = tubeSegments + 1;
  for (let i = 0; i < ringSegments; i++) {
    for (let j = 0; j < tubeSegments; j++) {
      const a = indexOffset + i * vertsPerRing + j;
      const b = indexOffset + (i + 1) * vertsPerRing + j;
      const c = indexOffset + (i + 1) * vertsPerRing + j + 1;
      const d = indexOffset + i * vertsPerRing + j + 1;

      indices.push(a, b, c, a, c, d);
    }
  }

  const vertexCount = (ringSegments + 1) * (tubeSegments + 1);
  return { vertices, indices, vertexCount };
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

