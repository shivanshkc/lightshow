# Stage 3: Scene Data Pipeline

## Objective
Create a robust scene data system that allows dynamic object management. Objects can be added and removed at runtime, and the GPU receives updated scene data each frame.

---

## Prerequisites
- Stage 2 completed (basic raytracer working)
- Hardcoded scene renders correctly

---

## Architecture Overview

```
┌─────────────────────┐
│   Scene Store       │  (Zustand - CPU)
│   - objects[]       │
│   - addObject()     │
│   - removeObject()  │
│   - updateObject()  │
└─────────┬───────────┘
          │ sync
          ▼
┌─────────────────────┐
│   SceneBuffer       │  (GPU Buffer Manager)
│   - uploadScene()   │
│   - getBindGroup()  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Compute Shader    │
│   - reads objects[] │
│   - traces rays     │
└─────────────────────┘
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "zustand": "^4.4.0",
    "nanoid": "^5.0.0"
  }
}
```

---

## Project Structure Changes

```
src/
├── store/
│   └── sceneStore.ts         # NEW: Zustand scene state
├── core/
│   ├── math.ts               # (from Stage 2)
│   ├── Camera.ts             # (from Stage 2)
│   ├── types.ts              # NEW: shared type definitions
│   └── SceneBuffer.ts        # NEW: GPU scene buffer manager
├── renderer/
│   ├── RaytracingPipeline.ts # MODIFY: accept scene buffer
│   └── shaders/
│       └── raytracer.wgsl    # MODIFY: read from scene buffer
```

---

## Detailed Requirements

### 3.1 Type Definitions (types.ts)

Core type definitions used throughout the app.

```typescript
// Unique identifier for objects
export type ObjectId = string;

// Supported primitive types
export type PrimitiveType = 'sphere' | 'cuboid';

// Transform data
export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];  // Euler angles in radians
  scale: [number, number, number];     // For cuboid: width, height, depth
                                       // For sphere: [radius, radius, radius] (uniform)
}

// Material properties
export interface Material {
  color: [number, number, number];     // RGB, 0-1 range
  roughness: number;                    // 0 = mirror, 1 = diffuse
  transparency: number;                 // 0 = opaque, 1 = fully transparent
  emission: number;                     // 0 = no emission, >0 = light source
  emissionColor: [number, number, number]; // RGB of emitted light
}

// Complete scene object
export interface SceneObject {
  id: ObjectId;
  name: string;
  type: PrimitiveType;
  transform: Transform;
  material: Material;
  visible: boolean;
}

// Default values factory
export function createDefaultTransform(): Transform {
  return {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  };
}

export function createDefaultMaterial(): Material {
  return {
    color: [0.8, 0.8, 0.8],
    roughness: 0.5,
    transparency: 0,
    emission: 0,
    emissionColor: [1, 1, 1],
  };
}

export function createDefaultSphere(): Omit<SceneObject, 'id'> {
  return {
    name: 'Sphere',
    type: 'sphere',
    transform: createDefaultTransform(),
    material: createDefaultMaterial(),
    visible: true,
  };
}

export function createDefaultCuboid(): Omit<SceneObject, 'id'> {
  return {
    name: 'Cuboid',
    type: 'cuboid',
    transform: createDefaultTransform(),
    material: createDefaultMaterial(),
    visible: true,
  };
}
```

### 3.2 Scene Store (sceneStore.ts)

Zustand store for scene state management.

```typescript
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { SceneObject, ObjectId, createDefaultSphere, createDefaultCuboid } from '../core/types';

interface SceneState {
  objects: SceneObject[];
  selectedObjectId: ObjectId | null;
  
  // Object management
  addSphere: () => ObjectId;
  addCuboid: () => ObjectId;
  removeObject: (id: ObjectId) => void;
  duplicateObject: (id: ObjectId) => ObjectId | null;
  
  // Selection
  selectObject: (id: ObjectId | null) => void;
  getSelectedObject: () => SceneObject | null;
  
  // Updates
  updateObject: (id: ObjectId, updates: Partial<SceneObject>) => void;
  updateTransform: (id: ObjectId, transform: Partial<Transform>) => void;
  updateMaterial: (id: ObjectId, material: Partial<Material>) => void;
  
  // Utilities
  getObject: (id: ObjectId) => SceneObject | undefined;
  clear: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  selectedObjectId: null,
  
  addSphere: () => {
    const id = nanoid();
    const sphere: SceneObject = {
      id,
      ...createDefaultSphere(),
      name: `Sphere ${get().objects.filter(o => o.type === 'sphere').length + 1}`,
    };
    set(state => ({ objects: [...state.objects, sphere] }));
    return id;
  },
  
  addCuboid: () => {
    const id = nanoid();
    const cuboid: SceneObject = {
      id,
      ...createDefaultCuboid(),
      name: `Cuboid ${get().objects.filter(o => o.type === 'cuboid').length + 1}`,
    };
    set(state => ({ objects: [...state.objects, cuboid] }));
    return id;
  },
  
  removeObject: (id) => {
    set(state => ({
      objects: state.objects.filter(o => o.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    }));
  },
  
  duplicateObject: (id) => {
    const obj = get().getObject(id);
    if (!obj) return null;
    
    const newId = nanoid();
    const duplicate: SceneObject = {
      ...structuredClone(obj),
      id: newId,
      name: `${obj.name} Copy`,
      transform: {
        ...obj.transform,
        position: [
          obj.transform.position[0] + 1,
          obj.transform.position[1],
          obj.transform.position[2],
        ],
      },
    };
    set(state => ({ objects: [...state.objects, duplicate] }));
    return newId;
  },
  
  selectObject: (id) => {
    set({ selectedObjectId: id });
  },
  
  getSelectedObject: () => {
    const { objects, selectedObjectId } = get();
    return objects.find(o => o.id === selectedObjectId) ?? null;
  },
  
  updateObject: (id, updates) => {
    set(state => ({
      objects: state.objects.map(o => 
        o.id === id ? { ...o, ...updates } : o
      ),
    }));
  },
  
  updateTransform: (id, transform) => {
    set(state => ({
      objects: state.objects.map(o =>
        o.id === id 
          ? { ...o, transform: { ...o.transform, ...transform } }
          : o
      ),
    }));
  },
  
  updateMaterial: (id, material) => {
    set(state => ({
      objects: state.objects.map(o =>
        o.id === id
          ? { ...o, material: { ...o.material, ...material } }
          : o
      ),
    }));
  },
  
  getObject: (id) => {
    return get().objects.find(o => o.id === id);
  },
  
  clear: () => {
    set({ objects: [], selectedObjectId: null });
  },
}));
```

### 3.3 GPU Data Layout

Define the exact memory layout for GPU buffers.

**Object struct (GPU side, 128 bytes aligned):**

```wgsl
struct SceneObject {
  // Transform (64 bytes)
  position: vec3<f32>,      // 12 bytes
  objectType: u32,          // 4 bytes (0 = sphere, 1 = cuboid)
  scale: vec3<f32>,         // 12 bytes
  _pad1: f32,               // 4 bytes padding
  rotation: vec3<f32>,      // 12 bytes (Euler angles)
  _pad2: f32,               // 4 bytes padding
  // 48 bytes so far, add 16 bytes padding to reach 64
  _transform_pad: vec4<f32>, // 16 bytes padding
  
  // Material (64 bytes)
  color: vec3<f32>,         // 12 bytes
  roughness: f32,           // 4 bytes
  emissionColor: vec3<f32>, // 12 bytes
  emission: f32,            // 4 bytes
  transparency: f32,        // 4 bytes
  _mat_pad: vec3<f32>,      // 12 bytes padding
  _material_pad: vec4<f32>, // 16 bytes padding
}
// Total: 128 bytes per object
```

**Scene header struct:**
```wgsl
struct SceneHeader {
  objectCount: u32,
  _pad: vec3<u32>,
}
// 16 bytes
```

### 3.4 SceneBuffer (SceneBuffer.ts)

Manages GPU buffer for scene objects.

```typescript
import { SceneObject } from './types';

// Constants matching GPU layout
const OBJECT_SIZE_BYTES = 128;
const MAX_OBJECTS = 256;
const HEADER_SIZE_BYTES = 16;

export class SceneBuffer {
  private device: GPUDevice;
  private buffer: GPUBuffer;
  private stagingBuffer: Float32Array;
  
  constructor(device: GPUDevice) {
    this.device = device;
    
    // Create GPU buffer
    const bufferSize = HEADER_SIZE_BYTES + MAX_OBJECTS * OBJECT_SIZE_BYTES;
    this.buffer = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    
    // Create staging buffer (CPU side)
    this.stagingBuffer = new Float32Array(bufferSize / 4);
  }
  
  // Upload scene objects to GPU
  upload(objects: SceneObject[]): void {
    const count = Math.min(objects.length, MAX_OBJECTS);
    
    // Clear staging buffer
    this.stagingBuffer.fill(0);
    
    // Write header (as Uint32)
    const headerView = new Uint32Array(this.stagingBuffer.buffer, 0, 4);
    headerView[0] = count;
    
    // Write each object
    const headerFloats = HEADER_SIZE_BYTES / 4;
    const objectFloats = OBJECT_SIZE_BYTES / 4;
    
    for (let i = 0; i < count; i++) {
      const obj = objects[i];
      const offset = headerFloats + i * objectFloats;
      
      this.writeObject(obj, offset);
    }
    
    // Upload to GPU
    this.device.queue.writeBuffer(this.buffer, 0, this.stagingBuffer);
  }
  
  private writeObject(obj: SceneObject, offset: number): void {
    const buf = this.stagingBuffer;
    const uint32View = new Uint32Array(buf.buffer);
    
    // Position (vec3)
    buf[offset + 0] = obj.transform.position[0];
    buf[offset + 1] = obj.transform.position[1];
    buf[offset + 2] = obj.transform.position[2];
    
    // Object type (u32)
    uint32View[offset + 3] = obj.type === 'sphere' ? 0 : 1;
    
    // Scale (vec3)
    buf[offset + 4] = obj.transform.scale[0];
    buf[offset + 5] = obj.transform.scale[1];
    buf[offset + 6] = obj.transform.scale[2];
    
    // Padding
    buf[offset + 7] = 0;
    
    // Rotation (vec3)
    buf[offset + 8] = obj.transform.rotation[0];
    buf[offset + 9] = obj.transform.rotation[1];
    buf[offset + 10] = obj.transform.rotation[2];
    
    // Padding to 64 bytes for transform section
    // offset + 11 through offset + 15 are padding
    
    // Material starts at offset + 16
    const matOffset = offset + 16;
    
    // Color (vec3)
    buf[matOffset + 0] = obj.material.color[0];
    buf[matOffset + 1] = obj.material.color[1];
    buf[matOffset + 2] = obj.material.color[2];
    
    // Roughness (f32)
    buf[matOffset + 3] = obj.material.roughness;
    
    // Emission color (vec3)
    buf[matOffset + 4] = obj.material.emissionColor[0];
    buf[matOffset + 5] = obj.material.emissionColor[1];
    buf[matOffset + 6] = obj.material.emissionColor[2];
    
    // Emission strength (f32)
    buf[matOffset + 7] = obj.material.emission;
    
    // Transparency (f32)
    buf[matOffset + 8] = obj.material.transparency;
    
    // Remaining padding to reach 64 bytes for material section
  }
  
  getBuffer(): GPUBuffer {
    return this.buffer;
  }
  
  destroy(): void {
    this.buffer.destroy();
  }
}
```

### 3.5 Updated Raytracer Shader (raytracer.wgsl)

Modify to read from scene buffer instead of hardcoded values.

```wgsl
// ============================================
// Scene Data Structures
// ============================================

struct SceneHeader {
  objectCount: u32,
  _pad: vec3<u32>,
}

struct SceneObject {
  position: vec3<f32>,
  objectType: u32,  // 0 = sphere, 1 = cuboid
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

// ============================================
// Bindings
// ============================================

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<storage, read> sceneHeader: SceneHeader;
@group(0) @binding(3) var<storage, read> sceneObjects: array<SceneObject>;

// ... (keep existing Ray, HitRecord, intersection functions)

// ============================================
// Extended Hit Record (with object index)
// ============================================

struct HitResult {
  hit: bool,
  t: f32,
  position: vec3<f32>,
  normal: vec3<f32>,
  objectIndex: i32,
}

// ============================================
// Rotation Matrix from Euler Angles
// ============================================

fn rotationMatrix(euler: vec3<f32>) -> mat3x3<f32> {
  let cx = cos(euler.x);
  let sx = sin(euler.x);
  let cy = cos(euler.y);
  let sy = sin(euler.y);
  let cz = cos(euler.z);
  let sz = sin(euler.z);
  
  // Combined rotation matrix (ZYX order)
  return mat3x3<f32>(
    cy * cz,                    cy * sz,                    -sy,
    sx * sy * cz - cx * sz,     sx * sy * sz + cx * cz,     sx * cy,
    cx * sy * cz + sx * sz,     cx * sy * sz - sx * cz,     cx * cy
  );
}

// ============================================
// Scene Tracing
// ============================================

fn traceScene(ray: Ray) -> HitResult {
  var closest: HitResult;
  closest.hit = false;
  closest.t = 999999.0;
  closest.objectIndex = -1;
  
  let objectCount = sceneHeader.objectCount;
  
  for (var i = 0u; i < objectCount; i++) {
    let obj = sceneObjects[i];
    
    // Transform ray to object space
    let rotMat = rotationMatrix(obj.rotation);
    let invRotMat = transpose(rotMat);
    
    var localRay: Ray;
    localRay.origin = invRotMat * (ray.origin - obj.position);
    localRay.direction = invRotMat * ray.direction;
    
    var hit: HitRecord;
    
    if (obj.objectType == 0u) {
      // Sphere - scale.x is radius
      hit = intersectSphere(localRay, vec3<f32>(0.0), obj.scale.x);
    } else {
      // Cuboid - scale is half-extents
      hit = intersectBox(localRay, vec3<f32>(0.0), obj.scale);
    }
    
    if (hit.hit && hit.t < closest.t) {
      closest.hit = true;
      closest.t = hit.t;
      closest.position = ray.origin + hit.t * ray.direction;
      closest.normal = normalize(rotMat * hit.normal);
      closest.objectIndex = i32(i);
    }
  }
  
  return closest;
}

// ============================================
// Shading with Object Colors
// ============================================

fn shade(hit: HitResult, ray: Ray) -> vec3<f32> {
  if (!hit.hit) {
    // Sky gradient
    let t = 0.5 * (ray.direction.y + 1.0);
    return mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(0.5, 0.7, 1.0), t);
  }
  
  let obj = sceneObjects[hit.objectIndex];
  
  // Simple diffuse shading with object color
  let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
  let NdotL = max(dot(hit.normal, lightDir), 0.0);
  let ambient = 0.2;
  let diffuse = NdotL * 0.8;
  
  var color = obj.color * (ambient + diffuse);
  
  // Add emission
  if (obj.emission > 0.0) {
    color = color + obj.emissionColor * obj.emission;
  }
  
  return color;
}

// ... (keep main function, update to use new shade signature)

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let resolution = vec2<f32>(textureDimensions(outputTexture));
  let pixelCoord = vec2<f32>(f32(globalId.x), f32(globalId.y));
  
  if (pixelCoord.x >= resolution.x || pixelCoord.y >= resolution.y) {
    return;
  }
  
  let ray = generateRay(pixelCoord + 0.5, resolution);
  let hit = traceScene(ray);
  let color = shade(hit, ray);
  
  textureStore(outputTexture, vec2<i32>(globalId.xy), vec4<f32>(color, 1.0));
}
```

### 3.6 Updated RaytracingPipeline.ts

Add scene buffer binding.

```typescript
// In constructor or init method:
this.bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: 'uniform' },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      storageTexture: { access: 'write-only', format: 'rgba8unorm' },
    },
    {
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: 'read-only-storage' },
    },
    {
      binding: 3,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: 'read-only-storage' },
    },
  ],
});

// When creating bind group (with scene buffer):
createBindGroup(sceneBuffer: SceneBuffer): GPUBindGroup {
  return this.device.createBindGroup({
    layout: this.bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: this.cameraBuffer } },
      { binding: 1, resource: this.outputTextureView },
      { binding: 2, resource: { buffer: sceneBuffer.getBuffer(), offset: 0, size: 16 } },
      { binding: 3, resource: { buffer: sceneBuffer.getBuffer(), offset: 16 } },
    ],
  });
}
```

---

## Testing Requirements

### Manual Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| T3.1 | Empty scene | Load with no objects | Only sky gradient visible |
| T3.2 | Add sphere | Call addSphere() | Sphere appears in scene |
| T3.3 | Add cuboid | Call addCuboid() | Cuboid appears in scene |
| T3.4 | Multiple objects | Add 5+ objects | All objects visible |
| T3.5 | Remove object | Remove one object | Object disappears, others remain |
| T3.6 | Object color | Change object color | Object renders with new color |
| T3.7 | Object position | Change position | Object moves in scene |
| T3.8 | Object scale | Change scale | Object size changes |
| T3.9 | Object rotation | Change rotation | Object rotates correctly |
| T3.10 | Max objects | Add 100+ objects | No crash, reasonable performance |

### Debug UI (Temporary)

Add temporary debug buttons to test the scene store:

```tsx
// Temporary debug panel
function DebugPanel() {
  const { addSphere, addCuboid, objects, clear } = useSceneStore();
  
  return (
    <div className="absolute top-4 left-4 bg-panel p-4 rounded">
      <button onClick={addSphere}>Add Sphere</button>
      <button onClick={addCuboid}>Add Cuboid</button>
      <button onClick={clear}>Clear</button>
      <div>Objects: {objects.length}</div>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] Scene store correctly manages object list
- [ ] Objects can be added, removed, and updated
- [ ] GPU buffer correctly receives scene data
- [ ] Shader reads from scene buffer (no hardcoded objects)
- [ ] Object colors display correctly
- [ ] Object positions work correctly
- [ ] Object rotations work correctly
- [ ] Object scales work correctly
- [ ] Empty scene shows only sky
- [ ] Performance acceptable with 50+ objects

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/core/types.ts` | Create | Shared type definitions |
| `src/store/sceneStore.ts` | Create | Zustand scene state |
| `src/core/SceneBuffer.ts` | Create | GPU buffer management |
| `src/renderer/shaders/raytracer.wgsl` | Modify | Read from scene buffer |
| `src/renderer/RaytracingPipeline.ts` | Modify | Include scene buffer binding |
| `src/renderer/Renderer.ts` | Modify | Sync scene store to GPU |

---

## Definition of Done

Stage 3 is complete when:
1. Scene store exists and manages objects
2. Objects can be added via store methods
3. GPU shader reads from dynamic scene buffer
4. Objects render with correct properties (color, position, scale, rotation)
5. Scene updates reflect immediately in the render

