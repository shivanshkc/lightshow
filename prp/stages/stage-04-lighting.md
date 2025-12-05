# Stage 4: Lighting & Shadows

## Objective
Implement physically-based lighting with direct illumination, shadows, and basic global illumination through path tracing. This transforms the flat-shaded scene into a realistic render.

---

## Prerequisites
- Stage 3 completed (dynamic scene data working)
- Objects render with correct colors and positions

---

## Lighting Model Overview

```
┌─────────────────────────────────────────────────┐
│                  DIRECT LIGHTING                │
│  ┌──────────┐    ┌─────────┐    ┌──────────┐   │
│  │ Surface  │───▶│ Shadow  │───▶│  Light   │   │
│  │  Point   │    │  Ray    │    │  Source  │   │
│  └──────────┘    └─────────┘    └──────────┘   │
└─────────────────────────────────────────────────┘
                      +
┌─────────────────────────────────────────────────┐
│              INDIRECT LIGHTING (GI)             │
│  ┌──────────┐    ┌─────────┐    ┌──────────┐   │
│  │ Surface  │───▶│ Bounce  │───▶│ Another  │   │
│  │  Point   │    │  Ray    │    │ Surface  │   │
│  └──────────┘    └─────────┘    └──────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Project Structure Changes

```
src/
├── renderer/
│   ├── shaders/
│   │   ├── raytracer.wgsl    # MAJOR UPDATE: full lighting
│   │   ├── common.wgsl       # NEW: shared functions
│   │   └── random.wgsl       # NEW: RNG for path tracing
│   ├── RaytracingPipeline.ts # UPDATE: accumulation buffer
│   └── Renderer.ts           # UPDATE: sample accumulation
├── core/
│   └── types.ts              # ADD: render settings
```

---

## Detailed Requirements

### 4.1 Random Number Generation (random.wgsl)

Path tracing requires random sampling. Implement PCG-based RNG.

```wgsl
// PCG Random Number Generator
// State should be per-pixel and change each frame

struct RandomState {
  state: u32,
}

fn pcg_hash(input: u32) -> u32 {
  var state = input * 747796405u + 2891336453u;
  var word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

fn initRandom(pixelCoord: vec2<u32>, frameIndex: u32) -> RandomState {
  var rng: RandomState;
  rng.state = pcg_hash(pixelCoord.x + pcg_hash(pixelCoord.y + pcg_hash(frameIndex)));
  return rng;
}

fn randomFloat(rng: ptr<function, RandomState>) -> f32 {
  (*rng).state = pcg_hash((*rng).state);
  return f32((*rng).state) / f32(0xFFFFFFFFu);
}

fn randomFloat2(rng: ptr<function, RandomState>) -> vec2<f32> {
  return vec2<f32>(randomFloat(rng), randomFloat(rng));
}

fn randomFloat3(rng: ptr<function, RandomState>) -> vec3<f32> {
  return vec3<f32>(randomFloat(rng), randomFloat(rng), randomFloat(rng));
}

// Cosine-weighted hemisphere sampling (for diffuse surfaces)
fn randomCosineHemisphere(rng: ptr<function, RandomState>, normal: vec3<f32>) -> vec3<f32> {
  let r1 = randomFloat(rng);
  let r2 = randomFloat(rng);
  
  let phi = 2.0 * 3.14159265359 * r1;
  let cosTheta = sqrt(r2);
  let sinTheta = sqrt(1.0 - r2);
  
  // Create local coordinate system
  var tangent: vec3<f32>;
  if (abs(normal.x) > 0.9) {
    tangent = normalize(cross(vec3<f32>(0.0, 1.0, 0.0), normal));
  } else {
    tangent = normalize(cross(vec3<f32>(1.0, 0.0, 0.0), normal));
  }
  let bitangent = cross(normal, tangent);
  
  // Transform to world space
  return normalize(
    tangent * cos(phi) * sinTheta +
    bitangent * sin(phi) * sinTheta +
    normal * cosTheta
  );
}

// Uniform sphere sampling (for area lights)
fn randomOnSphere(rng: ptr<function, RandomState>) -> vec3<f32> {
  let u = randomFloat(rng);
  let v = randomFloat(rng);
  
  let theta = 2.0 * 3.14159265359 * u;
  let phi = acos(2.0 * v - 1.0);
  
  return vec3<f32>(
    sin(phi) * cos(theta),
    sin(phi) * sin(theta),
    cos(phi)
  );
}
```

### 4.2 Accumulation Buffer

For progressive rendering, accumulate samples over multiple frames.

**RenderSettings uniform (add to types.ts):**

```typescript
export interface RenderSettings {
  frameIndex: number;       // Increments each frame (reset on scene change)
  samplesPerPixel: number;  // Samples per frame (usually 1 for interactive)
  maxBounces: number;       // Maximum ray bounces
  accumulate: boolean;      // Whether to accumulate or reset
}
```

**GPU Uniform layout:**
```wgsl
struct RenderSettings {
  frameIndex: u32,
  samplesPerPixel: u32,
  maxBounces: u32,
  flags: u32,  // bit 0: accumulate
}
```

**Accumulation texture:**
- Format: `rgba32float` (high precision for accumulation)
- Usage: `STORAGE_BINDING | TEXTURE_BINDING`
- Separate from output texture

### 4.3 Updated RaytracingPipeline.ts

Add accumulation buffer and frame index tracking.

```typescript
class RaytracingPipeline {
  // ... existing members ...
  
  private accumulationTexture: GPUTexture | null = null;
  private accumulationTextureView: GPUTextureView | null = null;
  private settingsBuffer: GPUBuffer;
  private frameIndex: number = 0;
  
  resizeOutput(width: number, height: number): void {
    // ... create output texture as before ...
    
    // Create accumulation texture (rgba32float for precision)
    this.accumulationTexture = this.device.createTexture({
      size: { width, height },
      format: 'rgba32float',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.accumulationTextureView = this.accumulationTexture.createView();
    
    // Reset accumulation on resize
    this.resetAccumulation();
  }
  
  resetAccumulation(): void {
    this.frameIndex = 0;
  }
  
  updateSettings(): void {
    const data = new Uint32Array([
      this.frameIndex,
      1,  // samples per pixel per frame
      8,  // max bounces
      1,  // accumulate = true
    ]);
    this.device.queue.writeBuffer(this.settingsBuffer, 0, data);
  }
  
  dispatch(commandEncoder: GPUCommandEncoder): void {
    this.updateSettings();
    
    // ... dispatch compute pass ...
    
    this.frameIndex++;
  }
}
```

### 4.4 Main Raytracing Shader (raytracer.wgsl)

Complete path tracing implementation.

```wgsl
// ============================================
// Constants
// ============================================

const PI: f32 = 3.14159265359;
const EPSILON: f32 = 0.001;
const MAX_FLOAT: f32 = 3.402823466e+38;

// ============================================
// Bindings
// ============================================

struct CameraUniforms {
  inverseProjection: mat4x4<f32>,
  inverseView: mat4x4<f32>,
  position: vec3<f32>,
}

struct RenderSettings {
  frameIndex: u32,
  samplesPerPixel: u32,
  maxBounces: u32,
  flags: u32,
}

struct SceneHeader {
  objectCount: u32,
  _pad: vec3<u32>,
}

struct SceneObject {
  position: vec3<f32>,
  objectType: u32,
  scale: vec3<f32>,
  _pad1: f32,
  rotation: vec3<f32>,
  _pad2: f32,
  _transform_pad: vec4<f32>,
  
  color: vec3<f32>,
  roughness: f32,
  emissionColor: vec3<f32>,
  emission: f32,
  transparency: f32,
  _mat_pad: vec3<f32>,
  _material_pad: vec4<f32>,
}

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var<uniform> settings: RenderSettings;
@group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var accumulationTexture: texture_storage_2d<rgba32float, read_write>;
@group(0) @binding(4) var<storage, read> sceneHeader: SceneHeader;
@group(0) @binding(5) var<storage, read> sceneObjects: array<SceneObject>;

// ============================================
// Include random functions here
// ============================================
// (Copy the random.wgsl content here or use WGSL includes if supported)

// ============================================
// Ray and Hit Structures
// ============================================

struct Ray {
  origin: vec3<f32>,
  direction: vec3<f32>,
}

struct HitResult {
  hit: bool,
  t: f32,
  position: vec3<f32>,
  normal: vec3<f32>,
  frontFace: bool,
  objectIndex: i32,
}

// ============================================
// Intersection Functions
// ============================================

fn intersectSphere(ray: Ray, center: vec3<f32>, radius: f32) -> HitResult {
  var result: HitResult;
  result.hit = false;
  
  let oc = ray.origin - center;
  let a = dot(ray.direction, ray.direction);
  let halfB = dot(oc, ray.direction);
  let c = dot(oc, oc) - radius * radius;
  let discriminant = halfB * halfB - a * c;
  
  if (discriminant < 0.0) {
    return result;
  }
  
  let sqrtD = sqrt(discriminant);
  var t = (-halfB - sqrtD) / a;
  
  if (t < EPSILON) {
    t = (-halfB + sqrtD) / a;
  }
  
  if (t < EPSILON) {
    return result;
  }
  
  result.hit = true;
  result.t = t;
  result.position = ray.origin + t * ray.direction;
  let outwardNormal = (result.position - center) / radius;
  result.frontFace = dot(ray.direction, outwardNormal) < 0.0;
  result.normal = select(-outwardNormal, outwardNormal, result.frontFace);
  
  return result;
}

fn intersectBox(ray: Ray, center: vec3<f32>, halfExtents: vec3<f32>) -> HitResult {
  var result: HitResult;
  result.hit = false;
  
  let invDir = 1.0 / ray.direction;
  let t0 = (center - halfExtents - ray.origin) * invDir;
  let t1 = (center + halfExtents - ray.origin) * invDir;
  
  let tMin = min(t0, t1);
  let tMax = max(t0, t1);
  
  let tNear = max(max(tMin.x, tMin.y), tMin.z);
  let tFar = min(min(tMax.x, tMax.y), tMax.z);
  
  if (tNear > tFar || tFar < 0.0) {
    return result;
  }
  
  var t = tNear;
  if (t < EPSILON) {
    t = tFar;
    if (t < EPSILON) {
      return result;
    }
  }
  
  result.hit = true;
  result.t = t;
  result.position = ray.origin + t * ray.direction;
  
  // Calculate normal
  let p = (result.position - center) / halfExtents;
  let absP = abs(p);
  
  if (absP.x > absP.y && absP.x > absP.z) {
    result.normal = vec3<f32>(sign(p.x), 0.0, 0.0);
  } else if (absP.y > absP.z) {
    result.normal = vec3<f32>(0.0, sign(p.y), 0.0);
  } else {
    result.normal = vec3<f32>(0.0, 0.0, sign(p.z));
  }
  
  result.frontFace = dot(ray.direction, result.normal) < 0.0;
  result.normal = select(-result.normal, result.normal, result.frontFace);
  
  return result;
}

// ============================================
// Rotation Helper
// ============================================

fn rotationMatrix(euler: vec3<f32>) -> mat3x3<f32> {
  let cx = cos(euler.x); let sx = sin(euler.x);
  let cy = cos(euler.y); let sy = sin(euler.y);
  let cz = cos(euler.z); let sz = sin(euler.z);
  
  return mat3x3<f32>(
    cy * cz, cy * sz, -sy,
    sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy,
    cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy
  );
}

// ============================================
// Scene Intersection
// ============================================

fn traceScene(ray: Ray) -> HitResult {
  var closest: HitResult;
  closest.hit = false;
  closest.t = MAX_FLOAT;
  closest.objectIndex = -1;
  
  for (var i = 0u; i < sceneHeader.objectCount; i++) {
    let obj = sceneObjects[i];
    
    let rotMat = rotationMatrix(obj.rotation);
    let invRotMat = transpose(rotMat);
    
    var localRay: Ray;
    localRay.origin = invRotMat * (ray.origin - obj.position);
    localRay.direction = invRotMat * ray.direction;
    
    var hit: HitResult;
    
    if (obj.objectType == 0u) {
      hit = intersectSphere(localRay, vec3<f32>(0.0), obj.scale.x);
    } else {
      hit = intersectBox(localRay, vec3<f32>(0.0), obj.scale);
    }
    
    if (hit.hit && hit.t < closest.t) {
      closest.hit = true;
      closest.t = hit.t;
      closest.position = ray.origin + hit.t * ray.direction;
      closest.normal = normalize(rotMat * hit.normal);
      closest.frontFace = hit.frontFace;
      closest.objectIndex = i32(i);
    }
  }
  
  return closest;
}

// ============================================
// Shadow Test
// ============================================

fn isOccluded(origin: vec3<f32>, direction: vec3<f32>, maxDist: f32) -> bool {
  var ray: Ray;
  ray.origin = origin + direction * EPSILON;
  ray.direction = direction;
  
  for (var i = 0u; i < sceneHeader.objectCount; i++) {
    let obj = sceneObjects[i];
    
    // Skip emissive objects (they are lights)
    if (obj.emission > 0.0) {
      continue;
    }
    
    let rotMat = rotationMatrix(obj.rotation);
    let invRotMat = transpose(rotMat);
    
    var localRay: Ray;
    localRay.origin = invRotMat * (ray.origin - obj.position);
    localRay.direction = invRotMat * ray.direction;
    
    var hit: HitResult;
    
    if (obj.objectType == 0u) {
      hit = intersectSphere(localRay, vec3<f32>(0.0), obj.scale.x);
    } else {
      hit = intersectBox(localRay, vec3<f32>(0.0), obj.scale);
    }
    
    if (hit.hit && hit.t < maxDist) {
      return true;
    }
  }
  
  return false;
}

// ============================================
// Sky/Environment
// ============================================

fn sampleSky(direction: vec3<f32>) -> vec3<f32> {
  let t = 0.5 * (direction.y + 1.0);
  let skyColor = mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(0.5, 0.7, 1.0), t);
  return skyColor * 0.5;  // Dim sky for better contrast
}

// ============================================
// Path Tracing
// ============================================

fn trace(primaryRay: Ray, rng: ptr<function, RandomState>) -> vec3<f32> {
  var ray = primaryRay;
  var throughput = vec3<f32>(1.0);
  var radiance = vec3<f32>(0.0);
  
  for (var bounce = 0u; bounce < settings.maxBounces; bounce++) {
    let hit = traceScene(ray);
    
    if (!hit.hit) {
      // Hit sky
      radiance += throughput * sampleSky(ray.direction);
      break;
    }
    
    let obj = sceneObjects[hit.objectIndex];
    
    // Add emission
    if (obj.emission > 0.0) {
      radiance += throughput * obj.emissionColor * obj.emission;
    }
    
    // Handle transparency (simple - just continue through)
    if (obj.transparency > 0.9 && randomFloat(rng) < obj.transparency) {
      ray.origin = hit.position + ray.direction * EPSILON;
      continue;
    }
    
    // Diffuse BRDF
    let diffuseDir = randomCosineHemisphere(rng, hit.normal);
    
    // Specular reflection
    let reflectDir = reflect(ray.direction, hit.normal);
    
    // Blend based on roughness (simplified)
    let isSpecular = randomFloat(rng) > obj.roughness;
    let newDir = select(diffuseDir, reflectDir, isSpecular);
    
    // Update throughput with material color
    throughput *= obj.color;
    
    // Russian roulette for path termination
    if (bounce > 3u) {
      let p = max(throughput.x, max(throughput.y, throughput.z));
      if (randomFloat(rng) > p) {
        break;
      }
      throughput /= p;
    }
    
    // Setup next ray
    ray.origin = hit.position + hit.normal * EPSILON;
    ray.direction = newDir;
  }
  
  return radiance;
}

// ============================================
// Ray Generation
// ============================================

fn generateRay(pixelCoord: vec2<f32>, resolution: vec2<f32>) -> Ray {
  let ndc = vec2<f32>(
    (pixelCoord.x / resolution.x) * 2.0 - 1.0,
    1.0 - (pixelCoord.y / resolution.y) * 2.0
  );
  
  var rayClip = vec4<f32>(ndc, -1.0, 1.0);
  var rayEye = camera.inverseProjection * rayClip;
  rayEye = vec4<f32>(rayEye.xy, -1.0, 0.0);
  
  let rayWorld = (camera.inverseView * rayEye).xyz;
  
  var ray: Ray;
  ray.origin = camera.position;
  ray.direction = normalize(rayWorld);
  
  return ray;
}

// ============================================
// Main
// ============================================

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let resolution = vec2<f32>(textureDimensions(outputTexture));
  let pixelCoord = vec2<f32>(f32(globalId.x), f32(globalId.y));
  
  if (pixelCoord.x >= resolution.x || pixelCoord.y >= resolution.y) {
    return;
  }
  
  var rng = initRandom(globalId.xy, settings.frameIndex);
  
  // Jitter for anti-aliasing
  let jitter = randomFloat2(&rng) - 0.5;
  let ray = generateRay(pixelCoord + 0.5 + jitter, resolution);
  
  // Trace path
  var color = trace(ray, &rng);
  
  // Clamp fireflies
  color = min(color, vec3<f32>(10.0));
  
  // Accumulation
  let pixelIndex = vec2<i32>(globalId.xy);
  var accumulated: vec4<f32>;
  
  if (settings.frameIndex == 0u || (settings.flags & 1u) == 0u) {
    accumulated = vec4<f32>(color, 1.0);
  } else {
    let previous = textureLoad(accumulationTexture, pixelIndex);
    let totalSamples = f32(settings.frameIndex + 1u);
    accumulated = vec4<f32>(
      previous.rgb + (color - previous.rgb) / totalSamples,
      1.0
    );
  }
  
  textureStore(accumulationTexture, pixelIndex, accumulated);
  
  // Tone mapping and output (simple Reinhard)
  var finalColor = accumulated.rgb;
  finalColor = finalColor / (finalColor + vec3<f32>(1.0));
  
  // Gamma correction
  finalColor = pow(finalColor, vec3<f32>(1.0 / 2.2));
  
  textureStore(outputTexture, pixelIndex, vec4<f32>(finalColor, 1.0));
}
```

### 4.5 Accumulation Reset Triggers

The accumulation should reset when:
- Camera moves or rotates
- Any object is added, removed, or modified
- Canvas resizes

**In Renderer.ts:**
```typescript
// Subscribe to scene changes
useSceneStore.subscribe((state, prevState) => {
  if (state.objects !== prevState.objects) {
    this.raytracingPipeline.resetAccumulation();
  }
});

// In camera update:
updateCamera(newCamera: Camera): void {
  if (!this.camera.equals(newCamera)) {
    this.raytracingPipeline.resetAccumulation();
  }
  this.camera = newCamera;
}
```

---

## Testing Requirements

### Manual Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| T4.1 | Progressive refinement | Load scene, wait | Image gets cleaner over time (noise reduces) |
| T4.2 | Shadows | Add sphere above ground | Sphere casts shadow on ground |
| T4.3 | Soft shadows | Add emissive object | Shadows are soft (area light behavior) |
| T4.4 | Color bleeding | Red object near white wall | White surface has red tint from bounce light |
| T4.5 | Emission works | Create emissive object | Object glows and illuminates nearby objects |
| T4.6 | Emission color | Set emission to red | Red light cast on nearby objects |
| T4.7 | Roughness effect | Vary roughness | Low roughness = sharp reflections, high = diffuse |
| T4.8 | Sky illumination | Scene with no emissive objects | Objects still lit by sky |
| T4.9 | Reset on move | Move object | Image resets and re-accumulates |
| T4.10 | No fireflies | Bright lights | No extremely bright pixels (clamped) |

### Performance Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| T4.P1 | Interactive FPS | At least 10 FPS during accumulation |
| T4.P2 | Convergence | Noticeable improvement within 1 second |
| T4.P3 | 100 samples | Scene looks good after ~100 samples |

---

## Acceptance Criteria

- [ ] Path tracing produces realistic global illumination
- [ ] Shadows are visible and correct
- [ ] Emissive objects light up the scene
- [ ] Roughness affects reflection sharpness
- [ ] Progressive accumulation reduces noise over time
- [ ] Accumulation resets on scene/camera changes
- [ ] Tone mapping prevents over-bright pixels
- [ ] Frame rate remains interactive

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/renderer/shaders/raytracer.wgsl` | Rewrite | Full path tracing shader |
| `src/renderer/RaytracingPipeline.ts` | Modify | Add accumulation buffer, settings |
| `src/renderer/Renderer.ts` | Modify | Track accumulation state |
| `src/core/types.ts` | Modify | Add RenderSettings type |

---

## Definition of Done

Stage 4 is complete when:
1. The scene renders with realistic lighting
2. Shadows appear naturally from blocking objects
3. Emissive objects illuminate their surroundings
4. The image progressively gets cleaner with more samples
5. Moving objects or camera resets the accumulation

