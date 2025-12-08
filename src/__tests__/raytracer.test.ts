import { describe, it, expect } from 'vitest';
import raytracerShader from '../renderer/shaders/raytracer.wgsl?raw';

describe('Raytracer Shader', () => {
  it('shader file exists and has content', () => {
    expect(raytracerShader).toBeDefined();
    expect(raytracerShader.length).toBeGreaterThan(0);
  });

  it('contains compute entry point', () => {
    expect(raytracerShader).toContain('@compute');
    expect(raytracerShader).toContain('@workgroup_size');
    expect(raytracerShader).toContain('fn main');
  });

  it('contains sphere intersection function', () => {
    expect(raytracerShader).toContain('fn intersectSphere');
  });

  it('contains box intersection function', () => {
    expect(raytracerShader).toContain('fn intersectBox');
  });

  it('contains ray generation function', () => {
    expect(raytracerShader).toContain('fn generateRay');
  });

  it('contains scene tracing function', () => {
    expect(raytracerShader).toContain('fn traceScene');
  });

  it('contains shading function', () => {
    expect(raytracerShader).toContain('fn shade');
  });

  it('defines camera uniforms struct', () => {
    expect(raytracerShader).toContain('struct CameraUniforms');
    expect(raytracerShader).toContain('inverseProjection');
    expect(raytracerShader).toContain('inverseView');
  });

  it('defines ray and hit record structs', () => {
    expect(raytracerShader).toContain('struct Ray');
    expect(raytracerShader).toContain('struct HitRecord');
  });

  it('uses storage texture for output', () => {
    expect(raytracerShader).toContain('texture_storage_2d<rgba8unorm, write>');
    expect(raytracerShader).toContain('textureStore');
  });
});

describe('Dynamic Scene Data (Stage 3)', () => {
  it('has SceneHeader struct', () => {
    expect(raytracerShader).toContain('struct SceneHeader');
    expect(raytracerShader).toContain('objectCount');
  });

  it('has SceneObject struct', () => {
    expect(raytracerShader).toContain('struct SceneObject');
    expect(raytracerShader).toContain('objectType');
  });

  it('has scene buffer bindings', () => {
    expect(raytracerShader).toContain('@binding(2)');
    expect(raytracerShader).toContain('@binding(3)');
    expect(raytracerShader).toContain('sceneHeader');
    expect(raytracerShader).toContain('sceneObjects');
  });

  it('reads from sceneObjects array', () => {
    expect(raytracerShader).toContain('sceneObjects: array<SceneObject>');
  });

  it('has rotation matrix function', () => {
    expect(raytracerShader).toContain('fn rotationMatrix');
  });

  it('has HitResult struct with objectIndex', () => {
    expect(raytracerShader).toContain('struct HitResult');
    expect(raytracerShader).toContain('objectIndex');
  });

  it('uses object color for shading', () => {
    expect(raytracerShader).toContain('obj.color');
  });

  it('supports emission', () => {
    expect(raytracerShader).toContain('obj.emission');
    expect(raytracerShader).toContain('obj.emissionColor');
  });
});

describe('Random Number Generation (Stage 4)', () => {
  it('has PCG hash function', () => {
    expect(raytracerShader).toContain('fn pcg_hash');
    expect(raytracerShader).toContain('747796405u');
  });

  it('has initRandom function', () => {
    expect(raytracerShader).toContain('fn initRandom');
  });

  it('has randomFloat function', () => {
    expect(raytracerShader).toContain('fn randomFloat');
  });

  it('has cosine hemisphere sampling', () => {
    expect(raytracerShader).toContain('fn randomCosineHemisphere');
  });

  it('has PI constant', () => {
    expect(raytracerShader).toContain('const PI');
  });

  it('has EPSILON constant', () => {
    expect(raytracerShader).toContain('const EPSILON');
  });
});
