# Stage 6: Camera Controls

## Objective
Implement intuitive camera controls that allow users to orbit, pan, and zoom to explore the 3D scene. The camera should feel responsive and follow standard 3D application conventions.

---

## Prerequisites
- Stage 5 completed (materials working)
- Basic camera struct exists from Stage 2

---

## Control Scheme

| Input | Action | Modifier |
|-------|--------|----------|
| Left mouse drag | Orbit around target | None |
| Middle mouse drag | Pan camera | None |
| Shift + Left drag | Pan camera | Shift |
| Scroll wheel | Zoom in/out | None |
| Double-click object | Focus on object | None |
| Home key | Reset camera | None |
| F key | Focus on selected | Selection required |

---

## Project Structure Changes

```
src/
├── core/
│   ├── Camera.ts           # UPDATE: add control methods
│   └── CameraController.ts # NEW: input handling
├── components/
│   └── Canvas.tsx          # UPDATE: attach camera controller
├── store/
│   └── cameraStore.ts      # NEW: camera state store
```

---

## Detailed Implementation

### 6.1 Camera Store (cameraStore.ts)

Zustand store for camera state.

```typescript
import { create } from 'zustand';
import { Vec3 } from '../core/math';

interface CameraState {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fovY: number;
  
  // Derived for orbit camera
  distance: number;      // Distance from target
  azimuth: number;       // Horizontal angle (radians)
  elevation: number;     // Vertical angle (radians)
  
  // Actions
  orbit: (deltaAzimuth: number, deltaElevation: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (delta: number) => void;
  focusOn: (point: Vec3, distance?: number) => void;
  reset: () => void;
  
  // Getters
  getViewMatrix: () => Mat4;
  getInverseViewMatrix: () => Mat4;
}

const DEFAULT_DISTANCE = 8;
const DEFAULT_AZIMUTH = Math.PI / 4;     // 45 degrees
const DEFAULT_ELEVATION = Math.PI / 6;   // 30 degrees
const DEFAULT_TARGET: Vec3 = [0, 0, 0];

const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 100;
const MIN_ELEVATION = -Math.PI / 2 + 0.1;  // Prevent gimbal lock
const MAX_ELEVATION = Math.PI / 2 - 0.1;

function calculatePosition(target: Vec3, distance: number, azimuth: number, elevation: number): Vec3 {
  const x = target[0] + distance * Math.cos(elevation) * Math.sin(azimuth);
  const y = target[1] + distance * Math.sin(elevation);
  const z = target[2] + distance * Math.cos(elevation) * Math.cos(azimuth);
  return [x, y, z];
}

export const useCameraStore = create<CameraState>((set, get) => ({
  position: calculatePosition(DEFAULT_TARGET, DEFAULT_DISTANCE, DEFAULT_AZIMUTH, DEFAULT_ELEVATION),
  target: DEFAULT_TARGET,
  up: [0, 1, 0],
  fovY: Math.PI / 3,  // 60 degrees
  
  distance: DEFAULT_DISTANCE,
  azimuth: DEFAULT_AZIMUTH,
  elevation: DEFAULT_ELEVATION,
  
  orbit: (deltaAzimuth, deltaElevation) => {
    set(state => {
      const newAzimuth = state.azimuth + deltaAzimuth;
      const newElevation = Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, state.elevation + deltaElevation));
      const newPosition = calculatePosition(state.target, state.distance, newAzimuth, newElevation);
      
      return {
        azimuth: newAzimuth,
        elevation: newElevation,
        position: newPosition,
      };
    });
  },
  
  pan: (deltaX, deltaY) => {
    set(state => {
      // Calculate camera right and up vectors
      const forward = normalize(sub(state.target, state.position));
      const right = normalize(cross(forward, state.up));
      const up = normalize(cross(right, forward));
      
      // Scale pan by distance for consistent feel
      const scale = state.distance * 0.002;
      
      const panOffset: Vec3 = [
        (right[0] * -deltaX + up[0] * deltaY) * scale,
        (right[1] * -deltaX + up[1] * deltaY) * scale,
        (right[2] * -deltaX + up[2] * deltaY) * scale,
      ];
      
      const newTarget: Vec3 = [
        state.target[0] + panOffset[0],
        state.target[1] + panOffset[1],
        state.target[2] + panOffset[2],
      ];
      
      const newPosition = calculatePosition(newTarget, state.distance, state.azimuth, state.elevation);
      
      return {
        target: newTarget,
        position: newPosition,
      };
    });
  },
  
  zoom: (delta) => {
    set(state => {
      const zoomFactor = 1 - delta * 0.001;
      const newDistance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, state.distance * zoomFactor));
      const newPosition = calculatePosition(state.target, newDistance, state.azimuth, state.elevation);
      
      return {
        distance: newDistance,
        position: newPosition,
      };
    });
  },
  
  focusOn: (point, distance) => {
    set(state => {
      const newDistance = distance ?? state.distance;
      const newPosition = calculatePosition(point, newDistance, state.azimuth, state.elevation);
      
      return {
        target: point,
        distance: newDistance,
        position: newPosition,
      };
    });
  },
  
  reset: () => {
    set({
      target: DEFAULT_TARGET,
      distance: DEFAULT_DISTANCE,
      azimuth: DEFAULT_AZIMUTH,
      elevation: DEFAULT_ELEVATION,
      position: calculatePosition(DEFAULT_TARGET, DEFAULT_DISTANCE, DEFAULT_AZIMUTH, DEFAULT_ELEVATION),
    });
  },
  
  getViewMatrix: () => {
    const state = get();
    return mat4LookAt(state.position, state.target, state.up);
  },
  
  getInverseViewMatrix: () => {
    const state = get();
    return mat4Inverse(mat4LookAt(state.position, state.target, state.up));
  },
}));
```

### 6.2 Camera Controller (CameraController.ts)

Handles mouse and keyboard input.

```typescript
import { useCameraStore } from '../store/cameraStore';
import { useSceneStore } from '../store/sceneStore';

interface ControllerOptions {
  orbitSensitivity?: number;
  panSensitivity?: number;
  zoomSensitivity?: number;
}

export class CameraController {
  private canvas: HTMLCanvasElement;
  private options: Required<ControllerOptions>;
  
  private isDragging = false;
  private dragButton = -1;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private isShiftDown = false;
  
  private boundHandlers: {
    mousedown: (e: MouseEvent) => void;
    mousemove: (e: MouseEvent) => void;
    mouseup: (e: MouseEvent) => void;
    wheel: (e: WheelEvent) => void;
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
    dblclick: (e: MouseEvent) => void;
    contextmenu: (e: Event) => void;
  };
  
  constructor(canvas: HTMLCanvasElement, options: ControllerOptions = {}) {
    this.canvas = canvas;
    this.options = {
      orbitSensitivity: options.orbitSensitivity ?? 0.005,
      panSensitivity: options.panSensitivity ?? 1,
      zoomSensitivity: options.zoomSensitivity ?? 1,
    };
    
    // Bind handlers
    this.boundHandlers = {
      mousedown: this.onMouseDown.bind(this),
      mousemove: this.onMouseMove.bind(this),
      mouseup: this.onMouseUp.bind(this),
      wheel: this.onWheel.bind(this),
      keydown: this.onKeyDown.bind(this),
      keyup: this.onKeyUp.bind(this),
      dblclick: this.onDoubleClick.bind(this),
      contextmenu: (e) => e.preventDefault(),
    };
    
    this.attach();
  }
  
  attach(): void {
    this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
    this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
    this.canvas.addEventListener('mouseup', this.boundHandlers.mouseup);
    this.canvas.addEventListener('mouseleave', this.boundHandlers.mouseup);
    this.canvas.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });
    this.canvas.addEventListener('dblclick', this.boundHandlers.dblclick);
    this.canvas.addEventListener('contextmenu', this.boundHandlers.contextmenu);
    window.addEventListener('keydown', this.boundHandlers.keydown);
    window.addEventListener('keyup', this.boundHandlers.keyup);
  }
  
  detach(): void {
    this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
    this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
    this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseup);
    this.canvas.removeEventListener('mouseleave', this.boundHandlers.mouseup);
    this.canvas.removeEventListener('wheel', this.boundHandlers.wheel);
    this.canvas.removeEventListener('dblclick', this.boundHandlers.dblclick);
    this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
    window.removeEventListener('keydown', this.boundHandlers.keydown);
    window.removeEventListener('keyup', this.boundHandlers.keyup);
  }
  
  private onMouseDown(e: MouseEvent): void {
    // Don't capture if clicking on UI
    if (e.target !== this.canvas) return;
    
    this.isDragging = true;
    this.dragButton = e.button;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    
    this.canvas.style.cursor = e.button === 1 || this.isShiftDown ? 'move' : 'grab';
  }
  
  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    
    const camera = useCameraStore.getState();
    
    if (this.dragButton === 1 || (this.dragButton === 0 && this.isShiftDown)) {
      // Middle button or Shift+Left = Pan
      camera.pan(deltaX * this.options.panSensitivity, deltaY * this.options.panSensitivity);
    } else if (this.dragButton === 0) {
      // Left button = Orbit
      camera.orbit(
        -deltaX * this.options.orbitSensitivity,
        -deltaY * this.options.orbitSensitivity
      );
    }
  }
  
  private onMouseUp(e: MouseEvent): void {
    this.isDragging = false;
    this.dragButton = -1;
    this.canvas.style.cursor = 'default';
  }
  
  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const camera = useCameraStore.getState();
    camera.zoom(e.deltaY * this.options.zoomSensitivity);
  }
  
  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Shift') {
      this.isShiftDown = true;
    }
    
    if (e.key === 'Home') {
      useCameraStore.getState().reset();
    }
    
    if (e.key === 'f' || e.key === 'F') {
      const selectedObject = useSceneStore.getState().getSelectedObject();
      if (selectedObject) {
        useCameraStore.getState().focusOn(selectedObject.transform.position);
      }
    }
  }
  
  private onKeyUp(e: KeyboardEvent): void {
    if (e.key === 'Shift') {
      this.isShiftDown = false;
    }
  }
  
  private onDoubleClick(e: MouseEvent): void {
    // TODO: Raycast to find clicked object and focus on it
    // For now, just reset to origin
    useCameraStore.getState().focusOn([0, 0, 0]);
  }
  
  destroy(): void {
    this.detach();
  }
}
```

### 6.3 Updated Canvas.tsx

Integrate camera controller.

```tsx
import { useEffect, useRef } from 'react';
import { CameraController } from '../core/CameraController';
import { useCameraStore } from '../store/cameraStore';

export function Canvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<CameraController | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Initialize WebGPU and renderer
    initWebGPU(canvas).then(context => {
      rendererRef.current = new Renderer(context);
      rendererRef.current.start();
    });
    
    // Initialize camera controller
    controllerRef.current = new CameraController(canvas);
    
    // Subscribe to camera changes to reset accumulation
    const unsubscribe = useCameraStore.subscribe(() => {
      rendererRef.current?.resetAccumulation();
    });
    
    return () => {
      controllerRef.current?.destroy();
      rendererRef.current?.destroy();
      unsubscribe();
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className={className}
      tabIndex={0}
    />
  );
}
```

### 6.4 Sync Camera to GPU

In Renderer.ts, sync camera state to GPU each frame.

```typescript
private render(): void {
  // Get camera state
  const cameraState = useCameraStore.getState();
  
  // Update camera uniform buffer
  this.raytracingPipeline.updateCamera({
    position: cameraState.position,
    inverseView: cameraState.getInverseViewMatrix(),
    inverseProjection: mat4Inverse(
      mat4Perspective(cameraState.fovY, this.aspect, 0.1, 1000)
    ),
  });
  
  // ... rest of render
}
```

---

## Testing Requirements

### Manual Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| T6.1 | Orbit horizontal | Left-drag left/right | Camera rotates around target horizontally |
| T6.2 | Orbit vertical | Left-drag up/down | Camera rotates around target vertically |
| T6.3 | Elevation limits | Drag to extreme angles | Camera stops before going upside-down |
| T6.4 | Pan | Middle-drag or Shift+Left-drag | Camera moves parallel to view plane |
| T6.5 | Zoom in | Scroll down | Camera moves closer |
| T6.6 | Zoom out | Scroll up | Camera moves further |
| T6.7 | Zoom limits | Extreme scrolling | Camera doesn't go inside objects or infinitely far |
| T6.8 | Focus on object | Press F with selection | Camera centers on selected object |
| T6.9 | Reset camera | Press Home | Camera returns to default position |
| T6.10 | Double-click | Double-click | Camera focuses on clicked point/object |
| T6.11 | Accumulation reset | Any camera movement | Image resets and re-accumulates |

### Feel Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| T6.F1 | Responsiveness | No perceptible lag between input and camera update |
| T6.F2 | Smoothness | Movement feels fluid, not jerky |
| T6.F3 | Predictability | Camera moves in expected direction |
| T6.F4 | Cursor feedback | Cursor changes to indicate drag mode |

---

## Acceptance Criteria

- [ ] Orbit camera works with left mouse drag
- [ ] Pan camera works with middle mouse or Shift+left drag
- [ ] Zoom works with scroll wheel
- [ ] Camera has reasonable min/max limits
- [ ] Focus on selected object works (F key)
- [ ] Reset camera works (Home key)
- [ ] Camera changes trigger accumulation reset
- [ ] Camera feels responsive and intuitive
- [ ] No gimbal lock or sudden flips

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/store/cameraStore.ts` | Create | Camera state management |
| `src/core/CameraController.ts` | Create | Input handling |
| `src/components/Canvas.tsx` | Modify | Integrate controller |
| `src/renderer/Renderer.ts` | Modify | Sync camera to GPU |

---

## Definition of Done

Stage 6 is complete when:
1. Camera can orbit, pan, and zoom smoothly
2. All keyboard shortcuts work (Home, F)
3. Camera has appropriate movement limits
4. Camera changes trigger render reset
5. Controls feel natural and responsive

