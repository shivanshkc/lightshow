# Stage 5: Materials System

## Objective
Implement the complete material system with diffuse color, roughness-based reflections, transparency with refraction, and light emission. Materials should respond realistically to the lighting system from Stage 4.

---

## Prerequisites
- Stage 4 completed (lighting and shadows working)
- Path tracing accumulation functional

---

## Material Properties Overview

| Property | Range | Effect |
|----------|-------|--------|
| **Color** | RGB [0-1] | Base albedo color of the surface |
| **Roughness** | 0-1 | 0 = perfect mirror, 1 = fully diffuse |
| **Transparency** | 0-1 | 0 = opaque, 1 = fully transparent |
| **IOR** | 1.0-2.5 | Index of refraction (glass ~1.5) |
| **Emission** | 0-∞ | Light emission intensity |
| **EmissionColor** | RGB [0-1] | Color of emitted light |

---

## Updated Type Definitions

### types.ts additions

```typescript
export interface Material {
  color: [number, number, number];
  roughness: number;
  metallic: number;           // NEW: 0 = dielectric, 1 = metal
  transparency: number;
  ior: number;                // NEW: index of refraction
  emission: number;
  emissionColor: [number, number, number];
}

export function createDefaultMaterial(): Material {
  return {
    color: [0.8, 0.8, 0.8],
    roughness: 0.5,
    metallic: 0.0,
    transparency: 0.0,
    ior: 1.5,
    emission: 0.0,
    emissionColor: [1, 1, 1],
  };
}

// Preset materials
export const MATERIAL_PRESETS = {
  default: createDefaultMaterial(),
  
  glass: {
    color: [1.0, 1.0, 1.0],
    roughness: 0.0,
    metallic: 0.0,
    transparency: 0.95,
    ior: 1.5,
    emission: 0.0,
    emissionColor: [1, 1, 1],
  },
  
  mirror: {
    color: [0.95, 0.95, 0.95],
    roughness: 0.0,
    metallic: 1.0,
    transparency: 0.0,
    ior: 1.5,
    emission: 0.0,
    emissionColor: [1, 1, 1],
  },
  
  plastic: {
    color: [0.8, 0.2, 0.2],
    roughness: 0.3,
    metallic: 0.0,
    transparency: 0.0,
    ior: 1.5,
    emission: 0.0,
    emissionColor: [1, 1, 1],
  },
  
  metal: {
    color: [0.9, 0.85, 0.7],
    roughness: 0.2,
    metallic: 1.0,
    transparency: 0.0,
    ior: 1.5,
    emission: 0.0,
    emissionColor: [1, 1, 1],
  },
  
  light: {
    color: [1, 1, 1],
    roughness: 0.5,
    metallic: 0.0,
    transparency: 0.0,
    ior: 1.5,
    emission: 5.0,
    emissionColor: [1, 0.95, 0.9],
  },
} as const;
```

---

## GPU Buffer Layout Update

### SceneObject struct (128 bytes)

```wgsl
struct SceneObject {
  // Transform block (64 bytes)
  position: vec3<f32>,      // 12
  objectType: u32,          // 4
  scale: vec3<f32>,         // 12
  _pad1: f32,               // 4
  rotation: vec3<f32>,      // 12
  _pad2: f32,               // 4
  _transform_pad: vec4<f32>, // 16
  
  // Material block (64 bytes)
  color: vec3<f32>,         // 12
  roughness: f32,           // 4
  emissionColor: vec3<f32>, // 12
  emission: f32,            // 4
  transparency: f32,        // 4
  ior: f32,                 // 4  NEW
  metallic: f32,            // 4  NEW
  _mat_pad1: f32,           // 4
  _material_pad: vec4<f32>, // 16
}
```

---

## WGSL Material Functions

### Material sampling and BRDF

```wgsl
// ============================================
// Fresnel (Schlick approximation)
// ============================================

fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn fresnelSchlickRoughness(cosTheta: f32, F0: vec3<f32>, roughness: f32) -> vec3<f32> {
  return F0 + (max(vec3<f32>(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
}

// ============================================
// Refraction
// ============================================

fn refract_ray(incident: vec3<f32>, normal: vec3<f32>, eta: f32) -> vec3<f32> {
  let cosI = -dot(incident, normal);
  let sinT2 = eta * eta * (1.0 - cosI * cosI);
  
  if (sinT2 > 1.0) {
    // Total internal reflection
    return reflect(incident, normal);
  }
  
  let cosT = sqrt(1.0 - sinT2);
  return eta * incident + (eta * cosI - cosT) * normal;
}

// Schlick approximation for reflectance
fn reflectance(cosine: f32, refIdx: f32) -> f32 {
  var r0 = (1.0 - refIdx) / (1.0 + refIdx);
  r0 = r0 * r0;
  return r0 + (1.0 - r0) * pow(1.0 - cosine, 5.0);
}

// ============================================
// GGX Microfacet Distribution
// ============================================

fn distributionGGX(N: vec3<f32>, H: vec3<f32>, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let NdotH = max(dot(N, H), 0.0);
  let NdotH2 = NdotH * NdotH;
  
  let denom = NdotH2 * (a2 - 1.0) + 1.0;
  return a2 / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, roughness: f32) -> f32 {
  let NdotV = max(dot(N, V), 0.0);
  let NdotL = max(dot(N, L), 0.0);
  return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

// ============================================
// Importance sampling GGX
// ============================================

fn importanceSampleGGX(Xi: vec2<f32>, N: vec3<f32>, roughness: f32) -> vec3<f32> {
  let a = roughness * roughness;
  
  let phi = 2.0 * PI * Xi.x;
  let cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
  let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
  
  // Spherical to cartesian
  let H = vec3<f32>(
    cos(phi) * sinTheta,
    sin(phi) * sinTheta,
    cosTheta
  );
  
  // Tangent space to world space
  var up: vec3<f32>;
  if (abs(N.z) < 0.999) {
    up = vec3<f32>(0.0, 0.0, 1.0);
  } else {
    up = vec3<f32>(1.0, 0.0, 0.0);
  }
  
  let tangent = normalize(cross(up, N));
  let bitangent = cross(N, tangent);
  
  return normalize(tangent * H.x + bitangent * H.y + N * H.z);
}
```

### Updated trace function with full material support

```wgsl
fn trace(primaryRay: Ray, rng: ptr<function, RandomState>) -> vec3<f32> {
  var ray = primaryRay;
  var throughput = vec3<f32>(1.0);
  var radiance = vec3<f32>(0.0);
  
  for (var bounce = 0u; bounce < settings.maxBounces; bounce++) {
    let hit = traceScene(ray);
    
    if (!hit.hit) {
      radiance += throughput * sampleSky(ray.direction);
      break;
    }
    
    let obj = sceneObjects[hit.objectIndex];
    let V = -ray.direction;
    let N = hit.normal;
    
    // Add emission
    if (obj.emission > 0.0) {
      radiance += throughput * obj.emissionColor * obj.emission;
    }
    
    // Handle transparent materials
    if (obj.transparency > 0.0) {
      let eta = select(obj.ior, 1.0 / obj.ior, hit.frontFace);
      let cosTheta = min(dot(V, N), 1.0);
      let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
      
      let cannotRefract = eta * sinTheta > 1.0;
      let fresnel = reflectance(cosTheta, eta);
      
      var direction: vec3<f32>;
      if (cannotRefract || randomFloat(rng) < fresnel) {
        // Reflect
        direction = reflect(-V, N);
      } else {
        // Refract
        direction = refract_ray(-V, N, eta);
      }
      
      // Tint by material color based on transparency
      throughput *= mix(obj.color, vec3<f32>(1.0), obj.transparency);
      
      ray.origin = hit.position + direction * EPSILON * 2.0;
      ray.direction = direction;
      continue;
    }
    
    // Calculate F0 (surface reflectance at zero incidence)
    var F0 = vec3<f32>(0.04);  // Dielectric base
    F0 = mix(F0, obj.color, obj.metallic);
    
    // Sample microfacet normal for specular
    let Xi = randomFloat2(rng);
    let H = importanceSampleGGX(Xi, N, obj.roughness);
    let L_spec = reflect(-V, H);
    
    // Cosine-weighted hemisphere for diffuse
    let L_diff = randomCosineHemisphere(rng, N);
    
    // Choose between diffuse and specular
    let NdotV = max(dot(N, V), 0.0);
    let F = fresnelSchlickRoughness(NdotV, F0, obj.roughness);
    let specularWeight = (F.r + F.g + F.b) / 3.0;
    
    var L: vec3<f32>;
    var pdf: f32;
    
    if (randomFloat(rng) < specularWeight * (1.0 - obj.roughness * 0.5)) {
      // Specular path
      L = L_spec;
      let NdotL = max(dot(N, L), 0.0);
      let NdotH = max(dot(N, H), 0.0);
      let VdotH = max(dot(V, H), 0.0);
      
      let D = distributionGGX(N, H, obj.roughness);
      let G = geometrySmith(N, V, L, obj.roughness);
      
      let specular = (D * G * F) / max(4.0 * NdotV * NdotL, 0.001);
      throughput *= specular * NdotL / max(specularWeight, 0.001);
    } else {
      // Diffuse path
      L = L_diff;
      let NdotL = max(dot(N, L), 0.0);
      
      let kD = (1.0 - F) * (1.0 - obj.metallic);
      throughput *= kD * obj.color;
    }
    
    // Russian roulette
    if (bounce > 3u) {
      let p = max(throughput.x, max(throughput.y, throughput.z));
      if (randomFloat(rng) > p) {
        break;
      }
      throughput /= p;
    }
    
    ray.origin = hit.position + N * EPSILON;
    ray.direction = L;
  }
  
  return radiance;
}
```

---

## Testing Requirements

### Visual Tests

| Test ID | Description | Setup | Expected Result |
|---------|-------------|-------|-----------------|
| T5.1 | Diffuse color | Red sphere, roughness=1 | Matte red sphere |
| T5.2 | Mirror | Silver sphere, roughness=0, metallic=1 | Perfect reflections |
| T5.3 | Glass | Sphere with transparency=0.95, ior=1.5 | Visible refraction, caustics |
| T5.4 | Rough glass | Glass with roughness=0.3 | Frosted glass look |
| T5.5 | Metal | Gold color, metallic=1, roughness=0.2 | Metallic reflections |
| T5.6 | Plastic | Color + roughness=0.3 | Subtle glossy highlights |
| T5.7 | Light source | Emission=5, white | Illuminates scene |
| T5.8 | Colored light | Emission=5, red | Red illumination |
| T5.9 | Total internal reflection | Glass sphere edge | Reflective ring inside |
| T5.10 | Fresnel effect | Glass at grazing angle | More reflective at edges |

### Interaction Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T5.I1 | Color change | Change color in UI | Immediate visual update |
| T5.I2 | Roughness slider | Drag 0→1 | Smooth transition |
| T5.I3 | Transparency slider | Drag 0→1 | Object becomes see-through |
| T5.I4 | Emission toggle | Enable emission | Object starts glowing |

---

## Acceptance Criteria

- [ ] Base color affects surface appearance
- [ ] Roughness=0 produces mirror-like reflections
- [ ] Roughness=1 produces matte/diffuse appearance
- [ ] Metallic=1 produces colored reflections (gold, copper)
- [ ] Transparency creates see-through materials
- [ ] IOR affects refraction angle correctly
- [ ] Glass shows total internal reflection at steep angles
- [ ] Emission makes objects glow and light the scene
- [ ] Emission color affects the color of cast light
- [ ] Material changes reset accumulation and update render

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/core/types.ts` | Add metallic, IOR to Material |
| `src/core/SceneBuffer.ts` | Update GPU layout |
| `src/renderer/shaders/raytracer.wgsl` | Full material BRDF |
| `src/store/sceneStore.ts` | Include new material properties |

---

## Definition of Done

Stage 5 is complete when:
1. All material properties visibly affect rendering
2. Glass materials show realistic refraction
3. Metallic materials have colored reflections
4. Roughness smoothly blends between mirror and diffuse
5. Emissive materials properly illuminate the scene

