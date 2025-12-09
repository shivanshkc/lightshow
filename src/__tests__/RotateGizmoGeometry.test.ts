import { describe, it, expect } from 'vitest';
import { createRotateGizmoGeometry } from '../gizmos/RotateGizmoGeometry';

describe('RotateGizmoGeometry', () => {
  it('creates mesh with 4 rings (X, Y, Z, trackball)', () => {
    const mesh = createRotateGizmoGeometry();
    expect(mesh.vertices.length).toBeGreaterThan(0);
    expect(mesh.indices.length).toBeGreaterThan(0);
    expect(mesh.vertexCount).toBeGreaterThan(0);
  });

  it('has valid index buffer (indices within vertex range)', () => {
    const mesh = createRotateGizmoGeometry();
    const maxVertexIndex = mesh.vertexCount - 1;
    for (let i = 0; i < mesh.indices.length; i++) {
      expect(mesh.indices[i]).toBeLessThanOrEqual(maxVertexIndex);
      expect(mesh.indices[i]).toBeGreaterThanOrEqual(0);
    }
  });

  it('generates correct vertex stride (8 floats per vertex)', () => {
    const mesh = createRotateGizmoGeometry();
    // Each vertex: position(3) + color(4) + axisId(1) = 8 floats
    expect(mesh.vertices.length).toBe(mesh.vertexCount * 8);
  });

  it('has triangle indices (divisible by 3)', () => {
    const mesh = createRotateGizmoGeometry();
    expect(mesh.indices.length % 3).toBe(0);
  });

  it('contains axis IDs in vertex data', () => {
    const mesh = createRotateGizmoGeometry();
    // Check that we have different axis IDs (1=x, 2=y, 3=z, 7=trackball)
    const axisIds = new Set<number>();
    for (let i = 0; i < mesh.vertexCount; i++) {
      const axisId = mesh.vertices[i * 8 + 7]; // axisId is at offset 7
      axisIds.add(axisId);
    }
    expect(axisIds.has(1)).toBe(true); // X axis
    expect(axisIds.has(2)).toBe(true); // Y axis
    expect(axisIds.has(3)).toBe(true); // Z axis
    expect(axisIds.has(7)).toBe(true); // Trackball
  });
});

