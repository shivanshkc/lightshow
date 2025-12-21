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

  it('contains triangle intersection function (Möller–Trumbore)', () => {
    expect(raytracerShader).toContain('fn intersectTriangle');
  });

  it('contains ray generation function', () => {
    expect(raytracerShader).toContain('fn generateRay');
  });

  it('contains scene tracing function', () => {
    expect(raytracerShader).toContain('fn traceScene');
  });

  it('contains path tracing function', () => {
    expect(raytracerShader).toContain('fn trace');
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
    expect(raytracerShader).toContain('@binding(4)');
    expect(raytracerShader).toContain('@binding(5)');
    expect(raytracerShader).toContain('sceneHeader');
    expect(raytracerShader).toContain('sceneObjects');
  });

  it('includes mesh tracing buffer bindings (Step 06 plumbing)', () => {
    expect(raytracerShader).toContain('struct MeshMeta');
    expect(raytracerShader).toContain('struct BlasNode');
    expect(raytracerShader).toContain('struct MeshInstance');

    expect(raytracerShader).toContain('@binding(6)');
    expect(raytracerShader).toContain('@binding(7)');
    expect(raytracerShader).toContain('@binding(8)');
    expect(raytracerShader).toContain('@binding(9)');
    expect(raytracerShader).toContain('@binding(10)');
    expect(raytracerShader).toContain('@binding(11)');

    expect(raytracerShader).toContain('meshSceneHeader');
    expect(raytracerShader).toContain('meshMeta');
    expect(raytracerShader).toContain('meshVertices');
    expect(raytracerShader).toContain('meshIndices');
    expect(raytracerShader).toContain('meshBlasNodes');
    expect(raytracerShader).toContain('meshInstances');
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

});

describe('Material System (Stage 5)', () => {
  it('has material type constants', () => {
    expect(raytracerShader).toContain('const MAT_PLASTIC');
    expect(raytracerShader).toContain('const MAT_METAL');
    expect(raytracerShader).toContain('const MAT_GLASS');
    expect(raytracerShader).toContain('const MAT_LIGHT');
  });

  it('has materialType field in SceneObject', () => {
    expect(raytracerShader).toContain('materialType: u32');
  });

  it('has ior field for glass', () => {
    expect(raytracerShader).toContain('ior: f32');
  });

  it('has intensity field for lights', () => {
    expect(raytracerShader).toContain('intensity: f32');
  });

  it('has schlickReflectance function for Fresnel', () => {
    expect(raytracerShader).toContain('fn schlickReflectance');
  });

  it('has refractRay function for glass', () => {
    expect(raytracerShader).toContain('fn refractRay');
  });

  it('uses switch statement for material handling', () => {
    expect(raytracerShader).toContain('switch obj.materialType');
  });

  it('handles MAT_LIGHT case', () => {
    expect(raytracerShader).toContain('case MAT_LIGHT');
    expect(raytracerShader).toContain('obj.intensity');
  });

  it('handles MAT_METAL case', () => {
    expect(raytracerShader).toContain('case MAT_METAL');
    expect(raytracerShader).toContain('reflect(ray.direction, hit.normal)');
  });

  it('handles MAT_GLASS case', () => {
    expect(raytracerShader).toContain('case MAT_GLASS');
    expect(raytracerShader).toContain('obj.ior');
    expect(raytracerShader).toContain('schlickReflectance');
    expect(raytracerShader).toContain('refractRay');
  });

  it('handles MAT_PLASTIC default case', () => {
    expect(raytracerShader).toContain('case MAT_PLASTIC');
    // Plastic is modeled as purely diffuse (Lambertian)
    expect(raytracerShader).toContain('randomCosineHemisphere');
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

describe('Path Tracing (Stage 4)', () => {
  it('has trace function with bounce loop', () => {
    expect(raytracerShader).toContain('fn trace');
    expect(raytracerShader).toContain('for (var bounce');
    expect(raytracerShader).toContain('maxBounces');
  });

  it('implements Russian roulette', () => {
    expect(raytracerShader).toContain('Russian roulette');
  });

  it('has sky sampling function', () => {
    expect(raytracerShader).toContain('fn sampleSky');
  });

  it('has tone mapping (Reinhard)', () => {
    expect(raytracerShader).toContain('Reinhard');
  });

  it('has gamma correction', () => {
    expect(raytracerShader).toContain('Gamma correction');
    expect(raytracerShader).toContain('1.0 / 2.2');
  });

  it('uses accumulation buffer', () => {
    expect(raytracerShader).toContain('accumulationBuffer');
    expect(raytracerShader).toContain('AccumulationData');
  });

  it('has jitter for anti-aliasing', () => {
    expect(raytracerShader).toContain('jitter');
    expect(raytracerShader).toContain('randomFloat2');
  });

  it('clamps fireflies', () => {
    expect(raytracerShader).toContain('fireflies');
    expect(raytracerShader).toContain('min(color, vec3<f32>(10.0))');
  });
});
