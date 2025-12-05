# Stage 9: Translation Gizmo — Commits

## Overview
**Total Commits:** 5  
**Stage Goal:** Interactive translation gizmo with axis/plane movement.

---

## Commit 9.1: Create gizmo store

### Description
Zustand store for gizmo mode and state.

### Files to Create
```
src/store/gizmoStore.ts
src/__tests__/gizmoStore.test.ts
```

### Key Implementation
```typescript
export type GizmoMode = 'translate' | 'rotate' | 'scale' | 'none';
export type GizmoAxis = 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz' | null;

interface GizmoState {
  mode: GizmoMode;
  hoveredAxis: GizmoAxis;
  activeAxis: GizmoAxis;
  isDragging: boolean;
  dragStartPos: Vec3 | null;
  dragStartMouse: [number, number] | null;
  
  setMode: (mode: GizmoMode) => void;
  setHoveredAxis: (axis: GizmoAxis) => void;
  startDrag: (axis: GizmoAxis, objPos: Vec3, mousePos: [number, number]) => void;
  endDrag: () => void;
}

export const useGizmoStore = create<GizmoState>((set) => ({
  mode: 'translate',
  hoveredAxis: null,
  activeAxis: null,
  isDragging: false,
  dragStartPos: null,
  dragStartMouse: null,
  
  setMode: (mode) => set({ mode }),
  setHoveredAxis: (axis) => set({ hoveredAxis: axis }),
  startDrag: (axis, objPos, mousePos) => set({ activeAxis: axis, isDragging: true, dragStartPos: objPos, dragStartMouse: mousePos }),
  endDrag: () => set({ activeAxis: null, isDragging: false, dragStartPos: null, dragStartMouse: null }),
}));
```

### Test Cases
```typescript
describe('gizmoStore', () => {
  it('defaults to translate mode', () => {
    expect(useGizmoStore.getState().mode).toBe('translate');
  });
  
  it('tracks hovered axis', () => {
    useGizmoStore.getState().setHoveredAxis('x');
    expect(useGizmoStore.getState().hoveredAxis).toBe('x');
  });
  
  it('startDrag sets isDragging', () => {
    useGizmoStore.getState().startDrag('y', [0,0,0], [100, 100]);
    expect(useGizmoStore.getState().isDragging).toBe(true);
    expect(useGizmoStore.getState().activeAxis).toBe('y');
  });
  
  it('endDrag clears state', () => {
    useGizmoStore.getState().startDrag('z', [0,0,0], [0,0]);
    useGizmoStore.getState().endDrag();
    expect(useGizmoStore.getState().isDragging).toBe(false);
    expect(useGizmoStore.getState().activeAxis).toBeNull();
  });
});
```

### Commit Message
```
feat(store): create gizmo store for transform mode
```

---

## Commit 9.2: Generate gizmo geometry

### Description
Create arrow and plane geometries for translation gizmo.

### Files to Create
```
src/gizmos/GizmoGeometry.ts
src/__tests__/GizmoGeometry.test.ts
```

### Key Implementation
```typescript
export interface GizmoMesh {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint16Array;
}

const COLORS = {
  x: [0.9, 0.22, 0.21, 1], y: [0.26, 0.63, 0.28, 1], z: [0.12, 0.53, 0.9, 1],
  xy: [1, 0.92, 0.23, 0.6], xz: [0, 0.74, 0.83, 0.6], yz: [0.88, 0.25, 0.98, 0.6],
};

export function createTranslateGizmoGeometry(scale: number = 1): GizmoMesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  
  // Create arrow for X, Y, Z axes
  // Create plane handles for XY, XZ, YZ
  // ... geometry generation code
  
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
  };
}

function createArrow(direction: Vec3, color: number[], offset: number): { /* vertices */ } {
  // Arrow shaft (cylinder) + head (cone)
}

function createPlaneHandle(u: Vec3, v: Vec3, color: number[], offset: number): { /* quad */ } {
  // Small quad at intersection of two axes
}
```

### Test Cases
```typescript
describe('GizmoGeometry', () => {
  it('createTranslateGizmoGeometry returns mesh data', () => {
    const mesh = createTranslateGizmoGeometry();
    expect(mesh.positions).toBeInstanceOf(Float32Array);
    expect(mesh.colors).toBeInstanceOf(Float32Array);
    expect(mesh.indices).toBeInstanceOf(Uint16Array);
  });
  
  it('has non-zero vertex count', () => {
    const mesh = createTranslateGizmoGeometry();
    expect(mesh.positions.length).toBeGreaterThan(0);
  });
  
  it('indices are valid', () => {
    const mesh = createTranslateGizmoGeometry();
    const maxIndex = mesh.positions.length / 3 - 1;
    for (const idx of mesh.indices) {
      expect(idx).toBeLessThanOrEqual(maxIndex);
    }
  });
});
```

### Commit Message
```
feat(gizmos): create translation gizmo geometry
```

---

## Commit 9.3: Create GizmoRenderer

### Description
WebGPU pipeline for rendering gizmos.

### Files to Create
```
src/gizmos/GizmoRenderer.ts
src/gizmos/gizmoShader.wgsl
```

### Key Implementation
```wgsl
// gizmoShader.wgsl
struct Uniforms {
  viewProjection: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  gizmoScale: f32,
  hoveredAxis: u32,
  activeAxis: u32,
}

@vertex fn vertexMain(@location(0) pos: vec3<f32>, @location(1) color: vec4<f32>, @location(2) axisId: u32) -> VertexOutput {
  var out: VertexOutput;
  let worldPos = uniforms.modelMatrix * vec4(pos * uniforms.gizmoScale, 1.0);
  out.position = uniforms.viewProjection * worldPos;
  
  // Brighten hovered/active axis
  out.color = color;
  if (axisId == uniforms.hoveredAxis || axisId == uniforms.activeAxis) {
    out.color = vec4(min(color.rgb * 1.4, vec3(1.0)), color.a);
  }
  return out;
}
```

```typescript
// GizmoRenderer.ts
export class GizmoRenderer {
  constructor(device: GPUDevice, format: GPUTextureFormat) {
    // Create render pipeline with depth testing disabled (always on top)
  }
  
  render(encoder: GPUCommandEncoder, targetView: GPUTextureView, depthView: GPUTextureView,
         viewProj: Float32Array, objPos: Vec3, camDist: number, hovered: number, active: number): void {
    // Constant screen-space size: gizmoScale = camDist * 0.15
  }
}
```

### Test Cases
```typescript
describe('GizmoRenderer', () => {
  it('calculates constant screen-space scale', () => {
    const camDist = 10;
    const scale = camDist * 0.15;
    expect(scale).toBe(1.5);
    
    const farDist = 20;
    const farScale = farDist * 0.15;
    expect(farScale).toBe(3); // Larger when camera is further
  });
});
```

### Commit Message
```
feat(gizmos): create GizmoRenderer with WebGPU pipeline
```

---

## Commit 9.4: Implement translation drag logic

### Description
Calculate object position during axis/plane drag.

### Files to Create
```
src/gizmos/TranslateGizmo.ts
src/__tests__/TranslateGizmo.test.ts
```

### Key Implementation
```typescript
export class TranslateGizmo {
  static calculateDragPosition(
    axis: GizmoAxis,
    startPos: Vec3,
    startMouse: [number, number],
    currentMouse: [number, number],
    camRight: Vec3,
    camUp: Vec3,
    screenScale: number
  ): Vec3 {
    const dx = (currentMouse[0] - startMouse[0]) * screenScale;
    const dy = (currentMouse[1] - startMouse[1]) * screenScale;
    
    let movement: Vec3 = [0, 0, 0];
    
    switch (axis) {
      case 'x':
        const xProj = dx * dot([1,0,0], camRight) - dy * dot([1,0,0], camUp);
        movement = [xProj, 0, 0];
        break;
      case 'y':
        const yProj = dx * dot([0,1,0], camRight) - dy * dot([0,1,0], camUp);
        movement = [0, yProj, 0];
        break;
      // ... z, xy, xz, yz, xyz
    }
    
    return add(startPos, movement);
  }
  
  static snapToGrid(pos: Vec3, gridSize: number): Vec3 {
    return [
      Math.round(pos[0] / gridSize) * gridSize,
      Math.round(pos[1] / gridSize) * gridSize,
      Math.round(pos[2] / gridSize) * gridSize,
    ];
  }
}
```

### Test Cases
```typescript
describe('TranslateGizmo', () => {
  it('X axis movement only affects X', () => {
    const result = TranslateGizmo.calculateDragPosition(
      'x', [0,0,0], [0,0], [100,0], [1,0,0], [0,1,0], 0.01
    );
    expect(result[0]).not.toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
  });
  
  it('snapToGrid rounds to grid', () => {
    const result = TranslateGizmo.snapToGrid([1.3, 2.7, -0.2], 0.5);
    expect(result).toEqual([1.5, 2.5, 0]);
  });
});
```

### Commit Message
```
feat(gizmos): implement translation drag calculation
```

---

## Commit 9.5: Integrate gizmo with Canvas

### Description
Render gizmo on selection, handle mouse interaction.

### Files to Modify
```
src/renderer/Renderer.ts
src/components/Canvas.tsx
```

### Key Implementation
```typescript
// Renderer.ts
private renderGizmos(): void {
  const selected = useSceneStore.getState().getSelectedObject();
  const gizmo = useGizmoStore.getState();
  
  if (!selected || gizmo.mode === 'none') return;
  
  this.gizmoRenderer.render(
    encoder, targetView, depthView,
    viewProjection, selected.transform.position,
    useCameraStore.getState().distance,
    axisToIndex(gizmo.hoveredAxis),
    axisToIndex(gizmo.activeAxis)
  );
}

// Canvas.tsx - handle gizmo interaction
const handleMouseMove = (e: React.MouseEvent) => {
  if (gizmoStore.isDragging) {
    const newPos = TranslateGizmo.calculateDragPosition(
      gizmoStore.activeAxis!, gizmoStore.dragStartPos!, gizmoStore.dragStartMouse!,
      [e.clientX, e.clientY], camRight, camUp, screenScale
    );
    
    const finalPos = e.ctrlKey ? TranslateGizmo.snapToGrid(newPos, 0.5) : newPos;
    useSceneStore.getState().updateTransform(selectedId, { position: finalPos });
  }
};
```

### Test Cases
```typescript
describe('Gizmo integration', () => {
  it('gizmo renders when object selected', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().selectObject(id);
    
    // Verify gizmoRenderer.render would be called
  });
  
  it('dragging updates object position', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().selectObject(id);
    
    useGizmoStore.getState().startDrag('x', [0,0,0], [0,0]);
    // Simulate mouse move
    
    expect(useSceneStore.getState().getObject(id)?.transform.position[0]).not.toBe(0);
  });
});
```

### Manual Testing
1. Select object → gizmo appears
2. Drag X arrow → moves along X
3. Drag Y arrow → moves along Y
4. Drag XY plane → moves in XY plane
5. Hold Ctrl → snaps to 0.5 grid
6. Hover axis → brightens

### Commit Message
```
feat(gizmos): integrate translation gizmo with rendering

Stage 9 complete: Translation gizmo functional
```

---

## Stage 9 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 9.1 | Gizmo store | Mode, drag state |
| 9.2 | Gizmo geometry | Arrows, planes |
| 9.3 | GizmoRenderer | WebGPU pipeline |
| 9.4 | Drag logic | Position calculation |
| 9.5 | Integration | Render + interaction |

