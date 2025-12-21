import type { Vec3 } from './math';

export type Aabb = { min: Vec3; max: Vec3 };

export type BvhNode = {
  aabbMin: Vec3;
  aabbMax: Vec3;
  // Interior nodes: left/right are child node indices, triOffset/triCount = 0
  left: number;
  right: number;
  // Leaf nodes: triOffset/triCount indicate a contiguous range in triRefs, left/right = -1
  triOffset: number;
  triCount: number;
};

export type Blas = {
  nodes: BvhNode[]; // root at index 0
  triRefs: Uint32Array; // triangle ids (0..triCount-1) reordered for leaf ranges
};

export function aabbUnion(a: Aabb, b: Aabb): Aabb {
  return {
    min: [
      Math.min(a.min[0], b.min[0]),
      Math.min(a.min[1], b.min[1]),
      Math.min(a.min[2], b.min[2]),
    ],
    max: [
      Math.max(a.max[0], b.max[0]),
      Math.max(a.max[1], b.max[1]),
      Math.max(a.max[2], b.max[2]),
    ],
  };
}

export function aabbFromTriangle(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  triId: number
): Aabb {
  const i0 = indices[triId * 3]!;
  const i1 = indices[triId * 3 + 1]!;
  const i2 = indices[triId * 3 + 2]!;

  const ax = positions[i0 * 3]!,
    ay = positions[i0 * 3 + 1]!,
    az = positions[i0 * 3 + 2]!;
  const bx = positions[i1 * 3]!,
    by = positions[i1 * 3 + 1]!,
    bz = positions[i1 * 3 + 2]!;
  const cx = positions[i2 * 3]!,
    cy = positions[i2 * 3 + 1]!,
    cz = positions[i2 * 3 + 2]!;

  return {
    min: [
      Math.min(ax, bx, cx),
      Math.min(ay, by, cy),
      Math.min(az, bz, cz),
    ],
    max: [
      Math.max(ax, bx, cx),
      Math.max(ay, by, cy),
      Math.max(az, bz, cz),
    ],
  };
}

function triCentroid(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  triId: number
): Vec3 {
  const i0 = indices[triId * 3]!;
  const i1 = indices[triId * 3 + 1]!;
  const i2 = indices[triId * 3 + 2]!;

  const ax = positions[i0 * 3]!,
    ay = positions[i0 * 3 + 1]!,
    az = positions[i0 * 3 + 2]!;
  const bx = positions[i1 * 3]!,
    by = positions[i1 * 3 + 1]!,
    bz = positions[i1 * 3 + 2]!;
  const cx = positions[i2 * 3]!,
    cy = positions[i2 * 3 + 1]!,
    cz = positions[i2 * 3 + 2]!;

  return [(ax + bx + cx) / 3, (ay + by + cy) / 3, (az + bz + cz) / 3];
}

function aabbOfTriRange(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  triRefs: Uint32Array,
  start: number,
  count: number
): Aabb {
  let out: Aabb | null = null;
  for (let i = 0; i < count; i++) {
    const triId = triRefs[start + i]!;
    const aabb = aabbFromTriangle(positions, indices, triId);
    out = out ? aabbUnion(out, aabb) : aabb;
  }
  // count is always >= 1 when called
  return out!;
}

function longestAxis(aabb: Aabb): 0 | 1 | 2 {
  const ex = aabb.max[0] - aabb.min[0];
  const ey = aabb.max[1] - aabb.min[1];
  const ez = aabb.max[2] - aabb.min[2];
  if (ex >= ey && ex >= ez) return 0;
  if (ey >= ex && ey >= ez) return 1;
  return 2;
}

/**
 * Deterministic BLAS builder over triangles.
 *
 * - Root node is at index 0.
 * - Interior node: left/right child indices, triOffset/triCount = 0.
 * - Leaf node: left/right = -1, triOffset/triCount reference triRefs.
 *
 * Split strategy:
 * - Compute AABB over the range.
 * - Split along the longest axis at the median of centroid projections (deterministic stable sort).
 */
export function buildBlas(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  opts?: { maxTrisPerLeaf?: number }
): Blas {
  const maxTrisPerLeaf = Math.max(1, Math.floor(opts?.maxTrisPerLeaf ?? 4));

  const triCount = Math.floor(indices.length / 3);
  const triRefs = new Uint32Array(triCount);
  for (let i = 0; i < triCount; i++) triRefs[i] = i;

  const nodes: BvhNode[] = [];

  type Task = {
    nodeIndex: number;
    start: number;
    count: number;
  };

  // Create root placeholder
  nodes.push({
    aabbMin: [0, 0, 0],
    aabbMax: [0, 0, 0],
    left: -1,
    right: -1,
    triOffset: 0,
    triCount: 0,
  });

  const stack: Task[] = [{ nodeIndex: 0, start: 0, count: triCount }];

  while (stack.length > 0) {
    const task = stack.pop()!;
    const { nodeIndex, start, count } = task;

    const bounds = aabbOfTriRange(positions, indices, triRefs, start, count);
    const node = nodes[nodeIndex]!;
    node.aabbMin = bounds.min;
    node.aabbMax = bounds.max;

    if (count <= maxTrisPerLeaf) {
      node.left = -1;
      node.right = -1;
      node.triOffset = start;
      node.triCount = count;
      continue;
    }

    const axis = longestAxis(bounds);

    // Deterministic stable sort by centroid along axis, tie-break by triId.
    const slice = Array.from(triRefs.slice(start, start + count));
    slice.sort((a, b) => {
      const ca = triCentroid(positions, indices, a)[axis];
      const cb = triCentroid(positions, indices, b)[axis];
      if (ca < cb) return -1;
      if (ca > cb) return 1;
      return a - b;
    });
    for (let i = 0; i < slice.length; i++) triRefs[start + i] = slice[i]!;

    const leftCount = Math.floor(count / 2);
    const rightCount = count - leftCount;
    const leftStart = start;
    const rightStart = start + leftCount;

    const leftIndex = nodes.length;
    const rightIndex = nodes.length + 1;
    nodes.push({
      aabbMin: [0, 0, 0],
      aabbMax: [0, 0, 0],
      left: -1,
      right: -1,
      triOffset: 0,
      triCount: 0,
    });
    nodes.push({
      aabbMin: [0, 0, 0],
      aabbMax: [0, 0, 0],
      left: -1,
      right: -1,
      triOffset: 0,
      triCount: 0,
    });

    node.left = leftIndex;
    node.right = rightIndex;
    node.triOffset = 0;
    node.triCount = 0;

    // Push right then left so left is processed first (not required, but deterministic).
    stack.push({ nodeIndex: rightIndex, start: rightStart, count: rightCount });
    stack.push({ nodeIndex: leftIndex, start: leftStart, count: leftCount });
  }

  return { nodes, triRefs };
}


