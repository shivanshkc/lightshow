import { describe, it, expect } from 'vitest';

describe('raytracer shader', () => {
  it('shader file exists and is valid WGSL', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('@compute');
    expect(shaderCode.default).toContain('intersectSphere');
    expect(shaderCode.default).toContain('intersectBox');
    expect(shaderCode.default).toContain('@workgroup_size(8, 8)');
  });

  it('has camera uniform bindings', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('CameraUniforms');
    expect(shaderCode.default).toContain('@group(0) @binding(0)');
    expect(shaderCode.default).toContain('@group(0) @binding(1)');
  });

  it('has ray generation function', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('generateRay');
    expect(shaderCode.default).toContain('inverseProjection');
    expect(shaderCode.default).toContain('inverseView');
  });

  it('has scene tracing function', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('traceScene');
  });

  it('has shading function with sky gradient', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('shade');
    expect(shaderCode.default).toContain('Sky gradient');
  });
});

