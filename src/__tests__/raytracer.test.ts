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

