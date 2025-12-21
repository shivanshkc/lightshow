import type { Vec3 } from './math';

export type Mesh = {
  positions: Float32Array; // packed xyz
  normals: Float32Array; // packed xyz
  indices: Uint32Array; // triangle indices
  aabbMin: Vec3;
  aabbMax: Vec3;
};

function computeAabb(positions: ArrayLike<number>): { min: Vec3; max: Vec3 } {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const z = positions[i + 2]!;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
}

function normalize3(x: number, y: number, z: number): Vec3 {
  const len = Math.sqrt(x * x + y * y + z * z);
  if (len <= 0) return [0, 0, 0];
  const inv = 1 / len;
  return [x * inv, y * inv, z * inv];
}

/**
 * Canonical UV sphere mesh.
 *
 * - radius = 1
 * - centered at origin
 * - aligned to Y axis
 * - tessellation: 32 segments × 16 rings (approved default)
 */
export function createUvSphereMesh(
  segments: number = 32,
  rings: number = 16
): Mesh {
  const seg = Math.max(3, Math.floor(segments));
  const ring = Math.max(2, Math.floor(rings));

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // We generate (ring+1) latitude rows and (seg+1) columns to duplicate the seam.
  for (let i = 0; i <= ring; i++) {
    const v = i / ring; // 0..1
    const phi = v * Math.PI; // 0..pi
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let j = 0; j <= seg; j++) {
      const u = j / seg; // 0..1
      const theta = u * Math.PI * 2; // 0..2pi
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const x = sinPhi * cosTheta;
      const y = cosPhi;
      const z = sinPhi * sinTheta;

      positions.push(x, y, z);
      normals.push(x, y, z); // unit sphere -> normal = position
    }
  }

  const stride = seg + 1;
  for (let i = 0; i < ring; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * stride + j;
      const b = a + stride;
      const c = b + 1;
      const d = a + 1;

      // Two triangles per quad (consistent winding).
      indices.push(a, b, d);
      indices.push(d, b, c);
    }
  }

  const { min, max } = computeAabb(positions);
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    aabbMin: min,
    aabbMax: max,
  };
}

/**
 * Canonical cuboid mesh.
 *
 * - half-extents = (1,1,1)
 * - centered at origin
 * - flat normals (per-face)
 */
export function createCuboidMesh(): Mesh {
  // 6 faces, 4 vertices each (no sharing) -> flat normals.
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  type Face = {
    n: Vec3;
    v: [Vec3, Vec3, Vec3, Vec3]; // CCW when viewed from outside
  };

  const faces: Face[] = [
    // +X
    {
      n: [1, 0, 0],
      v: [
        [1, -1, -1],
        [1, -1, 1],
        [1, 1, 1],
        [1, 1, -1],
      ],
    },
    // -X
    {
      n: [-1, 0, 0],
      v: [
        [-1, -1, 1],
        [-1, -1, -1],
        [-1, 1, -1],
        [-1, 1, 1],
      ],
    },
    // +Y
    {
      n: [0, 1, 0],
      v: [
        [-1, 1, -1],
        [1, 1, -1],
        [1, 1, 1],
        [-1, 1, 1],
      ],
    },
    // -Y
    {
      n: [0, -1, 0],
      v: [
        [-1, -1, 1],
        [1, -1, 1],
        [1, -1, -1],
        [-1, -1, -1],
      ],
    },
    // +Z
    {
      n: [0, 0, 1],
      v: [
        [1, -1, 1],
        [-1, -1, 1],
        [-1, 1, 1],
        [1, 1, 1],
      ],
    },
    // -Z
    {
      n: [0, 0, -1],
      v: [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
      ],
    },
  ];

  for (let f = 0; f < faces.length; f++) {
    const base = positions.length / 3;
    const face = faces[f]!;
    for (const vv of face.v) {
      positions.push(vv[0], vv[1], vv[2]);
      normals.push(face.n[0], face.n[1], face.n[2]);
    }
    // quad -> 2 triangles: 0-1-2, 0-2-3
    indices.push(base + 0, base + 1, base + 2);
    indices.push(base + 0, base + 2, base + 3);
  }

  const { min, max } = computeAabb(positions);
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    aabbMin: min,
    aabbMax: max,
  };
}

/**
 * Canonical capped cylinder mesh.
 *
 * - radius = 1
 * - half-height = 1 (y ∈ [-1,+1])
 * - aligned to +Y
 * - tessellation: 32 radial segments (approved default)
 * - hard edge between caps and side (no shared vertices)
 */
export function createCappedCylinderMesh(segments: number = 32): Mesh {
  const seg = Math.max(3, Math.floor(segments));
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Side vertices (duplicate seam via seg+1)
  const sideBase = 0;
  for (let j = 0; j <= seg; j++) {
    const u = j / seg;
    const theta = u * Math.PI * 2;
    const x = Math.cos(theta);
    const z = Math.sin(theta);
    // bottom
    positions.push(x, -1, z);
    normals.push(x, 0, z);
    // top
    positions.push(x, 1, z);
    normals.push(x, 0, z);
  }

  // Side indices
  for (let j = 0; j < seg; j++) {
    const i0 = sideBase + j * 2;
    const i1 = sideBase + (j + 1) * 2;
    const i2 = i0 + 1;
    const i3 = i1 + 1;
    // Two triangles per segment quad
    indices.push(i0, i2, i1);
    indices.push(i1, i2, i3);
  }

  // Top cap (center + ring, normals +Y)
  const topCenter = positions.length / 3;
  positions.push(0, 1, 0);
  normals.push(0, 1, 0);
  const topRingBase = positions.length / 3;
  for (let j = 0; j <= seg; j++) {
    const u = j / seg;
    const theta = u * Math.PI * 2;
    const x = Math.cos(theta);
    const z = Math.sin(theta);
    positions.push(x, 1, z);
    normals.push(0, 1, 0);
  }
  for (let j = 0; j < seg; j++) {
    indices.push(topCenter, topRingBase + j, topRingBase + j + 1);
  }

  // Bottom cap (center + ring, normals -Y)
  const bottomCenter = positions.length / 3;
  positions.push(0, -1, 0);
  normals.push(0, -1, 0);
  const bottomRingBase = positions.length / 3;
  for (let j = 0; j <= seg; j++) {
    const u = j / seg;
    const theta = u * Math.PI * 2;
    const x = Math.cos(theta);
    const z = Math.sin(theta);
    positions.push(x, -1, z);
    normals.push(0, -1, 0);
  }
  for (let j = 0; j < seg; j++) {
    // reverse winding for -Y
    indices.push(bottomCenter, bottomRingBase + j + 1, bottomRingBase + j);
  }

  const { min, max } = computeAabb(positions);
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    aabbMin: min,
    aabbMax: max,
  };
}

/**
 * Canonical capped cone mesh.
 *
 * - base radius = 1
 * - half-height = 1 (apex at y=+1, base at y=-1)
 * - aligned to +Y
 * - tessellation: 32 radial segments (approved default)
 * - hard edge between base cap and side (no shared vertices)
 */
export function createCappedConeMesh(segments: number = 32): Mesh {
  const seg = Math.max(3, Math.floor(segments));
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Side: base ring + per-segment apex duplicates for stable smoothing at apex.
  const baseRingStart = 0;
  for (let j = 0; j <= seg; j++) {
    const u = j / seg;
    const theta = u * Math.PI * 2;
    const x = Math.cos(theta);
    const z = Math.sin(theta);
    // base ring vertex
    positions.push(x, -1, z);
    // side normal: normalize([x, r/h, z]) where r=1, h=2 => 0.5
    const n = normalize3(x, 0.5, z);
    normals.push(n[0], n[1], n[2]);
  }
  const apexStart = positions.length / 3;
  for (let j = 0; j <= seg; j++) {
    const u = j / seg;
    const theta = u * Math.PI * 2;
    const x = Math.cos(theta);
    const z = Math.sin(theta);
    positions.push(0, 1, 0);
    const n = normalize3(x, 0.5, z);
    normals.push(n[0], n[1], n[2]);
  }
  for (let j = 0; j < seg; j++) {
    const b0 = baseRingStart + j;
    const b1 = baseRingStart + j + 1;
    const a0 = apexStart + j;
    indices.push(b0, a0, b1);
  }

  // Base cap: center + ring with -Y normals
  const capCenter = positions.length / 3;
  positions.push(0, -1, 0);
  normals.push(0, -1, 0);
  const capRing = positions.length / 3;
  for (let j = 0; j <= seg; j++) {
    const u = j / seg;
    const theta = u * Math.PI * 2;
    const x = Math.cos(theta);
    const z = Math.sin(theta);
    positions.push(x, -1, z);
    normals.push(0, -1, 0);
  }
  for (let j = 0; j < seg; j++) {
    // winding for -Y
    indices.push(capCenter, capRing + j + 1, capRing + j);
  }

  const { min, max } = computeAabb(positions);
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    aabbMin: min,
    aabbMax: max,
  };
}

/**
 * Canonical torus mesh.
 *
 * - major radius R = 1
 * - minor radius r = 0.35
 * - centered at origin
 * - aligned to +Y (ring lies in XZ plane)
 * - tessellation: major 32 × minor 16 (approved default)
 */
export function createTorusMesh(
  majorSegments: number = 32,
  minorSegments: number = 16,
  majorRadius: number = 1,
  minorRadius: number = 0.35
): Mesh {
  const maj = Math.max(3, Math.floor(majorSegments));
  const min = Math.max(3, Math.floor(minorSegments));
  const R = majorRadius;
  const r = minorRadius;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Duplicate seam on both loops for simpler indexing.
  const stride = min + 1;
  for (let i = 0; i <= maj; i++) {
    const u = (i / maj) * Math.PI * 2;
    const cu = Math.cos(u);
    const su = Math.sin(u);

    for (let j = 0; j <= min; j++) {
      const v = (j / min) * Math.PI * 2;
      const cv = Math.cos(v);
      const sv = Math.sin(v);

      const x = (R + r * cv) * cu;
      const y = r * sv;
      const z = (R + r * cv) * su;

      // Tube center on major ring
      const cx = R * cu;
      const cy = 0;
      const cz = R * su;

      const nx = x - cx;
      const ny = y - cy;
      const nz = z - cz;
      const n = normalize3(nx, ny, nz);

      positions.push(x, y, z);
      normals.push(n[0], n[1], n[2]);
    }
  }

  for (let i = 0; i < maj; i++) {
    for (let j = 0; j < min; j++) {
      const a = i * stride + j;
      const b = a + stride;
      const c = b + 1;
      const d = a + 1;

      indices.push(a, b, d);
      indices.push(d, b, c);
    }
  }

  const { min: aMin, max: aMax } = computeAabb(positions);
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    aabbMin: aMin,
    aabbMax: aMax,
  };
}

/**
 * Canonical capsule mesh.
 *
 * - radius = 1
 * - half-height = 1 is the cylinder half-length (excluding hemispheres)
 * - centered at origin
 * - aligned to +Y
 * - total span: y ∈ [-2,+2]
 * - tessellation: 32 radial segments; hemispheres match sphere ring density (approved default)
 */
export function createCapsuleMesh(
  radialSegments: number = 32,
  hemisphereRings: number = 8
): Mesh {
  const seg = Math.max(3, Math.floor(radialSegments));
  const hemi = Math.max(2, Math.floor(hemisphereRings));

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const addRing = (y: number, ringRadius: number, ny: (theta: number) => number, centerY?: number) => {
    const start = positions.length / 3;
    for (let j = 0; j < seg; j++) {
      const theta = (j / seg) * Math.PI * 2;
      const x = Math.cos(theta) * ringRadius;
      const z = Math.sin(theta) * ringRadius;
      positions.push(x, y, z);
      if (centerY !== undefined) {
        const n = normalize3(x, y - centerY, z);
        normals.push(n[0], n[1], n[2]);
      } else {
        const n = normalize3(x, ny(theta), z);
        normals.push(n[0], n[1], n[2]);
      }
    }
    return start;
  };

  // Bottom pole
  const bottomPole = positions.length / 3;
  positions.push(0, -2, 0);
  normals.push(0, -1, 0);

  // Bottom hemisphere rings (excluding pole, including equator at y=-1)
  const ringStarts: number[] = [];
  for (let i = 1; i <= hemi; i++) {
    const phi = (i / hemi) * (Math.PI / 2); // 0..pi/2
    const y = -1 - Math.cos(phi); // center at -1
    const rr = Math.sin(phi);
    const start = addRing(y, rr, () => 0, -1);
    ringStarts.push(start);
  }

  // Cylinder top ring at y=+1 (radius=1), normals radial (y=0)
  const cylTopRing = addRing(1, 1, () => 0);

  // Top hemisphere rings (excluding equator; up to near top pole)
  const topRingStarts: number[] = [];
  for (let i = hemi - 1; i >= 1; i--) {
    const phi = (i / hemi) * (Math.PI / 2);
    const y = 1 + Math.cos(phi); // center at +1
    const rr = Math.sin(phi);
    const start = addRing(y, rr, () => 0, 1);
    topRingStarts.push(start);
  }

  // Top pole
  const topPole = positions.length / 3;
  positions.push(0, 2, 0);
  normals.push(0, 1, 0);

  // Connect bottom pole to first ring (fan)
  const firstRing = ringStarts[0]!;
  for (let j = 0; j < seg; j++) {
    const j1 = (j + 1) % seg;
    // winding to point outward; bottom pole points -Y
    indices.push(bottomPole, firstRing + j1, firstRing + j);
  }

  // Connect bottom hemisphere rings
  for (let r = 0; r < ringStarts.length - 1; r++) {
    const a = ringStarts[r]!;
    const b = ringStarts[r + 1]!;
    for (let j = 0; j < seg; j++) {
      const j1 = (j + 1) % seg;
      const a0 = a + j;
      const a1 = a + j1;
      const b0 = b + j;
      const b1 = b + j1;
      indices.push(a0, b0, a1);
      indices.push(a1, b0, b1);
    }
  }

  // Connect bottom equator ring (last bottom hemi ring) to cylinder top ring
  const bottomEquator = ringStarts[ringStarts.length - 1]!;
  const topEquator = cylTopRing;
  for (let j = 0; j < seg; j++) {
    const j1 = (j + 1) % seg;
    const a0 = bottomEquator + j;
    const a1 = bottomEquator + j1;
    const b0 = topEquator + j;
    const b1 = topEquator + j1;
    indices.push(a0, b0, a1);
    indices.push(a1, b0, b1);
  }

  // Connect cylinder top ring to first top hemisphere ring (if any), else to top pole
  let prev = topEquator;
  if (topRingStarts.length > 0) {
    for (const start of topRingStarts) {
      const a = prev;
      const b = start;
      for (let j = 0; j < seg; j++) {
        const j1 = (j + 1) % seg;
        const a0 = a + j;
        const a1 = a + j1;
        const b0 = b + j;
        const b1 = b + j1;
        indices.push(a0, b0, a1);
        indices.push(a1, b0, b1);
      }
      prev = b;
    }
  }

  // Connect last ring to top pole (fan)
  const lastRing = topRingStarts.length > 0 ? topRingStarts[topRingStarts.length - 1]! : topEquator;
  for (let j = 0; j < seg; j++) {
    const j1 = (j + 1) % seg;
    // winding for +Y top pole
    indices.push(topPole, lastRing + j, lastRing + j1);
  }

  const { min, max } = computeAabb(positions);
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    aabbMin: min,
    aabbMax: max,
  };
}


