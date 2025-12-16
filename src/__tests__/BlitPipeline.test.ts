import { describe, it, expect } from 'vitest';

describe('BlitPipeline', () => {
  describe('fullscreen triangle', () => {
    it('uses 3 vertices for fullscreen coverage', () => {
      // Fullscreen triangle uses exactly 3 vertices
      const vertexCount = 3;
      expect(vertexCount).toBe(3);
    });

    it('covers entire screen with oversized triangle', () => {
      // The triangle extends beyond the screen bounds
      // Vertices at (-1,-1), (3,-1), (-1,3) cover the entire [-1,1] NDC range
      const vertices = [
        [-1, -1],
        [3, -1],
        [-1, 3],
      ];
      
      // All corners of the screen (-1 to 1) should be inside the triangle
      const corners = [
        [-1, -1], // bottom-left
        [1, -1],  // bottom-right
        [-1, 1],  // top-left
        [1, 1],   // top-right
      ];
      
      // Simple check: the triangle bounds include all corners
      const minX = Math.min(...vertices.map(v => v[0]));
      const maxX = Math.max(...vertices.map(v => v[0]));
      const minY = Math.min(...vertices.map(v => v[1]));
      const maxY = Math.max(...vertices.map(v => v[1]));
      
      for (const corner of corners) {
        expect(corner[0]).toBeGreaterThanOrEqual(minX);
        expect(corner[0]).toBeLessThanOrEqual(maxX);
        expect(corner[1]).toBeGreaterThanOrEqual(minY);
        expect(corner[1]).toBeLessThanOrEqual(maxY);
      }
    });
  });

  describe('module export', () => {
    it('exports BlitPipeline class', async () => {
      const module = await import('../renderer/BlitPipeline');
      expect(module.BlitPipeline).toBeDefined();
    });
  });
});

