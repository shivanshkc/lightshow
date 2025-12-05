# Stage 2: Basic Raytracer

## Objective
Implement a basic raytracer that renders spheres and cuboids with normal-based shading. This establishes the core raytracing pipeline in WebGPU compute shaders.

---

## Prerequisites
- Stage 1 completed (WebGPU context working)
- Canvas renders and resizes correctly

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Camera Data    │────▶│  Compute Shader  │────▶│  Output Texture │
│  (Uniform)      │     │  (Raytracing)    │     │  (Storage)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Render Pass    │
                                                 │  (Blit to screen│
                                                 └─────────────────┘
```

---

## Project Structure Changes

```
src/
├── renderer/
│   ├── WebGPUContext.ts      # (from Stage 1)
│   ├── Renderer.ts           # Updated: orchestrates compute + render
│   ├── RaytracingPipeline.ts # NEW: compute pipeline setup
│   ├── BlitPipeline.ts       # NEW: copy texture to screen
│   └── shaders/
│       ├── raytracer.wgsl    # NEW: main raytracing compute shader
│       └── blit.wgsl         # NEW: fullscreen quad shader
├── core/
│   ├── Camera.ts             # NEW: camera state and ray generation
│   └── math.ts               # NEW: vector/matrix utilities
```

---

## Detailed Requirements

### 2.1 Math Utilities (math.ts)

Implement basic 3D math types and functions. Keep it minimal—only what's needed.

```typescript
// Types
export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Mat4 = Float32Array; // 16 elements, column-major

// Vector operations
export function vec3(x: number, y: number, z: number): Vec3;
export function add(a: Vec3, b: Vec3): Vec3;
export function sub(a: Vec3, b: Vec3): Vec3;
export function mul(a: Vec3, s: number): Vec3;
export function dot(a: Vec3, b: Vec3): number;
export function cross(a: Vec3, b: Vec3): Vec3;
export function normalize(v: Vec3): Vec3;
export function length(v: Vec3): number;

// Matrix operations
export function mat4Identity(): Mat4;
export function mat4Perspective(fovY: number, aspect: number, near: number, far: number): Mat4;
export function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4;
export function mat4Inverse(m: Mat4): Mat4;
export function mat4Multiply(a: Mat4, b: Mat4): Mat4;
```

**Important:** Matrices are column-major for GPU compatibility.

### 2.2 Camera (Camera.ts)

Camera class that generates ray directions for each pixel.

```typescript
interface CameraState {
  position: Vec3;      // Camera world position
  target: Vec3;        // Look-at point
  up: Vec3;            // Up vector (usually [0, 1, 0])
  fovY: number;        // Vertical FOV in radians
  aspect: number;      // Width / Height
}

class Camera {
  private state: CameraState;
  
  constructor();
  
  // Getters
  getPosition(): Vec3;
  getTarget(): Vec3;
  getFovY(): number;
  
  // For GPU upload
  getViewMatrix(): Mat4;
  getInverseViewMatrix(): Mat4;
  getInverseProjectionMatrix(): Mat4;
  
  // Updates
  setAspect(aspect: number): void;
  setPosition(pos: Vec3): void;
  setTarget(target: Vec3): void;
  
  // Create GPU buffer data (for uniform)
  getUniformData(): Float32Array;
}
```

**Default camera state:**
- Position: `[0, 2, 5]`
- Target: `[0, 0, 0]`
- Up: `[0, 1, 0]`
- FovY: `60°` (π/3 radians)

**Uniform buffer layout (must match WGSL):**
```
struct CameraUniforms {
  inverseProjection: mat4x4<f32>,  // bytes 0-63
  inverseView: mat4x4<f32>,        // bytes 64-127
  position: vec3<f32>,             // bytes 128-139
  _padding: f32,                   // bytes 140-143
}
// Total: 144 bytes (aligned to 16)
```

### 2.3 Raytracing Compute Shader (raytracer.wgsl)

The core raytracing logic.

```wgsl
// ============================================
// Bindings
// ============================================

struct CameraUniforms {
  inverseProjection: mat4x4<f32>,
  inverseView: mat4x4<f32>,
  position: vec3<f32>,
}

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;

// ============================================
// Ray Structure
// ============================================

struct Ray {
  origin: vec3<f32>,
  direction: vec3<f32>,
}

// ============================================
// Intersection Structures
// ============================================

struct HitRecord {
  hit: bool,
  t: f32,
  position: vec3<f32>,
  normal: vec3<f32>,
}

// ============================================
// Primitive Intersection Functions
// ============================================

// Sphere intersection
// center: sphere center
// radius: sphere radius
fn intersectSphere(ray: Ray, center: vec3<f32>, radius: f32) -> HitRecord {
  var result: HitRecord;
  result.hit = false;
  
  let oc = ray.origin - center;
  let a = dot(ray.direction, ray.direction);
  let b = 2.0 * dot(oc, ray.direction);
  let c = dot(oc, oc) - radius * radius;
  let discriminant = b * b - 4.0 * a * c;
  
  if (discriminant < 0.0) {
    return result;
  }
  
  let sqrtD = sqrt(discriminant);
  var t = (-b - sqrtD) / (2.0 * a);
  
  if (t < 0.001) {
    t = (-b + sqrtD) / (2.0 * a);
  }
  
  if (t < 0.001) {
    return result;
  }
  
  result.hit = true;
  result.t = t;
  result.position = ray.origin + t * ray.direction;
  result.normal = normalize(result.position - center);
  
  return result;
}

// Box (cuboid) intersection using slab method
// center: box center
// halfExtents: half-size in each dimension
fn intersectBox(ray: Ray, center: vec3<f32>, halfExtents: vec3<f32>) -> HitRecord {
  var result: HitRecord;
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
  if (t < 0.001) {
    t = tFar;
  }
  if (t < 0.001) {
    return result;
  }
  
  result.hit = true;
  result.t = t;
  result.position = ray.origin + t * ray.direction;
  
  // Calculate normal (which face was hit)
  let p = result.position - center;
  let d = halfExtents;
  let bias = 1.0001;
  
  result.normal = normalize(vec3<f32>(
    f32(abs(p.x) > d.x - 0.001) * sign(p.x),
    f32(abs(p.y) > d.y - 0.001) * sign(p.y),
    f32(abs(p.z) > d.z - 0.001) * sign(p.z)
  ));
  
  return result;
}

// ============================================
// Ray Generation
// ============================================

fn generateRay(pixelCoord: vec2<f32>, resolution: vec2<f32>) -> Ray {
  // Convert to NDC (-1 to 1)
  let ndc = vec2<f32>(
    (pixelCoord.x / resolution.x) * 2.0 - 1.0,
    1.0 - (pixelCoord.y / resolution.y) * 2.0  // Flip Y
  );
  
  // Unproject through inverse matrices
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
// Scene (Hardcoded for Stage 2)
// ============================================

fn traceScene(ray: Ray) -> HitRecord {
  var closest: HitRecord;
  closest.hit = false;
  closest.t = 999999.0;
  
  // Hardcoded sphere at origin
  let sphere1 = intersectSphere(ray, vec3<f32>(0.0, 0.0, 0.0), 1.0);
  if (sphere1.hit && sphere1.t < closest.t) {
    closest = sphere1;
  }
  
  // Hardcoded sphere to the right
  let sphere2 = intersectSphere(ray, vec3<f32>(2.5, 0.0, -1.0), 1.0);
  if (sphere2.hit && sphere2.t < closest.t) {
    closest = sphere2;
  }
  
  // Hardcoded box to the left
  let box1 = intersectBox(ray, vec3<f32>(-2.5, 0.0, 0.0), vec3<f32>(0.75, 0.75, 0.75));
  if (box1.hit && box1.t < closest.t) {
    closest = box1;
  }
  
  // Ground plane (large flat box)
  let ground = intersectBox(ray, vec3<f32>(0.0, -1.5, 0.0), vec3<f32>(10.0, 0.5, 10.0));
  if (ground.hit && ground.t < closest.t) {
    closest = ground;
  }
  
  return closest;
}

// ============================================
// Shading
// ============================================

fn shade(hit: HitRecord, ray: Ray) -> vec3<f32> {
  if (!hit.hit) {
    // Sky gradient
    let t = 0.5 * (ray.direction.y + 1.0);
    return mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(0.5, 0.7, 1.0), t);
  }
  
  // Simple normal-based shading
  // Map normal from [-1,1] to [0,1] for visualization
  return hit.normal * 0.5 + 0.5;
}

// ============================================
// Main Compute Entry
// ============================================

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let resolution = vec2<f32>(textureDimensions(outputTexture));
  let pixelCoord = vec2<f32>(f32(globalId.x), f32(globalId.y));
  
  // Early exit if outside texture bounds
  if (pixelCoord.x >= resolution.x || pixelCoord.y >= resolution.y) {
    return;
  }
  
  let ray = generateRay(pixelCoord + 0.5, resolution);  // +0.5 for pixel center
  let hit = traceScene(ray);
  let color = shade(hit, ray);
  
  textureStore(outputTexture, vec2<i32>(globalId.xy), vec4<f32>(color, 1.0));
}
```

### 2.4 Blit Shader (blit.wgsl)

Fullscreen quad that copies the compute output to screen.

```wgsl
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  // Fullscreen triangle
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0)
  );
  
  var uvs = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 1.0),
    vec2<f32>(2.0, 1.0),
    vec2<f32>(0.0, -1.0)
  );
  
  var output: VertexOutput;
  output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  output.uv = uvs[vertexIndex];
  
  return output;
}

@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return textureSample(inputTexture, textureSampler, input.uv);
}
```

### 2.5 RaytracingPipeline.ts

Manages the compute shader pipeline and resources.

```typescript
class RaytracingPipeline {
  private device: GPUDevice;
  private pipeline: GPUComputePipeline;
  private bindGroupLayout: GPUBindGroupLayout;
  private bindGroup: GPUBindGroup | null = null;
  
  private outputTexture: GPUTexture | null = null;
  private outputTextureView: GPUTextureView | null = null;
  
  private cameraBuffer: GPUBuffer;
  
  constructor(device: GPUDevice);
  
  // Create/recreate output texture when canvas resizes
  resizeOutput(width: number, height: number): void;
  
  // Update camera uniform buffer
  updateCamera(camera: Camera): void;
  
  // Run the compute pass
  dispatch(commandEncoder: GPUCommandEncoder): void;
  
  // Get output texture for blit
  getOutputTextureView(): GPUTextureView;
  
  destroy(): void;
}
```

**Pipeline creation:**
```typescript
const pipeline = device.createComputePipeline({
  layout: 'auto',
  compute: {
    module: device.createShaderModule({ code: raytracerWGSL }),
    entryPoint: 'main',
  },
});
```

**Output texture creation:**
```typescript
const texture = device.createTexture({
  size: { width, height },
  format: 'rgba8unorm',
  usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
});
```

**Dispatch calculation:**
```typescript
const workgroupSize = 8;
const workgroupsX = Math.ceil(width / workgroupSize);
const workgroupsY = Math.ceil(height / workgroupSize);
computePass.dispatchWorkgroups(workgroupsX, workgroupsY);
```

### 2.6 BlitPipeline.ts

Handles the fullscreen blit pass.

```typescript
class BlitPipeline {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline;
  private sampler: GPUSampler;
  private bindGroupLayout: GPUBindGroupLayout;
  
  constructor(device: GPUDevice, outputFormat: GPUTextureFormat);
  
  // Create bind group for the given texture
  createBindGroup(textureView: GPUTextureView): GPUBindGroup;
  
  // Render the fullscreen quad
  render(
    commandEncoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    sourceTextureView: GPUTextureView
  ): void;
  
  destroy(): void;
}
```

### 2.7 Updated Renderer.ts

Orchestrate the full render pipeline.

```typescript
class Renderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;
  
  private raytracingPipeline: RaytracingPipeline;
  private blitPipeline: BlitPipeline;
  private camera: Camera;
  
  private width: number = 0;
  private height: number = 0;
  private animationFrameId: number | null = null;
  
  constructor(webgpuContext: WebGPUContext);
  
  resize(width: number, height: number): void;
  
  start(): void;
  stop(): void;
  destroy(): void;
  
  private render(): void;
}
```

**Render loop:**
```typescript
private render(): void {
  // Update camera buffer
  this.raytracingPipeline.updateCamera(this.camera);
  
  const commandEncoder = this.device.createCommandEncoder();
  
  // 1. Run raytracing compute pass
  this.raytracingPipeline.dispatch(commandEncoder);
  
  // 2. Blit result to screen
  const targetView = this.context.getCurrentTexture().createView();
  this.blitPipeline.render(
    commandEncoder,
    targetView,
    this.raytracingPipeline.getOutputTextureView()
  );
  
  this.device.queue.submit([commandEncoder.finish()]);
  
  this.animationFrameId = requestAnimationFrame(() => this.render());
}
```

---

## Testing Requirements

### Manual Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| T2.1 | Scene renders | Load page | See spheres, box, and ground with colored normals |
| T2.2 | Sky visible | Look at area with no objects | Blue-white gradient sky |
| T2.3 | Sphere shapes | Observe spheres | Perfectly round, smooth normal gradients |
| T2.4 | Box shapes | Observe box | Sharp edges, flat normal colors per face |
| T2.5 | No artifacts | Inspect edges | No jagged edges on sphere silhouettes (minor aliasing OK) |
| T2.6 | Resize works | Resize window | Scene re-renders at new resolution, no stretching |
| T2.7 | Performance | Check FPS | At least 30 FPS on modern GPU |
| T2.8 | Aspect ratio | Make window wide/tall | Objects don't appear stretched |

### Visual Verification

The rendered scene should show:
1. A sphere at the center (rainbow normal colors)
2. A sphere to the right (rainbow normal colors)
3. A cube to the left (flat colors: red/green/blue/cyan/magenta/yellow faces)
4. A ground plane (top face is green, edges visible from angle)
5. Blue-white gradient sky in background

---

## Acceptance Criteria

- [ ] Raytracing compute shader runs and produces output
- [ ] Spheres render with correct shape
- [ ] Boxes render with correct shape and sharp edges
- [ ] Normal-based shading shows correct colors
- [ ] Sky gradient renders for rays that miss all objects
- [ ] Camera perspective is correct (objects in distance appear smaller)
- [ ] Output properly blits to screen
- [ ] Resize updates render resolution
- [ ] No visual artifacts or glitches
- [ ] Maintains interactive frame rate

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/core/math.ts` | Create | Vector/matrix math utilities |
| `src/core/Camera.ts` | Create | Camera state and matrices |
| `src/renderer/shaders/raytracer.wgsl` | Create | Raytracing compute shader |
| `src/renderer/shaders/blit.wgsl` | Create | Fullscreen blit shader |
| `src/renderer/RaytracingPipeline.ts` | Create | Compute pipeline management |
| `src/renderer/BlitPipeline.ts` | Create | Render pipeline for blit |
| `src/renderer/Renderer.ts` | Modify | Orchestrate compute + render |

---

## Common Pitfalls to Avoid

1. **Matrix order**: WGSL expects column-major matrices; ensure consistency
2. **Workgroup bounds**: Always check `globalId` against texture dimensions before writing
3. **Texture format**: Use `rgba8unorm` for storage texture (not all formats support storage)
4. **Ray epsilon**: Use `t > 0.001` not `t > 0` to avoid self-intersection
5. **Pixel center**: Add 0.5 to pixel coordinates for correct ray through pixel center
6. **UV flipping**: WebGPU texture coordinates may need Y-flip; handle in shaders

---

## Definition of Done

Stage 2 is complete when:
1. The canvas shows a raytraced scene with spheres and a box
2. Objects have visible normal-based coloring
3. The sky gradient is visible behind objects
4. Resizing the window updates the render correctly
5. Frame rate is acceptable for interactivity

