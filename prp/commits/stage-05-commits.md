# Stage 5: Materials System — Commits

## Overview
**Total Commits:** 4  
**Stage Goal:** Complete PBR material system with roughness, metallic, transparency, emission.

---

## Commit 5.1: Add material presets and validation

### Description
Create material presets and validation helpers.

### Files to Modify
```
src/core/types.ts
src/__tests__/materials.test.ts
```

### Key Implementation
```typescript
// types.ts additions
export const MATERIAL_PRESETS = {
  default: createDefaultMaterial(),
  glass: { color: [1,1,1], roughness: 0, metallic: 0, transparency: 0.95, ior: 1.5, emission: 0, emissionColor: [1,1,1] },
  mirror: { color: [0.95,0.95,0.95], roughness: 0, metallic: 1, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1,1,1] },
  plastic: { color: [0.8,0.2,0.2], roughness: 0.3, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1,1,1] },
  metal: { color: [0.9,0.85,0.7], roughness: 0.2, metallic: 1, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1,1,1] },
  light: { color: [1,1,1], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 5, emissionColor: [1,0.95,0.9] },
} as const;

export function validateMaterial(mat: Partial<Material>): Material {
  const def = createDefaultMaterial();
  return {
    color: mat.color ?? def.color,
    roughness: clamp(mat.roughness ?? def.roughness, 0, 1),
    metallic: clamp(mat.metallic ?? def.metallic, 0, 1),
    transparency: clamp(mat.transparency ?? def.transparency, 0, 1),
    ior: clamp(mat.ior ?? def.ior, 1, 2.5),
    emission: Math.max(0, mat.emission ?? def.emission),
    emissionColor: mat.emissionColor ?? def.emissionColor,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
```

### Test Cases
```typescript
describe('Material Presets', () => {
  it('glass has high transparency', () => {
    expect(MATERIAL_PRESETS.glass.transparency).toBeGreaterThan(0.9);
  });
  
  it('mirror has zero roughness', () => {
    expect(MATERIAL_PRESETS.mirror.roughness).toBe(0);
  });
  
  it('metal has metallic = 1', () => {
    expect(MATERIAL_PRESETS.metal.metallic).toBe(1);
  });
  
  it('light has emission > 0', () => {
    expect(MATERIAL_PRESETS.light.emission).toBeGreaterThan(0);
  });
});

describe('validateMaterial', () => {
  it('clamps roughness to 0-1', () => {
    expect(validateMaterial({ roughness: 2 }).roughness).toBe(1);
    expect(validateMaterial({ roughness: -1 }).roughness).toBe(0);
  });
  
  it('clamps IOR to 1-2.5', () => {
    expect(validateMaterial({ ior: 0.5 }).ior).toBe(1);
    expect(validateMaterial({ ior: 3 }).ior).toBe(2.5);
  });
  
  it('uses defaults for missing properties', () => {
    const mat = validateMaterial({});
    expect(mat.color).toBeDefined();
    expect(mat.roughness).toBeDefined();
  });
});
```

### Commit Message
```
feat(core): add material presets and validation
```

---

## Commit 5.2: Implement Fresnel and GGX in shader

### Description
Add physically-based BRDF functions to shader.

### Files to Modify
```
src/renderer/shaders/raytracer.wgsl
```

### Key Implementation
```wgsl
const PI: f32 = 3.14159265359;

// Fresnel-Schlick
fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

// GGX Distribution
fn distributionGGX(N: vec3<f32>, H: vec3<f32>, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let NdotH = max(dot(N, H), 0.0);
  let denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / (PI * denom * denom);
}

// Geometry (Smith)
fn geometrySmith(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, roughness: f32) -> f32 {
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  let NdotV = max(dot(N, V), 0.0);
  let NdotL = max(dot(N, L), 0.0);
  let ggx1 = NdotV / (NdotV * (1.0 - k) + k);
  let ggx2 = NdotL / (NdotL * (1.0 - k) + k);
  return ggx1 * ggx2;
}

// Importance sample GGX
fn importanceSampleGGX(Xi: vec2<f32>, N: vec3<f32>, roughness: f32) -> vec3<f32> {
  let a = roughness * roughness;
  let phi = 2.0 * PI * Xi.x;
  let cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
  let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
  // ... transform to world space
}
```

### Test Cases
```typescript
describe('PBR shader functions', () => {
  it('has fresnelSchlick function', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('fresnelSchlick');
  });
  
  it('has GGX distribution', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('distributionGGX');
  });
  
  it('has geometry function', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('geometrySmith');
  });
  
  it('has importance sampling', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('importanceSampleGGX');
  });
});
```

### Commit Message
```
feat(shaders): implement Fresnel and GGX microfacet BRDF
```

---

## Commit 5.3: Implement refraction for transparent materials

### Description
Add refraction with IOR for glass-like materials.

### Files to Modify
```
src/renderer/shaders/raytracer.wgsl
```

### Key Implementation
```wgsl
// Snell's law refraction
fn refractRay(incident: vec3<f32>, normal: vec3<f32>, eta: f32) -> vec3<f32> {
  let cosI = -dot(incident, normal);
  let sinT2 = eta * eta * (1.0 - cosI * cosI);
  
  if (sinT2 > 1.0) {
    return reflect(incident, normal); // Total internal reflection
  }
  
  let cosT = sqrt(1.0 - sinT2);
  return eta * incident + (eta * cosI - cosT) * normal;
}

// Schlick reflectance approximation
fn reflectance(cosine: f32, refIdx: f32) -> f32 {
  var r0 = (1.0 - refIdx) / (1.0 + refIdx);
  r0 = r0 * r0;
  return r0 + (1.0 - r0) * pow(1.0 - cosine, 5.0);
}

// In trace function, handle transparent materials:
if (obj.transparency > 0.0) {
  let eta = select(obj.ior, 1.0 / obj.ior, hit.frontFace);
  let cosTheta = min(dot(V, N), 1.0);
  let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
  
  let cannotRefract = eta * sinTheta > 1.0;
  let fresnel = reflectance(cosTheta, eta);
  
  if (cannotRefract || randomFloat(rng) < fresnel) {
    direction = reflect(-V, N);
  } else {
    direction = refractRay(-V, N, eta);
  }
  
  throughput *= mix(obj.color, vec3(1.0), obj.transparency);
  // Continue ray through material
}
```

### Test Cases
```typescript
describe('Refraction shader', () => {
  it('has refractRay function', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('refractRay');
  });
  
  it('handles total internal reflection', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('Total internal reflection');
  });
  
  it('uses IOR for refraction', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('obj.ior');
  });
});
```

### Commit Message
```
feat(shaders): implement refraction with IOR for glass materials
```

---

## Commit 5.4: Integrate full material system in trace

### Description
Complete material handling in trace function with all properties.

### Key Implementation
```wgsl
fn trace(primaryRay: Ray, rng: ptr<function, u32>) -> vec3<f32> {
  var ray = primaryRay;
  var throughput = vec3<f32>(1.0);
  var radiance = vec3<f32>(0.0);
  
  for (var bounce = 0u; bounce < settings.maxBounces; bounce++) {
    let hit = traceScene(ray);
    if (!hit.hit) { radiance += throughput * sampleSky(ray.direction); break; }
    
    let obj = sceneObjects[hit.objectIndex];
    let V = -ray.direction;
    let N = hit.normal;
    
    // Emission
    if (obj.emission > 0.0) {
      radiance += throughput * obj.emissionColor * obj.emission;
    }
    
    // Transparent material
    if (obj.transparency > 0.0) {
      // ... refraction handling (commit 5.3)
      continue;
    }
    
    // Calculate F0 for metals/dielectrics
    var F0 = vec3<f32>(0.04);
    F0 = mix(F0, obj.color, obj.metallic);
    
    // Sample direction based on roughness
    let Xi = vec2<f32>(randomFloat(rng), randomFloat(rng));
    let H = importanceSampleGGX(Xi, N, obj.roughness);
    let L_spec = reflect(-V, H);
    let L_diff = randomCosineHemisphere(rng, N);
    
    // Fresnel determines spec vs diffuse
    let NdotV = max(dot(N, V), 0.0);
    let F = fresnelSchlick(NdotV, F0);
    let specWeight = (F.r + F.g + F.b) / 3.0;
    
    var L: vec3<f32>;
    if (randomFloat(rng) < specWeight * (1.0 - obj.roughness * 0.5)) {
      L = L_spec;
      // Apply specular BRDF
      let NdotL = max(dot(N, L), 0.0);
      let D = distributionGGX(N, H, obj.roughness);
      let G = geometrySmith(N, V, L, obj.roughness);
      throughput *= (D * G * F) / max(4.0 * NdotV * NdotL, 0.001) * NdotL / max(specWeight, 0.001);
    } else {
      L = L_diff;
      let kD = (1.0 - F) * (1.0 - obj.metallic);
      throughput *= kD * obj.color;
    }
    
    // Russian roulette, update ray
    // ...
  }
  return radiance;
}
```

### Test Cases
```typescript
describe('Full material integration', () => {
  it('uses all material properties', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('obj.roughness');
    expect(code.default).toContain('obj.metallic');
    expect(code.default).toContain('obj.transparency');
    expect(code.default).toContain('obj.emission');
    expect(code.default).toContain('obj.color');
  });
});
```

### Manual Testing
1. Add sphere, set roughness=0 → mirror reflection
2. Set roughness=1 → matte diffuse
3. Set transparency=0.9, ior=1.5 → glass with refraction
4. Set metallic=1, color=gold → metallic reflection
5. Set emission=5 → glowing light source

### Commit Message
```
feat(shaders): integrate complete PBR material system

Stage 5 complete: Full material support with PBR
```

---

## Stage 5 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 5.1 | Material presets | Validation, presets |
| 5.2 | Fresnel/GGX | BRDF functions |
| 5.3 | Refraction | Glass, IOR, TIR |
| 5.4 | Full integration | All properties used |

