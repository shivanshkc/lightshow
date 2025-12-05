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

describe('Path tracing shader', () => {
  it('has trace function with bounce loop', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('fn trace');
    expect(shaderCode.default).toContain('for (var bounce');
    expect(shaderCode.default).toContain('maxBounces');
  });
  
  it('implements Russian roulette', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('Russian roulette');
  });
  
  it('has tone mapping (Reinhard)', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('Reinhard');
  });

  it('has separate read and write accumulation textures (ping-pong)', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('previousAccumulation');
    expect(shaderCode.default).toContain('currentAccumulation');
  });

  it('has RenderSettings struct', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('struct RenderSettings');
    expect(shaderCode.default).toContain('frameIndex');
    expect(shaderCode.default).toContain('maxBounces');
  });

  it('handles emission', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('obj.emission > 0.0');
    expect(shaderCode.default).toContain('emissionColor');
  });
});
