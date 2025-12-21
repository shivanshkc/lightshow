import { describe, it, expect } from 'vitest';
import { pixelsToWorldUnitsAtDepth } from '@core';

describe('pixelsToWorldUnitsAtDepth', () => {
  it('matches the perspective-derived formula', () => {
    const px = 24;
    const depth = 5;
    const fovY = Math.PI / 3; // 60deg
    const viewportHeight = 800;

    const expected = (px * (2 * depth * Math.tan(fovY / 2))) / viewportHeight;
    expect(pixelsToWorldUnitsAtDepth(px, depth, fovY, viewportHeight)).toBeCloseTo(
      expected,
      10
    );
  });

  it('increases with pixel distance', () => {
    const depth = 5;
    const fovY = Math.PI / 3;
    const viewportHeight = 800;
    expect(pixelsToWorldUnitsAtDepth(10, depth, fovY, viewportHeight)).toBeLessThan(
      pixelsToWorldUnitsAtDepth(20, depth, fovY, viewportHeight)
    );
  });

  it('increases with depth', () => {
    const px = 24;
    const fovY = Math.PI / 3;
    const viewportHeight = 800;
    expect(pixelsToWorldUnitsAtDepth(px, 2, fovY, viewportHeight)).toBeLessThan(
      pixelsToWorldUnitsAtDepth(px, 4, fovY, viewportHeight)
    );
  });

  it('decreases with viewport height', () => {
    const px = 24;
    const depth = 5;
    const fovY = Math.PI / 3;
    expect(pixelsToWorldUnitsAtDepth(px, depth, fovY, 600)).toBeGreaterThan(
      pixelsToWorldUnitsAtDepth(px, depth, fovY, 1200)
    );
  });

  it('returns 0 for invalid viewport height', () => {
    expect(pixelsToWorldUnitsAtDepth(24, 5, Math.PI / 3, 0)).toBe(0);
  });
});


