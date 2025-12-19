# Stage 5: Materials System

## Objective
Implement the material type system with four distinct material types: Plastic (diffuse), Metal (reflective), Glass (transparent with refraction), and Light (emissive). All materials have a color property.

---

## Prerequisites
- Stage 4 completed (lighting and shadows working)
- Path tracing accumulation functional

---

## Material Types Overview

| Type | Description | Properties | Shader Behavior |
|------|-------------|------------|-----------------|
| **Plastic** | Rough diffuse surface | Color | Lambertian reflection, scattered rays |
| **Metal** | Perfectly reflective | Color | Mirror reflection, color tints reflection |
| **Glass** | Transparent with refraction | Color, IOR | Snell's law refraction, Fresnel effect |
| **Light** | Emissive surface | Color, Intensity | Emits light, illuminates scene |

---

## Type Definitions

### types.ts

```typescript
// Material type enum
export type MaterialType = 'plastic' | 'metal' | 'glass' | 'light';

// Material interface
export interface Material {
  type: MaterialType;
  color: [number, number, number];  // RGB 0-1
  // Type-specific properties
  ior: number;        // Glass only: Index of refraction (1.0-2.5)
  intensity: number;  // Light only: Emission intensity (0.1-20)
}

export function createDefaultMaterial(): Material {
  return {
    type: 'plastic',
    color: [0.8, 0.8, 0.8],
    ior: 1.5,
    intensity: 5.0,
  };
}

// Material type helpers
export const MATERIAL_TYPES: { value: MaterialType; label: string }[] = [
  { value: 'plastic', label: 'Plastic' },
  { value: 'metal', label: 'Metal' },
  { value: 'glass', label: 'Glass' },
  { value: 'light', label: 'Light' },
];

// Preset materials for quick selection
export const MATERIAL_PRESETS = {
  redPlastic: {
    type: 'plastic' as const,
    color: [0.8, 0.2, 0.2] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  bluePlastic: {
    type: 'plastic' as const,
    color: [0.2, 0.4, 0.8] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  gold: {
    type: 'metal' as const,
    color: [1.0, 0.84, 0.0] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  silver: {
    type: 'metal' as const,
    color: [0.95, 0.95, 0.95] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  copper: {
    type: 'metal' as const,
    color: [0.72, 0.45, 0.2] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  glass: {
    type: 'glass' as const,
    color: [1.0, 1.0, 1.0] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  diamond: {
    type: 'glass' as const,
    color: [1.0, 1.0, 1.0] as [number, number, number],
    ior: 2.4,
    intensity: 5.0,
  },
  warmLight: {
    type: 'light' as const,
    color: [1.0, 0.95, 0.8] as [number, number, number],
    ior: 1.5,
    intensity: 10.0,
  },
  coolLight: {
    type: 'light' as const,
    color: [0.8, 0.9, 1.0] as [number, number, number],
    ior: 1.5,
    intensity: 10.0,
  },
};

// Validation
export function validateMaterial(mat: Partial<Material>): Material {
  const def = createDefaultMaterial();
  return {
    type: mat.type ?? def.type,
    color: mat.color ?? def.color,
    ior: clamp(mat.ior ?? def.ior, 1.0, 2.5),
    intensity: clamp(mat.intensity ?? def.intensity, 0.1, 20.0),
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
```

---

## GPU Buffer Layout

### SceneObject struct (128 bytes)

```wgsl
// Material type constants
const MAT_PLASTIC: u32 = 0u;
const MAT_METAL: u32 = 1u;
const MAT_GLASS: u32 = 2u;
const MAT_LIGHT: u32 = 3u;

struct SceneObject {
  // Transform block (64 bytes)
  position: vec3<f32>,      // 12
  objectType: u32,          // 4  (0 = sphere, 1 = cuboid)
  scale: vec3<f32>,         // 12
  _pad1: f32,               // 4
  rotation: vec3<f32>,      // 12
  _pad2: f32,               // 4
  _transform_pad: vec4<f32>, // 16
  
  // Material block (64 bytes)
  color: vec3<f32>,         // 12
  materialType: u32,        // 4  (0=plastic, 1=metal, 2=glass, 3=light)
  ior: f32,                 // 4  (glass IOR)
  intensity: f32,           // 4  (light intensity)
  _mat_pad1: vec2<f32>,     // 8
  _material_pad: vec3<vec4<f32>>, // 48
}
```

---

## WGSL Shader Implementation

### Material handling functions

```wgsl
// ============================================
// Refraction (Snell's Law)
// ============================================

fn refractRay(incident: vec3<f32>, normal: vec3<f32>, eta: f32) -> vec3<f32> {
  let cosI = -dot(incident, normal);
  let sinT2 = eta * eta * (1.0 - cosI * cosI);
  
  // Total internal reflection
  if (sinT2 > 1.0) {
    return reflect(incident, normal);
  }
  
  let cosT = sqrt(1.0 - sinT2);
  return eta * incident + (eta * cosI - cosT) * normal;
}

// Schlick approximation for Fresnel reflectance
fn schlickReflectance(cosine: f32, refIdx: f32) -> f32 {
  var r0 = (1.0 - refIdx) / (1.0 + refIdx);
  r0 = r0 * r0;
  return r0 + (1.0 - r0) * pow(1.0 - cosine, 5.0);
}

// ============================================
// Random hemisphere sampling (for Plastic)
// ============================================

fn randomCosineHemisphere(rng: ptr<function, u32>, normal: vec3<f32>) -> vec3<f32> {
  let r1 = randomFloat(rng);
  let r2 = randomFloat(rng);
  
  let phi = 2.0 * PI * r1;
  let cosTheta = sqrt(r2);
  let sinTheta = sqrt(1.0 - r2);
  
  // Create orthonormal basis
  var up: vec3<f32>;
  if (abs(normal.y) < 0.999) {
    up = vec3<f32>(0.0, 1.0, 0.0);
  } else {
    up = vec3<f32>(1.0, 0.0, 0.0);
  }
  let tangent = normalize(cross(up, normal));
  let bitangent = cross(normal, tangent);
  
  // Transform to world space
  return normalize(
    tangent * cos(phi) * sinTheta +
    bitangent * sin(phi) * sinTheta +
    normal * cosTheta
  );
}
```

### Main trace function with material types

```wgsl
fn trace(primaryRay: Ray, rng: ptr<function, u32>) -> vec3<f32> {
  var ray = primaryRay;
  var throughput = vec3<f32>(1.0);
  var radiance = vec3<f32>(0.0);
  
  for (var bounce = 0u; bounce < settings.maxBounces; bounce++) {
    let hit = traceScene(ray);
    
    if (!hit.hit) {
      // Sky/environment
      radiance += throughput * sampleSky(ray.direction);
      break;
    }
    
    let obj = sceneObjects[hit.objectIndex];
    let V = -ray.direction;  // View direction (toward camera)
    var N = hit.normal;      // Surface normal
    
    // Ensure normal faces the ray
    let frontFace = dot(ray.direction, N) < 0.0;
    if (!frontFace) {
      N = -N;
    }
    
    switch (obj.materialType) {
      // ========== LIGHT ==========
      case MAT_LIGHT: {
        radiance += throughput * obj.color * obj.intensity;
        // Light sources terminate the ray
        return radiance;
      }
      
      // ========== PLASTIC ==========
      case MAT_PLASTIC: {
        // Lambertian diffuse reflection
        let direction = randomCosineHemisphere(rng, N);
        throughput *= obj.color;
        
        ray.origin = hit.position + N * EPSILON;
        ray.direction = direction;
      }
      
      // ========== METAL ==========
      case MAT_METAL: {
        // Perfect mirror reflection
        let direction = reflect(-V, N);
        throughput *= obj.color;  // Tint reflection by metal color
        
        ray.origin = hit.position + N * EPSILON;
        ray.direction = direction;
      }
      
      // ========== GLASS ==========
      case MAT_GLASS: {
        let eta = select(obj.ior, 1.0 / obj.ior, frontFace);
        let cosTheta = min(dot(V, N), 1.0);
        let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
        
        let cannotRefract = eta * sinTheta > 1.0;
        let fresnel = schlickReflectance(cosTheta, eta);
        
        var direction: vec3<f32>;
        if (cannotRefract || randomFloat(rng) < fresnel) {
          // Reflect
          direction = reflect(-V, N);
        } else {
          // Refract
          direction = refractRay(-V, N, eta);
        }
        
        // Glass tints light passing through
        throughput *= obj.color;
        
        ray.origin = hit.position + direction * EPSILON * 2.0;
        ray.direction = direction;
      }
      
      default: {
        // Fallback to plastic
        let direction = randomCosineHemisphere(rng, N);
        throughput *= obj.color;
        ray.origin = hit.position + N * EPSILON;
        ray.direction = direction;
      }
    }
    
    // Russian roulette for path termination
    if (bounce > 3u) {
      let p = max(throughput.x, max(throughput.y, throughput.z));
      if (randomFloat(rng) > p) {
        break;
      }
      throughput /= p;
    }
  }
  
  return radiance;
}
```

---

## SceneBuffer Update

### SceneBuffer.ts changes

```typescript
// Update writeObject to include new material properties
private writeObject(view: DataView, offset: number, obj: SceneObject): void {
  // ... position, scale, rotation as before ...
  
  // Material block (starting at offset + 64)
  const matOffset = offset + 64;
  
  // Color (vec3 = 12 bytes)
  view.setFloat32(matOffset + 0, obj.material.color[0], true);
  view.setFloat32(matOffset + 4, obj.material.color[1], true);
  view.setFloat32(matOffset + 8, obj.material.color[2], true);
  
  // Material type (u32 = 4 bytes)
  const typeMap: Record<MaterialType, number> = {
    plastic: 0,
    metal: 1,
    glass: 2,
    light: 3,
  };
  view.setUint32(matOffset + 12, typeMap[obj.material.type], true);
  
  // IOR (f32 = 4 bytes)
  view.setFloat32(matOffset + 16, obj.material.ior, true);
  
  // Intensity (f32 = 4 bytes)
  view.setFloat32(matOffset + 20, obj.material.intensity, true);
}
```

---

## Testing Requirements

### Visual Tests

| Test ID | Description | Setup | Expected Result |
|---------|-------------|-------|-----------------|
| T5.1 | Plastic diffuse | Red plastic sphere | Matte red sphere, soft shadows |
| T5.2 | Metal reflection | Silver metal sphere | Perfect mirror reflections |
| T5.3 | Metal color tint | Gold metal sphere | Golden-tinted reflections |
| T5.4 | Glass refraction | Clear glass sphere, IOR=1.5 | Visible refraction, inverted background |
| T5.5 | Glass with color | Blue tinted glass | Blue-tinted transparency |
| T5.6 | Glass IOR variation | Sphere with IOR=2.4 | Stronger refraction (diamond-like) |
| T5.7 | Light emission | White light sphere | Illuminates nearby objects |
| T5.8 | Colored light | Red light sphere | Red illumination on scene |
| T5.9 | Total internal reflection | Glass sphere edge | Reflective ring at steep angles |
| T5.10 | Fresnel on glass | Glass at grazing angle | More reflective at edges |

### Interaction Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T5.I1 | Change material type | Select object → change type dropdown | Immediate visual update |
| T5.I2 | Color change | Change color picker | Surface color updates |
| T5.I3 | Glass IOR | Adjust IOR slider | Refraction amount changes |
| T5.I4 | Light intensity | Adjust intensity slider | Brightness changes |

---

## Acceptance Criteria

- [ ] Plastic materials show diffuse, matte appearance
- [ ] Metal materials show perfect mirror reflections
- [ ] Metal color tints the reflection correctly
- [ ] Glass materials show refraction
- [ ] Glass IOR affects refraction angle correctly
- [ ] Glass shows Fresnel effect (more reflective at edges)
- [ ] Glass shows total internal reflection at steep angles
- [ ] Light materials glow and illuminate the scene
- [ ] Light intensity affects brightness
- [ ] Light color affects illumination color
- [ ] Material type changes reset accumulation and update render

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/core/types.ts` | Add MaterialType, update Material interface |
| `src/core/SceneBuffer.ts` | Update GPU layout for new material properties |
| `src/renderer/shaders/raytracer.wgsl` | Material type switch, refraction, reflection |
| `src/store/sceneStore.ts` | Support new material properties |

---

## Definition of Done

Stage 5 is complete when:
1. All four material types work correctly
2. Glass shows realistic refraction with Fresnel
3. Metal shows perfect reflections with color tinting
4. Light materials properly illuminate the scene
5. Material changes update the render in real-time
