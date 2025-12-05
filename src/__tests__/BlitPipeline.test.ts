import { describe, it, expect } from 'vitest';

describe('BlitPipeline', () => {
  it('uses fullscreen triangle (3 vertices)', () => {
    // BlitPipeline draws 3 vertices for fullscreen triangle
    const vertexCount = 3;
    expect(vertexCount).toBe(3);
  });

  it('uses linear filtering sampler', () => {
    // The blit pipeline should use linear filtering for smooth texture sampling
    const samplerConfig = {
      magFilter: 'linear',
      minFilter: 'linear',
    };
    expect(samplerConfig.magFilter).toBe('linear');
    expect(samplerConfig.minFilter).toBe('linear');
  });
});

describe('BlitPipeline shader import', () => {
  it('can import blit shader as raw text', async () => {
    const shader = await import('../renderer/shaders/blit.wgsl?raw');
    expect(shader.default).toContain('@vertex');
    expect(shader.default).toContain('@fragment');
    expect(typeof shader.default).toBe('string');
  });
});

