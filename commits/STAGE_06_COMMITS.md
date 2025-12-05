# Stage 6: Camera Controls — Commits

## Overview
**Total Commits:** 4  
**Stage Goal:** Orbit, pan, zoom camera controls with keyboard shortcuts.

---

## Commit 6.1: Create camera store with orbit state

### Description
Zustand store for camera with orbit camera model.

### Files to Create
```
src/store/cameraStore.ts
src/__tests__/cameraStore.test.ts
```

### Key Implementation
```typescript
import { create } from 'zustand';
import { Vec3, mat4LookAt, mat4Inverse } from '../core/math';

interface CameraState {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fovY: number;
  distance: number;
  azimuth: number;
  elevation: number;
  
  orbit: (deltaAzimuth: number, deltaElevation: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (delta: number) => void;
  focusOn: (point: Vec3, distance?: number) => void;
  reset: () => void;
}

const DEFAULT = { distance: 8, azimuth: Math.PI/4, elevation: Math.PI/6, target: [0,0,0] as Vec3 };
const LIMITS = { minDist: 0.5, maxDist: 100, minElev: -Math.PI/2+0.1, maxElev: Math.PI/2-0.1 };

function calcPosition(target: Vec3, dist: number, az: number, el: number): Vec3 {
  return [
    target[0] + dist * Math.cos(el) * Math.sin(az),
    target[1] + dist * Math.sin(el),
    target[2] + dist * Math.cos(el) * Math.cos(az),
  ];
}

export const useCameraStore = create<CameraState>((set, get) => ({
  position: calcPosition(DEFAULT.target, DEFAULT.distance, DEFAULT.azimuth, DEFAULT.elevation),
  target: DEFAULT.target,
  up: [0, 1, 0],
  fovY: Math.PI / 3,
  distance: DEFAULT.distance,
  azimuth: DEFAULT.azimuth,
  elevation: DEFAULT.elevation,
  
  orbit: (dAz, dEl) => set(s => {
    const az = s.azimuth + dAz;
    const el = Math.max(LIMITS.minElev, Math.min(LIMITS.maxElev, s.elevation + dEl));
    return { azimuth: az, elevation: el, position: calcPosition(s.target, s.distance, az, el) };
  }),
  
  pan: (dx, dy) => set(s => {
    const scale = s.distance * 0.002;
    // Calculate right/up vectors and apply pan
    // ... implementation
  }),
  
  zoom: (delta) => set(s => {
    const d = Math.max(LIMITS.minDist, Math.min(LIMITS.maxDist, s.distance * (1 - delta * 0.001)));
    return { distance: d, position: calcPosition(s.target, d, s.azimuth, s.elevation) };
  }),
  
  focusOn: (point, dist) => set(s => {
    const d = dist ?? s.distance;
    return { target: point, distance: d, position: calcPosition(point, d, s.azimuth, s.elevation) };
  }),
  
  reset: () => set({
    target: DEFAULT.target,
    distance: DEFAULT.distance,
    azimuth: DEFAULT.azimuth,
    elevation: DEFAULT.elevation,
    position: calcPosition(DEFAULT.target, DEFAULT.distance, DEFAULT.azimuth, DEFAULT.elevation),
  }),
}));
```

### Test Cases
```typescript
describe('cameraStore', () => {
  beforeEach(() => useCameraStore.getState().reset());
  
  it('has default position above and in front of origin', () => {
    const { position } = useCameraStore.getState();
    expect(position[1]).toBeGreaterThan(0); // Above
    expect(position[2]).toBeGreaterThan(0); // In front
  });
  
  it('orbit changes azimuth and elevation', () => {
    const before = useCameraStore.getState().azimuth;
    useCameraStore.getState().orbit(0.1, 0);
    expect(useCameraStore.getState().azimuth).not.toBe(before);
  });
  
  it('clamps elevation to prevent gimbal lock', () => {
    useCameraStore.getState().orbit(0, 10); // Large elevation
    const { elevation } = useCameraStore.getState();
    expect(elevation).toBeLessThan(Math.PI / 2);
  });
  
  it('zoom respects min/max distance', () => {
    useCameraStore.getState().zoom(-100000); // Try to zoom way out
    expect(useCameraStore.getState().distance).toBeLessThanOrEqual(100);
    
    useCameraStore.getState().zoom(100000); // Try to zoom way in
    expect(useCameraStore.getState().distance).toBeGreaterThanOrEqual(0.5);
  });
  
  it('focusOn updates target', () => {
    useCameraStore.getState().focusOn([5, 0, 0]);
    expect(useCameraStore.getState().target).toEqual([5, 0, 0]);
  });
  
  it('reset restores defaults', () => {
    useCameraStore.getState().orbit(1, 1);
    useCameraStore.getState().reset();
    expect(useCameraStore.getState().azimuth).toBe(Math.PI / 4);
  });
});
```

### Commit Message
```
feat(store): create camera store with orbit model
```

---

## Commit 6.2: Create CameraController for mouse input

### Description
Handle mouse events for orbit, pan, zoom.

### Files to Create
```
src/core/CameraController.ts
src/__tests__/CameraController.test.ts
```

### Key Implementation
```typescript
export class CameraController {
  private canvas: HTMLCanvasElement;
  private isDragging = false;
  private dragButton = -1;
  private lastX = 0;
  private lastY = 0;
  private isShiftDown = false;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.attach();
  }
  
  private attach(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }
  
  private onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.dragButton = e.button;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  };
  
  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    
    const camera = useCameraStore.getState();
    if (this.dragButton === 1 || (this.dragButton === 0 && this.isShiftDown)) {
      camera.pan(dx, dy);
    } else if (this.dragButton === 0) {
      camera.orbit(-dx * 0.005, -dy * 0.005);
    }
  };
  
  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    useCameraStore.getState().zoom(e.deltaY);
  };
  
  destroy(): void { /* remove listeners */ }
}
```

### Test Cases
```typescript
describe('CameraController', () => {
  it('attaches event listeners to canvas', () => {
    const canvas = document.createElement('canvas');
    const addSpy = vi.spyOn(canvas, 'addEventListener');
    
    new CameraController(canvas);
    
    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false });
  });
  
  it('removes listeners on destroy', () => {
    const canvas = document.createElement('canvas');
    const removeSpy = vi.spyOn(canvas, 'removeEventListener');
    
    const ctrl = new CameraController(canvas);
    ctrl.destroy();
    
    expect(removeSpy).toHaveBeenCalled();
  });
});
```

### Commit Message
```
feat(core): add CameraController for mouse interaction
```

---

## Commit 6.3: Integrate camera with renderer

### Description
Connect camera store to renderer, update each frame.

### Files to Modify
```
src/renderer/Renderer.ts
src/components/Canvas.tsx
```

### Key Implementation
```typescript
// Renderer.ts
class Renderer {
  private cameraUnsubscribe: () => void;
  
  constructor(ctx: WebGPUContext) {
    // Subscribe to camera changes for accumulation reset
    this.cameraUnsubscribe = useCameraStore.subscribe(() => {
      this.raytracingPipeline.resetAccumulation();
    });
  }
  
  private render = (): void => {
    const cam = useCameraStore.getState();
    this.raytracingPipeline.updateCamera({
      position: cam.position,
      target: cam.target,
      fovY: cam.fovY,
      aspect: this.width / this.height,
    });
    // ... rest of render
  };
}

// Canvas.tsx
useEffect(() => {
  const ctrl = new CameraController(canvas);
  return () => ctrl.destroy();
}, []);
```

### Test Cases
```typescript
describe('Camera-Renderer integration', () => {
  it('renderer resets accumulation on camera change', () => {
    const resetSpy = vi.fn();
    // Mock raytracingPipeline.resetAccumulation
    
    useCameraStore.getState().orbit(0.1, 0);
    
    // Verify reset was called
  });
});
```

### Manual Testing
1. Left-drag: Orbit around scene
2. Middle-drag or Shift+left-drag: Pan
3. Scroll: Zoom in/out
4. Verify accumulation resets on any camera movement

### Commit Message
```
feat(renderer): integrate camera store with renderer
```

---

## Commit 6.4: Add keyboard shortcuts for camera

### Description
F to focus on selection, Home to reset camera.

### Files to Modify
```
src/core/CameraController.ts
```

### Key Implementation
```typescript
private onKeyDown = (e: KeyboardEvent): void => {
  if (e.target instanceof HTMLInputElement) return;
  
  if (e.key === 'Shift') this.isShiftDown = true;
  
  if (e.key === 'Home') {
    useCameraStore.getState().reset();
  }
  
  if (e.key === 'f' || e.key === 'F') {
    const selected = useSceneStore.getState().getSelectedObject();
    if (selected) {
      useCameraStore.getState().focusOn(selected.transform.position);
    }
  }
};
```

### Test Cases
```typescript
describe('Camera keyboard shortcuts', () => {
  it('Home resets camera', () => {
    useCameraStore.getState().orbit(1, 1);
    const before = useCameraStore.getState().azimuth;
    
    // Simulate Home key
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    
    expect(useCameraStore.getState().azimuth).not.toBe(before);
  });
  
  it('F focuses on selected object', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().updateTransform(id, { position: [5, 0, 0] });
    useSceneStore.getState().selectObject(id);
    
    // Simulate F key
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
    
    expect(useCameraStore.getState().target).toEqual([5, 0, 0]);
  });
});
```

### Commit Message
```
feat(camera): add keyboard shortcuts (Home, F)

Stage 6 complete: Full camera controls
```

---

## Stage 6 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 6.1 | Camera store | Orbit/pan/zoom state |
| 6.2 | CameraController | Mouse input handling |
| 6.3 | Renderer integration | Accumulation reset |
| 6.4 | Keyboard shortcuts | Home, F keys |

