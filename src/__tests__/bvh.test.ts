import { describe, it, expect } from 'vitest';
import {
  buildBlas,
  aabbFromTriangle,
  aabbUnion,
  createUvSphereMesh,
} from '@core';

function aabbContains(
  outer: { aabbMin: [number, number, number]; aabbMax: [number, number, number] },
  inner: { min: [number, number, number]; max: [number, number, number] },
  eps = 1e-6
) {
  expect(outer.aabbMin[0]).toBeLessThanOrEqual(inner.min[0] + eps);
  expect(outer.aabbMin[1]).toBeLessThanOrEqual(inner.min[1] + eps);
  expect(outer.aabbMin[2]).toBeLessThanOrEqual(inner.min[2] + eps);
  expect(outer.aabbMax[0]).toBeGreaterThanOrEqual(inner.max[0] - eps);
  expect(outer.aabbMax[1]).toBeGreaterThanOrEqual(inner.max[1] - eps);
  expect(outer.aabbMax[2]).toBeGreaterThanOrEqual(inner.max[2] - eps);
}

function recomputeNodeBounds(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  blas: ReturnType<typeof buildBlas>,
  nodeIndex: number
): { min: [number, number, number]; max: [number, number, number] } {
  const node = blas.nodes[nodeIndex]!;
  if (node.left === -1) {
    // Leaf
    let out: { min: [number, number, number]; max: [number, number, number] } | null = null;
    for (let i = 0; i < node.triCount; i++) {
      const triId = blas.triRefs[node.triOffset + i]!;
      const aabb = aabbFromTriangle(positions, indices, triId);
      out = out ? aabbUnion(out, aabb) : aabb;
    }
    return out!;
  }
  const l = recomputeNodeBounds(positions, indices, blas, node.left);
  const r = recomputeNodeBounds(positions, indices, blas, node.right);
  return aabbUnion(l, r);
}

describe('core/bvh buildBlas', () => {
  it('builds a deterministic BLAS with root at index 0 and valid references', () => {
    const mesh = createUvSphereMesh(16, 8); // smaller mesh for faster test
    const a = buildBlas(mesh.positions, mesh.indices, { maxTrisPerLeaf: 4 });
    const b = buildBlas(mesh.positions, mesh.indices, { maxTrisPerLeaf: 4 });

    // Determinism (structure + ordering)
    expect(a.triRefs).toEqual(b.triRefs);
    expect(a.nodes).toEqual(b.nodes);

    // Root exists
    expect(a.nodes.length).toBeGreaterThan(0);
    expect(a.nodes[0]).toBeDefined();

    // Every triangle included exactly once
    const triCount = mesh.indices.length / 3;
    expect(a.triRefs.length).toBe(triCount);
    const seen = new Array<boolean>(triCount).fill(false);
    for (const t of a.triRefs) {
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThan(triCount);
      expect(seen[t]).toBe(false);
      seen[t] = true;
    }
    expect(seen.every(Boolean)).toBe(true);

    // Node invariants
    for (let i = 0; i < a.nodes.length; i++) {
      const n = a.nodes[i]!;
      // AABB is finite
      for (const v of [...n.aabbMin, ...n.aabbMax]) {
        expect(Number.isFinite(v)).toBe(true);
      }

      const isLeaf = n.left === -1;
      if (isLeaf) {
        expect(n.right).toBe(-1);
        expect(n.triCount).toBeGreaterThan(0);
        expect(n.triOffset).toBeGreaterThanOrEqual(0);
        expect(n.triOffset + n.triCount).toBeLessThanOrEqual(a.triRefs.length);
      } else {
        expect(n.left).toBeGreaterThanOrEqual(0);
        expect(n.right).toBeGreaterThanOrEqual(0);
        expect(n.left).toBeLessThan(a.nodes.length);
        expect(n.right).toBeLessThan(a.nodes.length);
        expect(n.triCount).toBe(0);
      }
    }
  });

  it('node AABBs contain all triangles in their subtree (validated by recomputation)', () => {
    const mesh = createUvSphereMesh(16, 8);
    const blas = buildBlas(mesh.positions, mesh.indices, { maxTrisPerLeaf: 4 });

    for (let i = 0; i < blas.nodes.length; i++) {
      const recomputed = recomputeNodeBounds(mesh.positions, mesh.indices, blas, i);
      aabbContains(blas.nodes[i]!, recomputed);
    }
  });
});


