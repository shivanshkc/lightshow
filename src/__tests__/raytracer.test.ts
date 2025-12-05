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

describe('raytracer shader - dynamic scene', () => {
  it('has SceneHeader struct', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('struct SceneHeader');
    expect(shaderCode.default).toContain('objectCount: u32');
  });

  it('has SceneObject struct', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('struct SceneObject');
    expect(shaderCode.default).toContain('objectType: u32');
  });

  it('reads from sceneObjects array', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('sceneObjects: array<SceneObject>');
  });

  it('has scene buffer bindings', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('@group(0) @binding(2)');
    expect(shaderCode.default).toContain('@group(0) @binding(3)');
  });

  it('has rotation matrix function', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('rotationMatrix');
  });

  it('iterates over objects in traceScene', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('sceneHeader.objectCount');
    expect(shaderCode.default).toContain('for (var i = 0u;');
  });
});

describe('Random shader functions', () => {
  it('shader contains PCG hash function', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('pcg_hash');
  });
  
  it('shader contains randomFloat function', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('randomFloat');
  });
  
  it('shader contains hemisphere sampling', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('randomCosineHemisphere');
  });

  it('shader initializes random state', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('initRandom');
  });
});
