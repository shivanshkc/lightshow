import { describe, it, expect } from 'vitest';
import {
  createUvSphereMesh,
  createCuboidMesh,
  createCappedCylinderMesh,
  createCappedConeMesh,
  createCapsuleMesh,
  createTorusMesh,
} from '@core';

function expectFinite(v: number) {
  expect(Number.isFinite(v)).toBe(true);
}

function expectNear(a: number, b: number, eps: number) {
  expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);
}

function checkMeshBasics(mesh: {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  aabbMin: [number, number, number];
  aabbMax: [number, number, number];
}) {
  expect(mesh.positions.length % 3).toBe(0);
  expect(mesh.normals.length % 3).toBe(0);
  expect(mesh.indices.length % 3).toBe(0);
  expect(mesh.positions.length).toBe(mesh.normals.length);

  const vCount = mesh.positions.length / 3;
  for (const idx of mesh.indices) {
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(vCount);
  }

  // Normals finite + near-unit (allow slight fp error)
  for (let i = 0; i < mesh.normals.length; i += 3) {
    const x = mesh.normals[i]!;
    const y = mesh.normals[i + 1]!;
    const z = mesh.normals[i + 2]!;
    expectFinite(x);
    expectFinite(y);
    expectFinite(z);
    const len = Math.sqrt(x * x + y * y + z * z);
    // Allow zero normals only if the vertex itself is degenerate (should not happen).
    expect(len).toBeGreaterThan(0);
    expectNear(len, 1, 1e-3);
  }

  // AABB contains all vertices
  const [minX, minY, minZ] = mesh.aabbMin;
  const [maxX, maxY, maxZ] = mesh.aabbMax;
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const x = mesh.positions[i]!;
    const y = mesh.positions[i + 1]!;
    const z = mesh.positions[i + 2]!;
    expect(x).toBeGreaterThanOrEqual(minX - 1e-5);
    expect(y).toBeGreaterThanOrEqual(minY - 1e-5);
    expect(z).toBeGreaterThanOrEqual(minZ - 1e-5);
    expect(x).toBeLessThanOrEqual(maxX + 1e-5);
    expect(y).toBeLessThanOrEqual(maxY + 1e-5);
    expect(z).toBeLessThanOrEqual(maxZ + 1e-5);
  }
}

describe('core/meshes', () => {
  it('UV sphere is deterministic and has expected AABB (~[-1,+1])', () => {
    const a = createUvSphereMesh(32, 16);
    const b = createUvSphereMesh(32, 16);
    expect(a.positions).toEqual(b.positions);
    expect(a.normals).toEqual(b.normals);
    expect(a.indices).toEqual(b.indices);

    checkMeshBasics(a);
    expectNear(a.aabbMin[0], -1, 1e-4);
    expectNear(a.aabbMin[1], -1, 1e-4);
    expectNear(a.aabbMin[2], -1, 1e-4);
    expectNear(a.aabbMax[0], 1, 1e-4);
    expectNear(a.aabbMax[1], 1, 1e-4);
    expectNear(a.aabbMax[2], 1, 1e-4);
  });

  it('Cuboid has exact AABB [-1,+1] and flat normals', () => {
    const mesh = createCuboidMesh();
    checkMeshBasics(mesh);
    expect(mesh.aabbMin).toEqual([-1, -1, -1]);
    expect(mesh.aabbMax).toEqual([1, 1, 1]);
  });

  it('Capped cylinder has expected AABB (~[-1,+1])', () => {
    const mesh = createCappedCylinderMesh(32);
    checkMeshBasics(mesh);
    expectNear(mesh.aabbMin[0], -1, 1e-4);
    expectNear(mesh.aabbMin[1], -1, 1e-4);
    expectNear(mesh.aabbMin[2], -1, 1e-4);
    expectNear(mesh.aabbMax[0], 1, 1e-4);
    expectNear(mesh.aabbMax[1], 1, 1e-4);
    expectNear(mesh.aabbMax[2], 1, 1e-4);
  });

  it('Capped cone has expected AABB (~[-1,+1])', () => {
    const mesh = createCappedConeMesh(32);
    checkMeshBasics(mesh);
    expectNear(mesh.aabbMin[0], -1, 1e-4);
    expectNear(mesh.aabbMin[1], -1, 1e-4);
    expectNear(mesh.aabbMin[2], -1, 1e-4);
    expectNear(mesh.aabbMax[0], 1, 1e-4);
    expectNear(mesh.aabbMax[1], 1, 1e-4);
    expectNear(mesh.aabbMax[2], 1, 1e-4);
  });

  it('Torus (R=1, r=0.35) has expected AABB', () => {
    const mesh = createTorusMesh(32, 16, 1, 0.35);
    checkMeshBasics(mesh);
    expectNear(mesh.aabbMin[0], -(1 + 0.35), 1e-3);
    expectNear(mesh.aabbMin[1], -0.35, 1e-3);
    expectNear(mesh.aabbMin[2], -(1 + 0.35), 1e-3);
    expectNear(mesh.aabbMax[0], 1 + 0.35, 1e-3);
    expectNear(mesh.aabbMax[1], 0.35, 1e-3);
    expectNear(mesh.aabbMax[2], 1 + 0.35, 1e-3);
  });

  it('Capsule (radius=1, half-height=1 as cylinder half-length) has expected AABB (~[-1,-2,-1]..[+1,+2,+1])', () => {
    const mesh = createCapsuleMesh(32, 8);
    checkMeshBasics(mesh);
    expectNear(mesh.aabbMin[0], -1, 1e-3);
    expectNear(mesh.aabbMin[1], -2, 1e-3);
    expectNear(mesh.aabbMin[2], -1, 1e-3);
    expectNear(mesh.aabbMax[0], 1, 1e-3);
    expectNear(mesh.aabbMax[1], 2, 1e-3);
    expectNear(mesh.aabbMax[2], 1, 1e-3);
  });
});


