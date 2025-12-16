import { describe, it, expect } from 'vitest';
import { createScaleGizmoGeometry } from '../gizmos/ScaleGizmoGeometry';

describe('ScaleGizmoGeometry', () => {
  it('creates geometry with axis lines and cubes', () => {
    const mesh = createScaleGizmoGeometry();
    expect(mesh.vertices.length).toBeGreaterThan(0);
    expect(mesh.indices.length).toBeGreaterThan(0);
    expect(mesh.vertexCount).toBeGreaterThan(0);
  });

  it('has valid index buffer (indices within vertex range)', () => {
    const mesh = createScaleGizmoGeometry();
    const maxVertexIndex = mesh.vertexCount - 1;
    for (let i = 0; i < mesh.indices.length; i++) {
      expect(mesh.indices[i]).toBeLessThanOrEqual(maxVertexIndex);
      expect(mesh.indices[i]).toBeGreaterThanOrEqual(0);
    }
  });

  it('generates correct vertex stride (8 floats per vertex)', () => {
    const mesh = createScaleGizmoGeometry();
    // Each vertex: position(3) + color(4) + axisId(1) = 8 floats
    expect(mesh.vertices.length).toBe(mesh.vertexCount * 8);
  });

  it('has triangle indices (divisible by 3)', () => {
    const mesh = createScaleGizmoGeometry();
    expect(mesh.indices.length % 3).toBe(0);
  });

  it('contains center cube for uniform scale', () => {
    const mesh = createScaleGizmoGeometry();
    // Check that we have the uniform scale ID (7)
    const axisIds = new Set<number>();
    for (let i = 0; i < mesh.vertexCount; i++) {
      const axisId = mesh.vertices[i * 8 + 7];
      axisIds.add(axisId);
    }
    expect(axisIds.has(7)).toBe(true); // Uniform scale
  });

  it('contains all axis handles', () => {
    const mesh = createScaleGizmoGeometry();
    const axisIds = new Set<number>();
    for (let i = 0; i < mesh.vertexCount; i++) {
      const axisId = mesh.vertices[i * 8 + 7];
      axisIds.add(axisId);
    }
    expect(axisIds.has(1)).toBe(true); // X axis
    expect(axisIds.has(2)).toBe(true); // Y axis
    expect(axisIds.has(3)).toBe(true); // Z axis
  });
});

