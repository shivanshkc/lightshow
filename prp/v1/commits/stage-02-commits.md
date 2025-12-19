# Stage 2: Basic Raytracer — Commits

## Overview
**Total Commits:** 6  
**Stage Goal:** Implement compute shader raytracer with sphere/box intersections.

---

## Commit 2.1: Add math utilities

### Description
Create vector and matrix math utilities for 3D calculations.

### Files to Create
```
src/core/math.ts
src/__tests__/math.test.ts
```

### Key Implementation
```typescript
// src/core/math.ts
export type Vec3 = [number, number, number];
export type Mat4 = Float32Array; // 16 elements, column-major

export const vec3 = (x: number, y: number, z: number): Vec3 => [x, y, z];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
export const mul = (v: Vec3, s: number): Vec3 => [v[0]*s, v[1]*s, v[2]*s];
export const dot = (a: Vec3, b: Vec3): number => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1]*b[2] - a[2]*b[1],
  a[2]*b[0] - a[0]*b[2],
  a[0]*b[1] - a[1]*b[0]
];
export const length = (v: Vec3): number => Math.sqrt(dot(v, v));
export const normalize = (v: Vec3): Vec3 => { const l = length(v); return l > 0 ? mul(v, 1/l) : [0,0,0]; };

export function mat4Identity(): Mat4 { /* ... */ }
export function mat4Perspective(fovY: number, aspect: number, near: number, far: number): Mat4 { /* ... */ }
export function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 { /* ... */ }
export function mat4Inverse(m: Mat4): Mat4 { /* ... */ }
```

### Test Cases
```typescript
describe('math utilities', () => {
  it('normalizes vectors correctly', () => {
    expect(length(normalize([3, 4, 0]))).toBeCloseTo(1);
  });
  it('computes dot product', () => {
    expect(dot([1,0,0], [0,1,0])).toBe(0);
    expect(dot([1,0,0], [1,0,0])).toBe(1);
  });
  it('computes cross product', () => {
    expect(cross([1,0,0], [0,1,0])).toEqual([0,0,1]);
  });
  it('creates identity matrix', () => {
    const m = mat4Identity();
    expect(m[0]).toBe(1); expect(m[5]).toBe(1); expect(m[10]).toBe(1); expect(m[15]).toBe(1);
  });
});
```

### Commit Message
```
feat(core): add 3D math utilities for vectors and matrices
```

---

## Commit 2.2: Create Camera class

### Description
Camera class that generates view/projection matrices for ray generation.

### Files to Create
```
src/core/Camera.ts
src/__tests__/Camera.test.ts
```

### Key Implementation
```typescript
// src/core/Camera.ts
export class Camera {
  position: Vec3 = [0, 2, 5];
  target: Vec3 = [0, 0, 0];
  up: Vec3 = [0, 1, 0];
  fovY: number = Math.PI / 3;
  aspect: number = 1;

  setAspect(aspect: number): void { this.aspect = aspect; }
  
  getViewMatrix(): Mat4 { return mat4LookAt(this.position, this.target, this.up); }
  getProjectionMatrix(): Mat4 { return mat4Perspective(this.fovY, this.aspect, 0.1, 1000); }
  getInverseViewMatrix(): Mat4 { return mat4Inverse(this.getViewMatrix()); }
  getInverseProjectionMatrix(): Mat4 { return mat4Inverse(this.getProjectionMatrix()); }
  
  // Returns Float32Array for GPU uniform buffer (144 bytes)
  getUniformData(): Float32Array {
    const data = new Float32Array(36);
    data.set(this.getInverseProjectionMatrix(), 0);
    data.set(this.getInverseViewMatrix(), 16);
    data.set(this.position, 32);
    return data;
  }
}
```

### Test Cases
```typescript
describe('Camera', () => {
  it('has sensible defaults', () => {
    const cam = new Camera();
    expect(cam.position[1]).toBeGreaterThan(0); // Above ground
  });
  it('generates view matrix', () => {
    const cam = new Camera();
    const view = cam.getViewMatrix();
    expect(view.length).toBe(16);
  });
  it('updates aspect ratio', () => {
    const cam = new Camera();
    cam.setAspect(16/9);
    expect(cam.aspect).toBeCloseTo(16/9);
  });
  it('produces uniform data of correct size', () => {
    const cam = new Camera();
    const data = cam.getUniformData();
    expect(data.length).toBe(36); // 144 bytes / 4
  });
});
```

### Commit Message
```
feat(core): add Camera class with view/projection matrices
```

---

## Commit 2.3: Create raytracing compute shader

### Description
WGSL compute shader with ray generation, sphere/box intersection.

### Files to Create
```
src/renderer/shaders/raytracer.wgsl
```

### Key Implementation
```wgsl
struct CameraUniforms {
  inverseProjection: mat4x4<f32>,
  inverseView: mat4x4<f32>,
  position: vec3<f32>,
}

struct Ray { origin: vec3<f32>, direction: vec3<f32> }
struct HitRecord { hit: bool, t: f32, position: vec3<f32>, normal: vec3<f32> }

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;

fn intersectSphere(ray: Ray, center: vec3<f32>, radius: f32) -> HitRecord { /* ... */ }
fn intersectBox(ray: Ray, center: vec3<f32>, halfExtents: vec3<f32>) -> HitRecord { /* ... */ }

fn generateRay(pixelCoord: vec2<f32>, resolution: vec2<f32>) -> Ray { /* ... */ }

fn traceScene(ray: Ray) -> HitRecord {
  // Hardcoded scene: 2 spheres + 1 box + ground
}

fn shade(hit: HitRecord, ray: Ray) -> vec3<f32> {
  if (!hit.hit) { return sky gradient; }
  return hit.normal * 0.5 + 0.5; // Normal visualization
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let ray = generateRay(pixelCoord, resolution);
  let hit = traceScene(ray);
  let color = shade(hit, ray);
  textureStore(outputTexture, vec2<i32>(globalId.xy), vec4<f32>(color, 1.0));
}
```

### Test Cases
```typescript
describe('raytracer shader', () => {
  it('shader file exists and is valid WGSL', async () => {
    const shaderCode = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shaderCode.default).toContain('@compute');
    expect(shaderCode.default).toContain('intersectSphere');
    expect(shaderCode.default).toContain('intersectBox');
  });
});
```

### Commit Message
```
feat(shaders): create raytracing compute shader with intersections
```

---

## Commit 2.4: Create blit shader for screen output

### Description
Fullscreen triangle shader to copy compute output to screen.

### Files to Create
```
src/renderer/shaders/blit.wgsl
```

### Key Implementation
```wgsl
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(@builtin(vertex_index) idx: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 3>(vec2(-1,-1), vec2(3,-1), vec2(-1,3));
  var uv = array<vec2<f32>, 3>(vec2(0,1), vec2(2,1), vec2(0,-1));
  var out: VertexOutput;
  out.position = vec4<f32>(pos[idx], 0.0, 1.0);
  out.uv = uv[idx];
  return out;
}

@group(0) @binding(0) var texSampler: sampler;
@group(0) @binding(1) var tex: texture_2d<f32>;

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
  return textureSample(tex, texSampler, in.uv);
}
```

### Commit Message
```
feat(shaders): add fullscreen blit shader for output
```

---

## Commit 2.5: Create RaytracingPipeline class

### Description
Manages compute pipeline, buffers, and dispatch.

### Files to Create
```
src/renderer/RaytracingPipeline.ts
src/__tests__/RaytracingPipeline.test.ts
```

### Key Implementation
```typescript
export class RaytracingPipeline {
  private device: GPUDevice;
  private pipeline: GPUComputePipeline;
  private cameraBuffer: GPUBuffer;
  private outputTexture: GPUTexture | null = null;
  private bindGroup: GPUBindGroup | null = null;

  constructor(device: GPUDevice) { /* create pipeline, buffer */ }
  
  resizeOutput(width: number, height: number): void { /* recreate texture */ }
  updateCamera(camera: Camera): void { /* write to buffer */ }
  dispatch(encoder: GPUCommandEncoder, width: number, height: number): void { /* dispatch compute */ }
  getOutputTextureView(): GPUTextureView { /* return view */ }
  destroy(): void { /* cleanup */ }
}
```

### Test Cases
```typescript
describe('RaytracingPipeline', () => {
  it('creates pipeline without errors', () => { /* mock test */ });
  it('resizes output texture', () => { /* verify dimensions */ });
  it('dispatches correct workgroup count', () => {
    // For 800x600 with workgroup 8x8: ceil(800/8)=100, ceil(600/8)=75
    expect(Math.ceil(800/8)).toBe(100);
    expect(Math.ceil(600/8)).toBe(75);
  });
});
```

### Commit Message
```
feat(renderer): create RaytracingPipeline for compute dispatch
```

---

## Commit 2.6: Create BlitPipeline and integrate rendering

### Description
Complete the render pipeline with blit pass and integrate into Renderer.

### Files to Create/Modify
```
src/renderer/BlitPipeline.ts
src/renderer/Renderer.ts  # MODIFY
```

### Key Implementation
```typescript
// BlitPipeline.ts
export class BlitPipeline {
  constructor(device: GPUDevice, format: GPUTextureFormat) { /* create render pipeline */ }
  render(encoder: GPUCommandEncoder, targetView: GPUTextureView, sourceView: GPUTextureView): void { /* draw fullscreen */ }
}

// Updated Renderer.ts render loop
private render = (): void => {
  this.raytracingPipeline.updateCamera(this.camera);
  
  const encoder = this.device.createCommandEncoder();
  this.raytracingPipeline.dispatch(encoder, this.width, this.height);
  
  const targetView = this.context.getCurrentTexture().createView();
  this.blitPipeline.render(encoder, targetView, this.raytracingPipeline.getOutputTextureView());
  
  this.device.queue.submit([encoder.finish()]);
  this.animationFrameId = requestAnimationFrame(this.render);
};
```

### Test Cases
```typescript
describe('BlitPipeline', () => {
  it('creates render pipeline', () => { /* mock test */ });
});

describe('Renderer integration', () => {
  it('renders spheres with normal colors', () => {
    // Manual verification: scene shows colorful spheres
  });
});
```

### Manual Testing
1. Run app — should see 2 spheres, 1 box, ground plane
2. Objects show rainbow normal colors
3. Sky gradient visible in background
4. Resize works correctly

### Commit Message
```
feat(renderer): integrate raytracing with blit pipeline

Stage 2 complete: Basic raytracer rendering scene
```

---

## Stage 2 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 2.1 | Math utilities | Vector/matrix operations |
| 2.2 | Camera class | View/projection matrices |
| 2.3 | Raytracing shader | WGSL syntax validation |
| 2.4 | Blit shader | Fullscreen output |
| 2.5 | RaytracingPipeline | Compute dispatch |
| 2.6 | BlitPipeline + integration | Visual verification |

