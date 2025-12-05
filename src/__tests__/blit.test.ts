import { describe, it, expect } from 'vitest';

describe('blit shader', () => {
  it('shader file exists and has vertex and fragment entry points', async () => {
    const shaderCode = await import('../renderer/shaders/blit.wgsl?raw');
    expect(shaderCode.default).toContain('@vertex');
    expect(shaderCode.default).toContain('@fragment');
    expect(shaderCode.default).toContain('vertexMain');
    expect(shaderCode.default).toContain('fragmentMain');
  });

  it('has texture sampling bindings', async () => {
    const shaderCode = await import('../renderer/shaders/blit.wgsl?raw');
    expect(shaderCode.default).toContain('textureSampler');
    expect(shaderCode.default).toContain('inputTexture');
    expect(shaderCode.default).toContain('@group(0) @binding(0)');
    expect(shaderCode.default).toContain('@group(0) @binding(1)');
  });

  it('uses fullscreen triangle technique', async () => {
    const shaderCode = await import('../renderer/shaders/blit.wgsl?raw');
    // Check for the fullscreen triangle coordinates
    expect(shaderCode.default).toContain('-1.0, -1.0');
    expect(shaderCode.default).toContain('3.0, -1.0');
    expect(shaderCode.default).toContain('-1.0,  3.0');
  });
});

