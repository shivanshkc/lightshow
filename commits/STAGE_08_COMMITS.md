# Stage 8: Object Selection & Picking — Commits

## Overview
**Total Commits:** 4  
**Stage Goal:** Click-to-select objects via raycasting.

---

## Commit 8.1: Add ray intersection functions to math.ts

### Description
CPU-side ray-sphere and ray-box intersection for picking.

### Files to Modify
```
src/core/math.ts
src/__tests__/math.test.ts
```

### Key Implementation
```typescript
export interface Ray {
  origin: Vec3;
  direction: Vec3;
}

export function screenToWorldRay(
  screenX: number, screenY: number,
  width: number, height: number,
  invProj: Mat4, invView: Mat4,
  camPos: Vec3
): Ray {
  const ndcX = (screenX / width) * 2 - 1;
  const ndcY = 1 - (screenY / height) * 2;
  
  const clipPoint = [ndcX, ndcY, -1, 1] as Vec4;
  let eyePoint = mat4MultiplyVec4(invProj, clipPoint);
  eyePoint = [eyePoint[0], eyePoint[1], -1, 0];
  const worldDir = mat4MultiplyVec4(invView, eyePoint);
  
  return { origin: camPos, direction: normalize([worldDir[0], worldDir[1], worldDir[2]]) };
}

export function intersectRaySphere(ray: Ray, center: Vec3, radius: number): { hit: boolean; t: number } {
  const oc = sub(ray.origin, center);
  const a = dot(ray.direction, ray.direction);
  const b = 2 * dot(oc, ray.direction);
  const c = dot(oc, oc) - radius * radius;
  const disc = b * b - 4 * a * c;
  
  if (disc < 0) return { hit: false, t: Infinity };
  
  const sqrtD = Math.sqrt(disc);
  let t = (-b - sqrtD) / (2 * a);
  if (t < 0.001) t = (-b + sqrtD) / (2 * a);
  if (t < 0.001) return { hit: false, t: Infinity };
  
  return { hit: true, t };
}

export function intersectRayBox(ray: Ray, center: Vec3, halfExtents: Vec3): { hit: boolean; t: number } {
  const invDir = [1/ray.direction[0], 1/ray.direction[1], 1/ray.direction[2]] as Vec3;
  const t1 = mul(sub(sub(center, halfExtents), ray.origin), invDir);
  const t2 = mul(sub(add(center, halfExtents), ray.origin), invDir);
  
  const tMin = [Math.min(t1[0],t2[0]), Math.min(t1[1],t2[1]), Math.min(t1[2],t2[2])];
  const tMax = [Math.max(t1[0],t2[0]), Math.max(t1[1],t2[1]), Math.max(t1[2],t2[2])];
  
  const tNear = Math.max(tMin[0], tMin[1], tMin[2]);
  const tFar = Math.min(tMax[0], tMax[1], tMax[2]);
  
  if (tNear > tFar || tFar < 0) return { hit: false, t: Infinity };
  return { hit: true, t: tNear < 0 ? tFar : tNear };
}
```

### Test Cases
```typescript
describe('Ray intersections', () => {
  it('ray hits sphere at origin', () => {
    const ray: Ray = { origin: [0, 0, 5], direction: [0, 0, -1] };
    const result = intersectRaySphere(ray, [0, 0, 0], 1);
    expect(result.hit).toBe(true);
    expect(result.t).toBeCloseTo(4); // 5 - 1 = 4
  });
  
  it('ray misses sphere', () => {
    const ray: Ray = { origin: [0, 0, 5], direction: [0, 1, 0] }; // Points up
    const result = intersectRaySphere(ray, [0, 0, 0], 1);
    expect(result.hit).toBe(false);
  });
  
  it('ray hits box', () => {
    const ray: Ray = { origin: [0, 0, 5], direction: [0, 0, -1] };
    const result = intersectRayBox(ray, [0, 0, 0], [1, 1, 1]);
    expect(result.hit).toBe(true);
    expect(result.t).toBeCloseTo(4);
  });
  
  it('screenToWorldRay creates valid ray', () => {
    const invProj = mat4Identity(); // Simplified
    const invView = mat4Identity();
    const ray = screenToWorldRay(400, 300, 800, 600, invProj, invView, [0, 0, 5]);
    expect(length(ray.direction)).toBeCloseTo(1);
  });
});
```

### Commit Message
```
feat(math): add ray intersection functions for picking
```

---

## Commit 8.2: Create Raycaster utility class

### Description
High-level picking logic that tests against scene objects.

### Files to Create
```
src/core/Raycaster.ts
src/__tests__/Raycaster.test.ts
```

### Key Implementation
```typescript
export interface PickResult {
  objectId: string | null;
  point: Vec3 | null;
  distance: number;
}

export class Raycaster {
  pick(
    screenX: number, screenY: number,
    canvasWidth: number, canvasHeight: number,
    camPos: Vec3, invProj: Mat4, invView: Mat4,
    objects: SceneObject[]
  ): PickResult {
    const ray = screenToWorldRay(screenX, screenY, canvasWidth, canvasHeight, invProj, invView, camPos);
    return this.pickWithRay(ray, objects);
  }
  
  pickWithRay(ray: Ray, objects: SceneObject[]): PickResult {
    let closest: PickResult = { objectId: null, point: null, distance: Infinity };
    
    for (const obj of objects) {
      if (!obj.visible) continue;
      
      const localRay = this.transformRayToObjectSpace(ray, obj);
      let result: { hit: boolean; t: number };
      
      if (obj.type === 'sphere') {
        result = intersectRaySphere(localRay, [0,0,0], obj.transform.scale[0]);
      } else {
        result = intersectRayBox(localRay, [0,0,0], obj.transform.scale);
      }
      
      if (result.hit && result.t < closest.distance) {
        closest = {
          objectId: obj.id,
          point: add(ray.origin, mul(ray.direction, result.t)),
          distance: result.t,
        };
      }
    }
    return closest;
  }
  
  private transformRayToObjectSpace(ray: Ray, obj: SceneObject): Ray {
    // Apply inverse rotation and translation
  }
}

export const raycaster = new Raycaster();
```

### Test Cases
```typescript
describe('Raycaster', () => {
  it('picks closest object', () => {
    const objects: SceneObject[] = [
      { id: 'a', type: 'sphere', transform: { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] }, visible: true, /* ... */ },
      { id: 'b', type: 'sphere', transform: { position: [0,0,2], rotation: [0,0,0], scale: [1,1,1] }, visible: true, /* ... */ },
    ];
    
    const ray: Ray = { origin: [0, 0, 5], direction: [0, 0, -1] };
    const result = raycaster.pickWithRay(ray, objects);
    
    expect(result.objectId).toBe('b'); // Closer sphere
  });
  
  it('ignores hidden objects', () => {
    const objects: SceneObject[] = [
      { id: 'a', type: 'sphere', transform: { position: [0,0,0], scale: [1,1,1] }, visible: false, /* ... */ },
    ];
    
    const ray: Ray = { origin: [0, 0, 5], direction: [0, 0, -1] };
    const result = raycaster.pickWithRay(ray, objects);
    
    expect(result.objectId).toBeNull();
  });
  
  it('returns null when nothing hit', () => {
    const result = raycaster.pickWithRay({ origin: [0,0,5], direction: [0,1,0] }, []);
    expect(result.objectId).toBeNull();
  });
});
```

### Commit Message
```
feat(core): create Raycaster for object picking
```

---

## Commit 8.3: Implement click-to-select in Canvas

### Description
Handle mouse clicks to select objects in viewport.

### Files to Modify
```
src/components/Canvas.tsx
```

### Key Implementation
```typescript
const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const cam = useCameraStore.getState();
  const invView = mat4Inverse(mat4LookAt(cam.position, cam.target, cam.up));
  const invProj = mat4Inverse(mat4Perspective(cam.fovY, canvas.width/canvas.height, 0.1, 1000));
  
  const result = raycaster.pick(
    x, y, rect.width, rect.height,
    cam.position, invProj, invView,
    useSceneStore.getState().objects
  );
  
  useSceneStore.getState().selectObject(result.objectId);
}, []);

// Distinguish click from drag
const mouseDownPos = useRef<{x:number,y:number}|null>(null);
const DRAG_THRESHOLD = 5;

const handleMouseDown = (e: React.MouseEvent) => {
  mouseDownPos.current = { x: e.clientX, y: e.clientY };
};

const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!mouseDownPos.current) return;
  const dx = e.clientX - mouseDownPos.current.x;
  const dy = e.clientY - mouseDownPos.current.y;
  if (Math.sqrt(dx*dx + dy*dy) < DRAG_THRESHOLD) {
    handleClick(e);
  }
  mouseDownPos.current = null;
};
```

### Test Cases
```typescript
describe('Canvas selection', () => {
  it('clicking canvas attempts to pick object', () => {
    const pickSpy = vi.spyOn(raycaster, 'pick');
    
    render(<Canvas />);
    // Simulate click
    
    expect(pickSpy).toHaveBeenCalled();
  });
  
  it('does not select on drag', () => {
    // Simulate mousedown, move 100px, mouseup
    // Selection should not change
  });
});
```

### Commit Message
```
feat(canvas): implement click-to-select via raycasting
```

---

## Commit 8.4: Add Escape to deselect and selection highlight

### Description
Escape key deselects, shader highlights selected object.

### Files to Modify
```
src/core/CameraController.ts  # Add Escape handler
src/renderer/shaders/raytracer.wgsl  # Selection highlight
```

### Key Implementation
```typescript
// CameraController.ts
if (e.key === 'Escape') {
  useSceneStore.getState().selectObject(null);
}

// raytracer.wgsl
struct RenderSettings {
  // ... existing fields
  selectedObjectIndex: i32,
}

fn shade(hit: HitResult, ray: Ray) -> vec3<f32> {
  // ... existing shading
  
  // Selection highlight
  if (hit.objectIndex == settings.selectedObjectIndex) {
    color = mix(color, vec3<f32>(0.4, 0.6, 1.0), 0.15);
  }
  
  return color;
}
```

### Test Cases
```typescript
describe('Selection', () => {
  it('Escape clears selection', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().selectObject(id);
    
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    
    expect(useSceneStore.getState().selectedObjectId).toBeNull();
  });
});

describe('Selection shader', () => {
  it('shader has selection highlight', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('selectedObjectIndex');
  });
});
```

### Manual Testing
1. Add objects, click on one → selected, highlighted
2. Click empty space → deselected
3. Press Escape → deselected
4. Click overlapping objects → front one selected

### Commit Message
```
feat(selection): add Escape to deselect and visual highlight

Stage 8 complete: Object selection via picking
```

---

## Stage 8 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 8.1 | Ray intersections | Sphere/box hit tests |
| 8.2 | Raycaster class | Pick closest, ignore hidden |
| 8.3 | Click-to-select | Canvas click handling |
| 8.4 | Escape + highlight | Keyboard, shader |

