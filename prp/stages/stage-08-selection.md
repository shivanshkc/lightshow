# Stage 8: Object Selection & Picking

## Objective
Implement mouse-based object selection by casting rays from the camera through clicked pixels to detect object intersections. Selected objects should have visual feedback.

---

## Prerequisites
- Stage 7 completed (UI shell functional)
- Scene store with selection state
- Camera and raytracing pipeline working

---

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Mouse Click  │────▶│ Screen→World │────▶│ Ray-Object   │
│ (x, y)       │     │ Ray          │     │ Intersection │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ Update       │
                                          │ Selection    │
                                          └──────────────┘
```

---

## Implementation Approaches

### Approach A: CPU-side Raycasting (Recommended for Stage 8)
- Reuse intersection math from shaders in TypeScript
- Cast ray from camera through click point
- Test against all scene objects
- Simple, no GPU readback needed

### Approach B: GPU Picking Buffer (Advanced)
- Render object IDs to a separate buffer
- Read pixel value on click
- More complex but faster for many objects

**We'll use Approach A for simplicity.**

---

## Project Structure Changes

```
src/
├── core/
│   ├── Raycaster.ts           # NEW: CPU intersection tests
│   └── math.ts                # UPDATE: add ray-object intersections
├── components/
│   └── Canvas.tsx             # UPDATE: handle click for selection
├── store/
│   └── sceneStore.ts          # (already has selection state)
```

---

## Detailed Implementation

### 8.1 Math Utilities Extension (math.ts)

Add ray and intersection types for CPU-side use.

```typescript
// Ray type
export interface Ray {
  origin: Vec3;
  direction: Vec3;
}

// Hit result
export interface HitResult {
  hit: boolean;
  t: number;
  point: Vec3;
  normal: Vec3;
  objectId: string | null;
}

// Create ray from screen coordinates
export function screenToWorldRay(
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  inverseProjection: Mat4,
  inverseView: Mat4,
  cameraPosition: Vec3
): Ray {
  // Convert to NDC (-1 to 1)
  const ndcX = (screenX / canvasWidth) * 2 - 1;
  const ndcY = 1 - (screenY / canvasHeight) * 2;  // Flip Y
  
  // Create clip space point
  const clipPoint: Vec4 = [ndcX, ndcY, -1, 1];
  
  // Transform to eye space
  let eyePoint = mat4MultiplyVec4(inverseProjection, clipPoint);
  eyePoint = [eyePoint[0], eyePoint[1], -1, 0];
  
  // Transform to world space
  const worldDir = mat4MultiplyVec4(inverseView, eyePoint);
  const direction = normalize([worldDir[0], worldDir[1], worldDir[2]]);
  
  return {
    origin: cameraPosition,
    direction,
  };
}

// Ray-sphere intersection
export function intersectRaySphere(
  ray: Ray,
  center: Vec3,
  radius: number
): { hit: boolean; t: number } {
  const oc = sub(ray.origin, center);
  const a = dot(ray.direction, ray.direction);
  const b = 2 * dot(oc, ray.direction);
  const c = dot(oc, oc) - radius * radius;
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) {
    return { hit: false, t: Infinity };
  }
  
  const sqrtD = Math.sqrt(discriminant);
  let t = (-b - sqrtD) / (2 * a);
  
  if (t < 0.001) {
    t = (-b + sqrtD) / (2 * a);
  }
  
  if (t < 0.001) {
    return { hit: false, t: Infinity };
  }
  
  return { hit: true, t };
}

// Ray-box intersection (AABB)
export function intersectRayBox(
  ray: Ray,
  center: Vec3,
  halfExtents: Vec3
): { hit: boolean; t: number } {
  const invDir: Vec3 = [
    1 / ray.direction[0],
    1 / ray.direction[1],
    1 / ray.direction[2],
  ];
  
  const t1 = (center[0] - halfExtents[0] - ray.origin[0]) * invDir[0];
  const t2 = (center[0] + halfExtents[0] - ray.origin[0]) * invDir[0];
  const t3 = (center[1] - halfExtents[1] - ray.origin[1]) * invDir[1];
  const t4 = (center[1] + halfExtents[1] - ray.origin[1]) * invDir[1];
  const t5 = (center[2] - halfExtents[2] - ray.origin[2]) * invDir[2];
  const t6 = (center[2] + halfExtents[2] - ray.origin[2]) * invDir[2];
  
  const tmin = Math.max(
    Math.max(Math.min(t1, t2), Math.min(t3, t4)),
    Math.min(t5, t6)
  );
  const tmax = Math.min(
    Math.min(Math.max(t1, t2), Math.max(t3, t4)),
    Math.max(t5, t6)
  );
  
  if (tmax < 0 || tmin > tmax) {
    return { hit: false, t: Infinity };
  }
  
  const t = tmin < 0 ? tmax : tmin;
  
  if (t < 0.001) {
    return { hit: false, t: Infinity };
  }
  
  return { hit: true, t };
}
```

### 8.2 Raycaster (Raycaster.ts)

High-level picking logic.

```typescript
import { SceneObject } from './types';
import {
  Ray,
  Vec3,
  Mat4,
  screenToWorldRay,
  intersectRaySphere,
  intersectRayBox,
  mat3FromRotation,
  mat3Transpose,
  mat3MultiplyVec3,
  sub,
} from './math';

export interface PickResult {
  objectId: string | null;
  point: Vec3 | null;
  distance: number;
}

export class Raycaster {
  // Pick object at screen coordinates
  pick(
    screenX: number,
    screenY: number,
    canvasWidth: number,
    canvasHeight: number,
    cameraPosition: Vec3,
    inverseProjection: Mat4,
    inverseView: Mat4,
    objects: SceneObject[]
  ): PickResult {
    const ray = screenToWorldRay(
      screenX,
      screenY,
      canvasWidth,
      canvasHeight,
      inverseProjection,
      inverseView,
      cameraPosition
    );
    
    return this.pickWithRay(ray, objects);
  }
  
  pickWithRay(ray: Ray, objects: SceneObject[]): PickResult {
    let closestHit: PickResult = {
      objectId: null,
      point: null,
      distance: Infinity,
    };
    
    for (const obj of objects) {
      if (!obj.visible) continue;
      
      // Transform ray to object's local space
      const localRay = this.transformRayToObjectSpace(ray, obj);
      
      let result: { hit: boolean; t: number };
      
      if (obj.type === 'sphere') {
        // For sphere, scale.x is radius
        result = intersectRaySphere(localRay, [0, 0, 0], obj.transform.scale[0]);
      } else {
        // For cuboid, scale is half-extents
        result = intersectRayBox(localRay, [0, 0, 0], obj.transform.scale);
      }
      
      if (result.hit && result.t < closestHit.distance) {
        const point: Vec3 = [
          ray.origin[0] + ray.direction[0] * result.t,
          ray.origin[1] + ray.direction[1] * result.t,
          ray.origin[2] + ray.direction[2] * result.t,
        ];
        
        closestHit = {
          objectId: obj.id,
          point,
          distance: result.t,
        };
      }
    }
    
    return closestHit;
  }
  
  private transformRayToObjectSpace(ray: Ray, obj: SceneObject): Ray {
    // Create inverse rotation matrix
    const rotMat = mat3FromRotation(obj.transform.rotation);
    const invRotMat = mat3Transpose(rotMat);
    
    // Transform origin and direction
    const localOrigin = mat3MultiplyVec3(
      invRotMat,
      sub(ray.origin, obj.transform.position)
    );
    const localDirection = mat3MultiplyVec3(invRotMat, ray.direction);
    
    return {
      origin: localOrigin,
      direction: localDirection,
    };
  }
}

// Singleton instance
export const raycaster = new Raycaster();
```

### 8.3 Selection Visual Feedback

Add selection highlight in the shader using a **Fresnel-based rim glow**. This approach creates a bright edge highlight that's visible on any surface color (unlike a simple tint which can be invisible on blue/white surfaces).

**Why Fresnel Rim Glow?**
- Visible on any material color (white, blue, black, emissive)
- Creates a professional "selected object" look similar to 3D software
- Uses viewing angle to highlight edges naturally
- Brighter at silhouette edges, subtle at center

Update raytracer.wgsl to accept selected object ID and apply rim highlight:

```wgsl
struct RenderSettings {
  frameIndex: u32,
  samplesPerPixel: u32,
  maxBounces: u32,
  flags: u32,
  selectedObjectIndex: i32,  // NEW: -1 if none selected
  _pad: vec3<u32>,
}

// In main function, after path tracing but before tone mapping:
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  // ... ray generation and path tracing ...
  
  // Check if first hit is selected object
  let firstHit = traceScene(ray);
  let isSelectedHit = firstHit.hit && firstHit.objectIndex == settings.selectedObjectIndex;
  
  // Path trace
  var color = trace(ray, &rng);
  
  // Apply selection highlight using Fresnel-based rim glow
  if (isSelectedHit) {
    // Calculate rim factor based on viewing angle (Fresnel-like effect)
    let viewDir = -ray.direction;
    let rimFactor = 1.0 - abs(dot(viewDir, firstHit.normal));
    
    // Create bright rim glow that's stronger at edges
    let rimPower = pow(rimFactor, 2.5);  // Sharper falloff for cleaner edge
    let rimColor = vec3<f32>(0.3, 0.7, 1.0);  // Bright cyan-blue
    let rimGlow = rimColor * rimPower * 1.5;
    
    // Add rim glow to the color
    color += rimGlow;
  }
  
  // ... tone mapping and output ...
}
```

### 8.4 Updated Canvas.tsx with Click Handling

```tsx
import { useRef, useEffect, useCallback } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { useCameraStore } from '../store/cameraStore';
import { raycaster } from '../core/Raycaster';
import { mat4Inverse, mat4Perspective } from '../core/math';

export function Canvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  
  const { objects, selectObject } = useSceneStore();
  const cameraState = useCameraStore();
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Don't select if this was a drag
    // (handled by comparing with mousedown position if needed)
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Get camera matrices
    const viewMatrix = cameraState.getViewMatrix();
    const projMatrix = mat4Perspective(
      cameraState.fovY,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    const inverseView = mat4Inverse(viewMatrix);
    const inverseProjection = mat4Inverse(projMatrix);
    
    // Perform picking
    const result = raycaster.pick(
      x,
      y,
      canvas.width / devicePixelRatio,
      canvas.height / devicePixelRatio,
      cameraState.position,
      inverseProjection,
      inverseView,
      objects
    );
    
    // Update selection
    selectObject(result.objectId);
  }, [objects, cameraState, selectObject]);
  
  // Differentiate click from drag
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD = 5;
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseDownPos.current) return;
    
    const dx = e.clientX - mouseDownPos.current.x;
    const dy = e.clientY - mouseDownPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < DRAG_THRESHOLD) {
      handleClick(e);
    }
    
    mouseDownPos.current = null;
  }, [handleClick]);
  
  // ... rest of Canvas component (WebGPU init, resize, etc.)
  
  return (
    <canvas
      ref={canvasRef}
      className={className}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      tabIndex={0}
    />
  );
}
```

### 8.5 Keyboard Deselection

Handle Escape key to deselect:

```typescript
// In CameraController.ts or a separate KeyboardHandler
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    useSceneStore.getState().selectObject(null);
  }
});
```

### 8.6 Sync Selection to GPU

In Renderer, pass selected object index to shader:

```typescript
// Find index of selected object
const selectedId = useSceneStore.getState().selectedObjectId;
const objects = useSceneStore.getState().objects;
const selectedIndex = objects.findIndex(o => o.id === selectedId);

// Update settings uniform
const settings = new Int32Array([
  frameIndex,
  1,  // samples per pixel
  8,  // max bounces
  1,  // flags
  selectedIndex,  // -1 if not found
  0, 0, 0,  // padding
]);
```

---

## Testing Requirements

### Manual Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T8.1 | Click to select | Click on a sphere | Sphere selected, highlighted |
| T8.2 | Click to select cuboid | Click on a cuboid | Cuboid selected, highlighted |
| T8.3 | Click empty space | Click where no object | Selection cleared |
| T8.4 | Selection sync | Select via click | Object highlighted in list too |
| T8.5 | Escape deselect | Press Escape | Selection cleared |
| T8.6 | Occluded object | Click where objects overlap | Front object selected |
| T8.7 | Rotated object | Rotate object, then click | Correct hit detection |
| T8.8 | Scaled object | Scale object, then click | Correct hit detection |
| T8.9 | Drag vs click | Click and drag | No selection change if dragging |
| T8.10 | Select from list | Click object in list | Same as clicking in viewport |

### Edge Cases

| Test ID | Description | Expected |
|---------|-------------|----------|
| T8.E1 | Click on hidden object | No selection (respects visibility) |
| T8.E2 | Empty scene | Click does nothing |
| T8.E3 | Click outside canvas | No effect |

---

## Acceptance Criteria

- [ ] Clicking on object selects it
- [ ] Clicking empty space deselects
- [ ] Selection visually highlighted in viewport
- [ ] Selection synced with object list
- [ ] Escape key clears selection
- [ ] Works correctly with rotated/scaled objects
- [ ] Front-most object selected when overlapping
- [ ] Hidden objects cannot be selected
- [ ] Click vs drag properly distinguished

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/core/math.ts` | Update | Add ray intersection functions |
| `src/core/Raycaster.ts` | Create | Picking logic |
| `src/components/Canvas.tsx` | Update | Click handling |
| `src/renderer/shaders/raytracer.wgsl` | Update | Selection highlight |
| `src/renderer/RaytracingPipeline.ts` | Update | Pass selected index |

---

## Definition of Done

Stage 8 is complete when:
1. Objects can be selected by clicking in viewport
2. Selected object has visual feedback (highlight/tint)
3. Selection state syncs between viewport and object list
4. Escape clears selection
5. Picking works correctly with transformed objects

