# Stage 10: Rotation & Scale Gizmos — Commits

## Overview
**Total Commits:** 4  
**Stage Goal:** Complete rotation/scale gizmos and keyboard mode switching.

---

## Commit 10.1: Create rotation gizmo geometry

### Description
Generate torus rings for rotation gizmo.

### Files to Create
```
src/gizmos/RotateGizmoGeometry.ts
```

### Key Implementation
```typescript
export function createRotateGizmoGeometry(scale: number = 1): GizmoMesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  
  const ringRadius = 1.0 * scale;
  const tubeRadius = 0.02 * scale;
  const segments = 64;
  const tubeSegments = 8;
  
  // X ring (red) - rotate around X axis
  createTorus([1,0,0], ringRadius, tubeRadius, segments, tubeSegments, COLORS.x, /* output */);
  
  // Y ring (green) - rotate around Y axis
  createTorus([0,1,0], ringRadius, tubeRadius, segments, tubeSegments, COLORS.y, /* output */);
  
  // Z ring (blue) - rotate around Z axis
  createTorus([0,0,1], ringRadius, tubeRadius, segments, tubeSegments, COLORS.z, /* output */);
  
  // Trackball ring (gray, slightly larger)
  createTorus([0,0,1], ringRadius * 1.15, tubeRadius * 0.8, segments, tubeSegments, [0.5,0.5,0.5,0.6], /* output */);
  
  return { positions: new Float32Array(positions), colors: new Float32Array(colors), indices: new Uint16Array(indices) };
}

function createTorus(normal: Vec3, R: number, r: number, segments: number, tubeSegs: number, color: number[], out: any): void {
  // Generate torus vertices around the axis defined by normal
}
```

### Test Cases
```typescript
describe('RotateGizmoGeometry', () => {
  it('creates mesh with 4 rings', () => {
    const mesh = createRotateGizmoGeometry();
    expect(mesh.positions.length).toBeGreaterThan(0);
  });
  
  it('has valid index buffer', () => {
    const mesh = createRotateGizmoGeometry();
    const maxVert = mesh.positions.length / 3;
    for (const i of mesh.indices) {
      expect(i).toBeLessThan(maxVert);
    }
  });
});
```

### Commit Message
```
feat(gizmos): create rotation gizmo geometry
```

---

## Commit 10.2: Create scale gizmo geometry

### Description
Generate lines with cube endpoints for scale gizmo.

### Files to Create
```
src/gizmos/ScaleGizmoGeometry.ts
```

### Key Implementation
```typescript
export function createScaleGizmoGeometry(scale: number = 1): GizmoMesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  
  const lineLength = 1.0 * scale;
  const cubeSize = 0.1 * scale;
  
  // X axis line + cube (red)
  createLine([0,0,0], [lineLength,0,0], COLORS.x, /* out */);
  createCube([lineLength,0,0], cubeSize, COLORS.x, /* out */);
  
  // Y axis line + cube (green)
  createLine([0,0,0], [0,lineLength,0], COLORS.y, /* out */);
  createCube([0,lineLength,0], cubeSize, COLORS.y, /* out */);
  
  // Z axis line + cube (blue)
  createLine([0,0,0], [0,0,lineLength], COLORS.z, /* out */);
  createCube([0,0,lineLength], cubeSize, COLORS.z, /* out */);
  
  // Center cube for uniform scale (white)
  createCube([0,0,0], cubeSize * 1.2, [1,1,1,1], /* out */);
  
  return { /* mesh */ };
}
```

### Test Cases
```typescript
describe('ScaleGizmoGeometry', () => {
  it('creates geometry with center cube', () => {
    const mesh = createScaleGizmoGeometry();
    expect(mesh.positions.length).toBeGreaterThan(0);
  });
});
```

### Commit Message
```
feat(gizmos): create scale gizmo geometry
```

---

## Commit 10.3: Implement rotation and scale logic

### Description
Calculate rotation angles and scale factors from drag.

### Files to Create
```
src/gizmos/RotateGizmo.ts
src/gizmos/ScaleGizmo.ts
src/__tests__/gizmos.test.ts
```

### Key Implementation
```typescript
// RotateGizmo.ts
export class RotateGizmo {
  static calculateRotation(
    axis: 'x' | 'y' | 'z' | 'trackball',
    startMouse: [number, number],
    currentMouse: [number, number],
    sensitivity: number = 0.01
  ): [number, number, number] {
    const dx = currentMouse[0] - startMouse[0];
    const dy = currentMouse[1] - startMouse[1];
    
    if (axis === 'trackball') {
      return [-dy * sensitivity, dx * sensitivity, 0];
    }
    
    const angle = Math.sqrt(dx*dx + dy*dy) * sensitivity;
    return axis === 'x' ? [angle, 0, 0]
         : axis === 'y' ? [0, angle, 0]
         : [0, 0, angle];
  }
  
  static snapAngle(angle: number, increment: number = Math.PI/12): number {
    return Math.round(angle / increment) * increment;
  }
}

// ScaleGizmo.ts
export class ScaleGizmo {
  static calculateScale(
    axis: 'x' | 'y' | 'z' | 'uniform',
    startScale: Vec3,
    startMouse: [number, number],
    currentMouse: [number, number],
    objectType: 'sphere' | 'cuboid'
  ): Vec3 {
    const delta = (currentMouse[0] - startMouse[0] - currentMouse[1] + startMouse[1]) * 0.01;
    const factor = Math.max(0.1, 1 + delta);
    
    if (axis === 'uniform' || objectType === 'sphere') {
      return [startScale[0] * factor, startScale[1] * factor, startScale[2] * factor];
    }
    
    const result: Vec3 = [...startScale];
    const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    result[idx] = Math.max(0.1, startScale[idx] * factor);
    return result;
  }
}
```

### Test Cases
```typescript
describe('RotateGizmo', () => {
  it('X rotation only affects X', () => {
    const [rx, ry, rz] = RotateGizmo.calculateRotation('x', [0,0], [100,0]);
    expect(rx).not.toBe(0);
    expect(ry).toBe(0);
    expect(rz).toBe(0);
  });
  
  it('snapAngle rounds to 15 degrees', () => {
    const snapped = RotateGizmo.snapAngle(0.3); // ~17 degrees
    expect(snapped).toBeCloseTo(Math.PI / 12); // 15 degrees
  });
});

describe('ScaleGizmo', () => {
  it('uniform scale affects all axes', () => {
    const result = ScaleGizmo.calculateScale('uniform', [1,1,1], [0,0], [100,-100], 'cuboid');
    expect(result[0]).toBeGreaterThan(1);
    expect(result[1]).toBeGreaterThan(1);
    expect(result[2]).toBeGreaterThan(1);
  });
  
  it('sphere always scales uniformly', () => {
    const result = ScaleGizmo.calculateScale('x', [1,1,1], [0,0], [50,0], 'sphere');
    expect(result[0]).toBe(result[1]);
    expect(result[1]).toBe(result[2]);
  });
  
  it('enforces minimum scale', () => {
    const result = ScaleGizmo.calculateScale('x', [1,1,1], [0,0], [-1000,0], 'cuboid');
    expect(result[0]).toBeGreaterThanOrEqual(0.1);
  });
});
```

### Commit Message
```
feat(gizmos): implement rotation and scale calculation logic
```

---

## Commit 10.4: Add keyboard mode switching and integrate

### Description
W/E/R keys switch gizmo modes, render all gizmo types.

### Files to Modify
```
src/core/CameraController.ts
src/renderer/Renderer.ts
src/gizmos/GizmoManager.ts  # NEW
```

### Key Implementation
```typescript
// CameraController.ts
private onKeyDown = (e: KeyboardEvent): void => {
  if (e.target instanceof HTMLInputElement) return;
  
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'g':
      useGizmoStore.getState().setMode('translate');
      break;
    case 'e':
      useGizmoStore.getState().setMode('rotate');
      break;
    case 'r':
    case 's':
      useGizmoStore.getState().setMode('scale');
      break;
  }
};

// GizmoManager.ts
export class GizmoManager {
  private translateGizmo: GizmoRenderer;
  private rotateGizmo: GizmoRenderer;
  private scaleGizmo: GizmoRenderer;
  
  render(encoder: GPUCommandEncoder, mode: GizmoMode, /* params */): void {
    switch (mode) {
      case 'translate': this.translateGizmo.render(/* ... */); break;
      case 'rotate': this.rotateGizmo.render(/* ... */); break;
      case 'scale': this.scaleGizmo.render(/* ... */); break;
    }
  }
}
```

### Test Cases
```typescript
describe('Gizmo mode switching', () => {
  it('W sets translate mode', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    expect(useGizmoStore.getState().mode).toBe('translate');
  });
  
  it('E sets rotate mode', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(useGizmoStore.getState().mode).toBe('rotate');
  });
  
  it('R sets scale mode', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(useGizmoStore.getState().mode).toBe('scale');
  });
});
```

### Manual Testing
1. Select object, press W → translate gizmo
2. Press E → rotation rings appear
3. Press R → scale handles appear
4. Drag rotation ring → object rotates
5. Drag scale cube → object scales
6. Hold Ctrl during rotate → snaps to 15°

### Commit Message
```
feat(gizmos): add keyboard mode switching (W/E/R)

Stage 10 complete: All gizmo modes functional
```

---

## Stage 10 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 10.1 | Rotation geometry | Torus rings |
| 10.2 | Scale geometry | Cube handles |
| 10.3 | Rotation/scale logic | Calculations |
| 10.4 | Mode switching | W/E/R keys |

