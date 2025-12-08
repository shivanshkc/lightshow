import { describe, it, expect } from 'vitest';
import blitShader from '../renderer/shaders/blit.wgsl?raw';

describe('Blit Shader', () => {
  it('shader file exists and has content', () => {
    expect(blitShader).toBeDefined();
    expect(blitShader.length).toBeGreaterThan(0);
  });

  it('contains vertex entry point', () => {
    expect(blitShader).toContain('@vertex');
    expect(blitShader).toContain('fn vertexMain');
  });

  it('contains fragment entry point', () => {
    expect(blitShader).toContain('@fragment');
    expect(blitShader).toContain('fn fragmentMain');
  });

  it('defines vertex output struct', () => {
    expect(blitShader).toContain('struct VertexOutput');
    expect(blitShader).toContain('@builtin(position)');
    expect(blitShader).toContain('@location(0)');
  });

  it('uses sampler and texture bindings', () => {
    expect(blitShader).toContain('textureSampler: sampler');
    expect(blitShader).toContain('texture_2d<f32>');
    expect(blitShader).toContain('textureSample');
  });

  it('uses fullscreen triangle technique', () => {
    // Fullscreen triangle uses oversized coordinates
    expect(blitShader).toContain('3.0');
    expect(blitShader).toContain('-1.0');
  });
});

