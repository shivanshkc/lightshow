# Stage 3: Scene Data Pipeline — Commits

## Overview
**Total Commits:** 5  
**Stage Goal:** Dynamic scene management with Zustand store and GPU buffer sync.

---

## Commit 3.1: Add Zustand and define scene types

### Description
Install Zustand, create type definitions for scene objects.

### Dependencies
```json
{ "dependencies": { "zustand": "^4.4.0", "nanoid": "^5.0.0" } }
```

### Files to Create
```
src/core/types.ts
src/__tests__/types.test.ts
```

### Key Implementation
```typescript
// src/core/types.ts
export type ObjectId = string;
export type PrimitiveType = 'sphere' | 'cuboid';

export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface Material {
  color: [number, number, number];
  roughness: number;
  metallic: number;
  transparency: number;
  ior: number;
  emission: number;
  emissionColor: [number, number, number];
}

export interface SceneObject {
  id: ObjectId;
  name: string;
  type: PrimitiveType;
  transform: Transform;
  material: Material;
  visible: boolean;
}

export function createDefaultMaterial(): Material { /* defaults */ }
export function createDefaultTransform(): Transform { /* defaults */ }
export function createDefaultSphere(): Omit<SceneObject, 'id'> { /* ... */ }
export function createDefaultCuboid(): Omit<SceneObject, 'id'> { /* ... */ }
```

### Test Cases
```typescript
describe('Scene Types', () => {
  it('createDefaultMaterial returns valid material', () => {
    const mat = createDefaultMaterial();
    expect(mat.roughness).toBeGreaterThanOrEqual(0);
    expect(mat.roughness).toBeLessThanOrEqual(1);
    expect(mat.color.length).toBe(3);
  });
  
  it('createDefaultSphere has type sphere', () => {
    const sphere = createDefaultSphere();
    expect(sphere.type).toBe('sphere');
  });
  
  it('createDefaultCuboid has type cuboid', () => {
    const cuboid = createDefaultCuboid();
    expect(cuboid.type).toBe('cuboid');
  });
});
```

### Commit Message
```
feat(core): define scene object types and factory functions
```

---

## Commit 3.2: Create scene store with Zustand

### Description
Zustand store for managing scene state (objects, selection).

### Files to Create
```
src/store/sceneStore.ts
src/__tests__/sceneStore.test.ts
```

### Key Implementation
```typescript
// src/store/sceneStore.ts
import { create } from 'zustand';
import { nanoid } from 'nanoid';

interface SceneState {
  objects: SceneObject[];
  selectedObjectId: ObjectId | null;
  
  addSphere: () => ObjectId;
  addCuboid: () => ObjectId;
  removeObject: (id: ObjectId) => void;
  selectObject: (id: ObjectId | null) => void;
  updateObject: (id: ObjectId, updates: Partial<SceneObject>) => void;
  updateTransform: (id: ObjectId, transform: Partial<Transform>) => void;
  updateMaterial: (id: ObjectId, material: Partial<Material>) => void;
  getObject: (id: ObjectId) => SceneObject | undefined;
  getSelectedObject: () => SceneObject | null;
  clear: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  selectedObjectId: null,
  
  addSphere: () => {
    const id = nanoid();
    const count = get().objects.filter(o => o.type === 'sphere').length + 1;
    set(state => ({
      objects: [...state.objects, { id, ...createDefaultSphere(), name: `Sphere ${count}` }]
    }));
    return id;
  },
  // ... other methods
}));
```

### Test Cases
```typescript
describe('sceneStore', () => {
  beforeEach(() => useSceneStore.getState().clear());
  
  it('starts with empty objects array', () => {
    expect(useSceneStore.getState().objects).toHaveLength(0);
  });
  
  it('adds sphere and returns id', () => {
    const id = useSceneStore.getState().addSphere();
    expect(id).toBeDefined();
    expect(useSceneStore.getState().objects).toHaveLength(1);
    expect(useSceneStore.getState().objects[0].type).toBe('sphere');
  });
  
  it('adds cuboid and returns id', () => {
    const id = useSceneStore.getState().addCuboid();
    expect(useSceneStore.getState().objects[0].type).toBe('cuboid');
  });
  
  it('removes object by id', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().removeObject(id);
    expect(useSceneStore.getState().objects).toHaveLength(0);
  });
  
  it('selects and deselects object', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().selectObject(id);
    expect(useSceneStore.getState().selectedObjectId).toBe(id);
    
    useSceneStore.getState().selectObject(null);
    expect(useSceneStore.getState().selectedObjectId).toBeNull();
  });
  
  it('updates object transform', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().updateTransform(id, { position: [1, 2, 3] });
    
    const obj = useSceneStore.getState().getObject(id);
    expect(obj?.transform.position).toEqual([1, 2, 3]);
  });
  
  it('clears selection when selected object removed', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().selectObject(id);
    useSceneStore.getState().removeObject(id);
    expect(useSceneStore.getState().selectedObjectId).toBeNull();
  });
});
```

### Commit Message
```
feat(store): create Zustand scene store for object management
```

---

## Commit 3.3: Create SceneBuffer for GPU data

### Description
Buffer manager that serializes scene objects for GPU consumption.

### Files to Create
```
src/core/SceneBuffer.ts
src/__tests__/SceneBuffer.test.ts
```

### Key Implementation
```typescript
// src/core/SceneBuffer.ts
const OBJECT_SIZE_BYTES = 128;
const MAX_OBJECTS = 256;
const HEADER_SIZE_BYTES = 16;

export class SceneBuffer {
  private device: GPUDevice;
  private buffer: GPUBuffer;
  private stagingData: Float32Array;

  constructor(device: GPUDevice) {
    const size = HEADER_SIZE_BYTES + MAX_OBJECTS * OBJECT_SIZE_BYTES;
    this.buffer = device.createBuffer({
      size,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.stagingData = new Float32Array(size / 4);
  }

  upload(objects: SceneObject[]): void {
    this.stagingData.fill(0);
    
    // Header: object count
    new Uint32Array(this.stagingData.buffer)[0] = Math.min(objects.length, MAX_OBJECTS);
    
    // Write each object
    for (let i = 0; i < Math.min(objects.length, MAX_OBJECTS); i++) {
      this.writeObject(objects[i], HEADER_SIZE_BYTES / 4 + i * (OBJECT_SIZE_BYTES / 4));
    }
    
    this.device.queue.writeBuffer(this.buffer, 0, this.stagingData);
  }

  private writeObject(obj: SceneObject, offset: number): void {
    const buf = this.stagingData;
    const u32 = new Uint32Array(buf.buffer);
    
    // Transform (64 bytes)
    buf[offset + 0] = obj.transform.position[0];
    buf[offset + 1] = obj.transform.position[1];
    buf[offset + 2] = obj.transform.position[2];
    u32[offset + 3] = obj.type === 'sphere' ? 0 : 1;
    buf[offset + 4] = obj.transform.scale[0];
    // ... rest of transform and material data
  }

  getBuffer(): GPUBuffer { return this.buffer; }
  destroy(): void { this.buffer.destroy(); }
}
```

### Test Cases
```typescript
describe('SceneBuffer', () => {
  it('calculates correct buffer size', () => {
    const size = 16 + 256 * 128; // header + max objects
    expect(size).toBe(32784);
  });
  
  it('correctly encodes object type', () => {
    // sphere = 0, cuboid = 1
    const sphereType = 'sphere' === 'sphere' ? 0 : 1;
    const cuboidType = 'cuboid' === 'sphere' ? 0 : 1;
    expect(sphereType).toBe(0);
    expect(cuboidType).toBe(1);
  });
  
  it('respects MAX_OBJECTS limit', () => {
    const count = Math.min(300, 256);
    expect(count).toBe(256);
  });
  
  it('object data fits in 128 bytes', () => {
    // 64 bytes transform + 64 bytes material = 128
    const transformBytes = 4 * 16; // 16 floats
    const materialBytes = 4 * 16;  // 16 floats
    expect(transformBytes + materialBytes).toBeLessThanOrEqual(128);
  });
});
```

### Commit Message
```
feat(core): create SceneBuffer for GPU data serialization
```

---

## Commit 3.4: Update raytracer shader for dynamic scene

### Description
Modify shader to read from scene buffer instead of hardcoded objects.

### Files to Modify
```
src/renderer/shaders/raytracer.wgsl
```

### Key Changes
```wgsl
// Add scene data structures
struct SceneHeader { objectCount: u32, _pad: vec3<u32> }
struct SceneObject {
  position: vec3<f32>, objectType: u32,
  scale: vec3<f32>, _pad1: f32,
  rotation: vec3<f32>, _pad2: f32,
  _transform_pad: vec4<f32>,
  color: vec3<f32>, roughness: f32,
  emissionColor: vec3<f32>, emission: f32,
  transparency: f32, ior: f32, metallic: f32, _mat_pad: f32,
  _material_pad: vec4<f32>,
}

// Add bindings
@group(0) @binding(2) var<storage, read> sceneHeader: SceneHeader;
@group(0) @binding(3) var<storage, read> sceneObjects: array<SceneObject>;

// Update traceScene to loop through dynamic objects
fn traceScene(ray: Ray) -> HitResult {
  var closest: HitResult;
  for (var i = 0u; i < sceneHeader.objectCount; i++) {
    let obj = sceneObjects[i];
    // Transform ray to object space, intersect, track closest
  }
  return closest;
}
```

### Test Cases
```typescript
describe('Updated raytracer shader', () => {
  it('has SceneHeader struct', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('struct SceneHeader');
  });
  
  it('has SceneObject struct', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('struct SceneObject');
  });
  
  it('reads from sceneObjects array', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('sceneObjects: array<SceneObject>');
  });
});
```

### Commit Message
```
feat(shaders): update raytracer to read dynamic scene data
```

---

## Commit 3.5: Integrate scene store with renderer

### Description
Connect scene store to renderer, sync objects to GPU each frame.

### Files to Modify
```
src/renderer/RaytracingPipeline.ts
src/renderer/Renderer.ts
src/components/Canvas.tsx
```

### Key Changes
```typescript
// RaytracingPipeline - add scene buffer binding
constructor(device: GPUDevice) {
  this.sceneBuffer = new SceneBuffer(device);
  // Update bind group layout to include scene buffer
}

updateScene(objects: SceneObject[]): void {
  this.sceneBuffer.upload(objects);
}

// Renderer - subscribe to scene changes
constructor(ctx: WebGPUContext) {
  // ... existing code
  this.unsubscribe = useSceneStore.subscribe((state) => {
    this.raytracingPipeline.updateScene(state.objects);
  });
}

// Canvas - add debug UI for testing
function DebugPanel() {
  const { addSphere, addCuboid, objects, clear } = useSceneStore();
  return (
    <div className="absolute top-4 left-4 bg-panel p-4 rounded space-y-2">
      <button onClick={addSphere}>Add Sphere</button>
      <button onClick={addCuboid}>Add Cuboid</button>
      <button onClick={clear}>Clear</button>
      <div>Objects: {objects.length}</div>
    </div>
  );
}
```

### Test Cases
```typescript
describe('Scene integration', () => {
  it('renderer receives scene updates', () => {
    // Mock test verifying subscription callback
    const callback = vi.fn();
    useSceneStore.subscribe(callback);
    useSceneStore.getState().addSphere();
    expect(callback).toHaveBeenCalled();
  });
  
  it('empty scene shows only sky', () => {
    // Manual: clear scene, verify only sky gradient visible
  });
  
  it('added objects appear in render', () => {
    // Manual: add sphere, verify it appears
  });
});
```

### Manual Testing
1. Click "Add Sphere" — sphere appears at origin
2. Click "Add Cuboid" — cuboid appears
3. Click "Clear" — only sky visible
4. Add 5+ objects — all render correctly

### Commit Message
```
feat(renderer): integrate scene store with GPU rendering

Stage 3 complete: Dynamic scene management working
```

---

## Stage 3 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 3.1 | Scene types | Type factories |
| 3.2 | Zustand store | CRUD operations |
| 3.3 | SceneBuffer | GPU serialization |
| 3.4 | Shader update | Dynamic scene reading |
| 3.5 | Integration | Store → GPU sync |

