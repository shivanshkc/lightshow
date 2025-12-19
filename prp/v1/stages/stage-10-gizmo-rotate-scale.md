# Stage 10: Transform Gizmos — Rotation & Scale

## Objective
Implement rotation and scale gizmos, completing the full transformation toolkit. Add keyboard shortcuts to switch between gizmo modes.

---

## Prerequisites
- Stage 9 completed (translation gizmo working)
- Gizmo infrastructure in place

---

## Rotation Gizmo Design

```
        ╭───────╮
      ╭─│   Y   │─╮     Y = Green ring
     │  ╰───────╯  │
     │      │      │
  ╭──┼──────●──────┼──╮  X = Red ring
  │  │      │      │  │
  │  ╰──────┼──────╯  │  Z = Blue ring
  ╰─────────┼─────────╯
            │
     Outer ring = Trackball (Gray)
```

### Visual Specifications

| Component | Color | Description |
|-----------|-------|-------------|
| X Ring | #E53935 | Rotate around X axis |
| Y Ring | #43A047 | Rotate around Y axis |
| Z Ring | #1E88E5 | Rotate around Z axis |
| Trackball | #808080 | Free rotation (outer) |
| Arc indicator | White | Shows rotation amount during drag |

---

## Scale Gizmo Design

```
             ■ Y (Green)
             │
             │
        ■────●────■ X (Red)
            /
           /
          ■ Z (Blue)
          
- Cubes at ends instead of arrows
- Center cube for uniform scale
```

### Visual Specifications

| Component | Color | Description |
|-----------|-------|-------------|
| X Handle | #E53935 | Scale along X |
| Y Handle | #43A047 | Scale along Y |
| Z Handle | #1E88E5 | Scale along Z |
| Center | #FFFFFF | Uniform scale |
| Handle shape | Cube | 0.1 unit cube at end |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| W | Switch to Translate mode |
| E | Switch to Rotate mode |
| R | Switch to Scale mode |
| G | Alternative for Translate |
| S | Alternative for Scale |

---

## Implementation

### 10.1 Rotation Gizmo Geometry

```typescript
export function createRotateGizmoGeometry(scale: number = 1): GizmoMesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let indexOffset = 0;
  
  const ringRadius = 1.0 * scale;
  const tubeRadius = 0.02 * scale;
  const segments = 64;
  const tubeSegments = 8;
  
  // Create ring for each axis
  const axes: Array<{
    axis: 'x' | 'y' | 'z';
    normal: [number, number, number];
    color: number[];
  }> = [
    { axis: 'x', normal: [1, 0, 0], color: [0.90, 0.22, 0.21, 1.0] },
    { axis: 'y', normal: [0, 1, 0], color: [0.26, 0.63, 0.28, 1.0] },
    { axis: 'z', normal: [0, 0, 1], color: [0.12, 0.53, 0.90, 1.0] },
  ];
  
  for (const { axis, normal, color } of axes) {
    const result = createTorus(normal, ringRadius, tubeRadius, segments, tubeSegments, color, indexOffset);
    positions.push(...result.positions);
    colors.push(...result.colors);
    indices.push(...result.indices);
    indexOffset += result.vertexCount;
  }
  
  // Outer trackball ring (slightly larger, gray)
  const trackballResult = createTorus(
    [0, 0, 1],  // Screen-aligned (handled differently in shader)
    ringRadius * 1.15,
    tubeRadius * 0.8,
    segments,
    tubeSegments,
    [0.5, 0.5, 0.5, 0.6],
    indexOffset
  );
  positions.push(...trackballResult.positions);
  colors.push(...trackballResult.colors);
  indices.push(...trackballResult.indices);
  
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
  };
}

function createTorus(
  normal: [number, number, number],
  ringRadius: number,
  tubeRadius: number,
  ringSegments: number,
  tubeSegments: number,
  color: number[],
  indexOffset: number
): { positions: number[]; colors: number[]; indices: number[]; vertexCount: number } {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  
  // Build coordinate system
  let up: [number, number, number] = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const tangent = normalize3(cross3(normal, up));
  const bitangent = cross3(tangent, normal) as [number, number, number];
  
  for (let i = 0; i <= ringSegments; i++) {
    const ringAngle = (i / ringSegments) * Math.PI * 2;
    const ringCos = Math.cos(ringAngle);
    const ringSin = Math.sin(ringAngle);
    
    // Center of tube at this ring position
    const cx = tangent[0] * ringCos + bitangent[0] * ringSin;
    const cy = tangent[1] * ringCos + bitangent[1] * ringSin;
    const cz = tangent[2] * ringCos + bitangent[2] * ringSin;
    
    // Tube direction (pointing outward from ring center)
    const tubeOut: [number, number, number] = [cx, cy, cz];
    
    for (let j = 0; j <= tubeSegments; j++) {
      const tubeAngle = (j / tubeSegments) * Math.PI * 2;
      const tubeCos = Math.cos(tubeAngle);
      const tubeSin = Math.sin(tubeAngle);
      
      // Position on tube surface
      const px = cx * ringRadius + (tubeOut[0] * tubeCos + normal[0] * tubeSin) * tubeRadius;
      const py = cy * ringRadius + (tubeOut[1] * tubeCos + normal[1] * tubeSin) * tubeRadius;
      const pz = cz * ringRadius + (tubeOut[2] * tubeCos + normal[2] * tubeSin) * tubeRadius;
      
      positions.push(px, py, pz);
      colors.push(...color);
    }
  }
  
  // Generate indices
  for (let i = 0; i < ringSegments; i++) {
    for (let j = 0; j < tubeSegments; j++) {
      const a = indexOffset + i * (tubeSegments + 1) + j;
      const b = indexOffset + (i + 1) * (tubeSegments + 1) + j;
      const c = indexOffset + (i + 1) * (tubeSegments + 1) + j + 1;
      const d = indexOffset + i * (tubeSegments + 1) + j + 1;
      
      indices.push(a, b, c, a, c, d);
    }
  }
  
  const vertexCount = (ringSegments + 1) * (tubeSegments + 1);
  return { positions, colors, indices, vertexCount };
}
```

### 10.2 Scale Gizmo Geometry

```typescript
export function createScaleGizmoGeometry(scale: number = 1): GizmoMesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let indexOffset = 0;
  
  const lineLength = 1.0 * scale;
  const lineWidth = 0.015 * scale;
  const cubeSize = 0.1 * scale;
  
  // Axis lines with cube endpoints
  const axes: Array<{ dir: [number, number, number]; color: number[] }> = [
    { dir: [1, 0, 0], color: [0.90, 0.22, 0.21, 1.0] },
    { dir: [0, 1, 0], color: [0.26, 0.63, 0.28, 1.0] },
    { dir: [0, 0, 1], color: [0.12, 0.53, 0.90, 1.0] },
  ];
  
  for (const { dir, color } of axes) {
    // Line
    const lineResult = createLine([0, 0, 0], [dir[0] * lineLength, dir[1] * lineLength, dir[2] * lineLength], lineWidth, color, indexOffset);
    positions.push(...lineResult.positions);
    colors.push(...lineResult.colors);
    indices.push(...lineResult.indices);
    indexOffset += lineResult.vertexCount;
    
    // End cube
    const cubeCenter: [number, number, number] = [
      dir[0] * lineLength,
      dir[1] * lineLength,
      dir[2] * lineLength,
    ];
    const cubeResult = createCube(cubeCenter, cubeSize, color, indexOffset);
    positions.push(...cubeResult.positions);
    colors.push(...cubeResult.colors);
    indices.push(...cubeResult.indices);
    indexOffset += cubeResult.vertexCount;
  }
  
  // Center cube (white, for uniform scale)
  const centerResult = createCube([0, 0, 0], cubeSize * 1.2, [1, 1, 1, 1], indexOffset);
  positions.push(...centerResult.positions);
  colors.push(...centerResult.colors);
  indices.push(...centerResult.indices);
  
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
  };
}

function createCube(
  center: [number, number, number],
  size: number,
  color: number[],
  indexOffset: number
): { positions: number[]; colors: number[]; indices: number[]; vertexCount: number } {
  const h = size / 2;
  const [cx, cy, cz] = center;
  
  // 8 vertices of cube
  const vertices = [
    [cx - h, cy - h, cz - h],
    [cx + h, cy - h, cz - h],
    [cx + h, cy + h, cz - h],
    [cx - h, cy + h, cz - h],
    [cx - h, cy - h, cz + h],
    [cx + h, cy - h, cz + h],
    [cx + h, cy + h, cz + h],
    [cx - h, cy + h, cz + h],
  ];
  
  const positions: number[] = [];
  const colors: number[] = [];
  
  for (const v of vertices) {
    positions.push(v[0], v[1], v[2]);
    colors.push(...color);
  }
  
  // 12 triangles (6 faces × 2 triangles)
  const cubeIndices = [
    0, 1, 2, 0, 2, 3,  // Front
    4, 6, 5, 4, 7, 6,  // Back
    0, 4, 5, 0, 5, 1,  // Bottom
    2, 6, 7, 2, 7, 3,  // Top
    0, 3, 7, 0, 7, 4,  // Left
    1, 5, 6, 1, 6, 2,  // Right
  ];
  
  const indices = cubeIndices.map(i => i + indexOffset);
  
  return { positions, colors, indices, vertexCount: 8 };
}
```

### 10.3 Rotation Logic (RotateGizmo.ts)

```typescript
import { Vec3, Mat3, normalize, cross, dot, mat3FromAxisAngle } from '../core/math';

export class RotateGizmo {
  // Calculate rotation from drag
  static calculateRotation(
    axis: 'x' | 'y' | 'z' | 'trackball',
    objectCenter: Vec3,
    startMousePos: [number, number],
    currentMousePos: [number, number],
    cameraPosition: Vec3,
    canvasWidth: number,
    canvasHeight: number
  ): [number, number, number] {  // Euler angles delta
    const deltaX = currentMousePos[0] - startMousePos[0];
    const deltaY = currentMousePos[1] - startMousePos[1];
    
    // Sensitivity based on screen size
    const sensitivity = 0.01;
    
    if (axis === 'trackball') {
      // Trackball rotation uses screen-space delta
      return [
        -deltaY * sensitivity,  // Pitch
        deltaX * sensitivity,   // Yaw
        0,                      // Roll
      ];
    }
    
    // Single axis rotation
    // Calculate angle based on arc length
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const direction = Math.atan2(deltaY, deltaX);
    
    let angle = distance * sensitivity;
    
    // Determine rotation direction based on camera position
    const toCamera = normalize([
      cameraPosition[0] - objectCenter[0],
      cameraPosition[1] - objectCenter[1],
      cameraPosition[2] - objectCenter[2],
    ]);
    
    const axisVec: Vec3 = axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];
    
    if (dot(toCamera, axisVec) < 0) {
      angle = -angle;
    }
    
    // Adjust angle based on mouse direction relative to axis
    angle *= Math.cos(direction - Math.PI / 2);  // Approximate
    
    return axis === 'x' ? [angle, 0, 0]
         : axis === 'y' ? [0, angle, 0]
         : [0, 0, angle];
  }
  
  // Add rotation to existing Euler angles
  static addRotation(current: [number, number, number], delta: [number, number, number]): [number, number, number] {
    return [
      current[0] + delta[0],
      current[1] + delta[1],
      current[2] + delta[2],
    ];
  }
  
  // Snap angle to increments (e.g., 15 degrees)
  static snapAngle(angle: number, increment: number): number {
    return Math.round(angle / increment) * increment;
  }
}
```

### 10.4 Scale Logic (ScaleGizmo.ts)

```typescript
import { Vec3 } from '../core/math';

export class ScaleGizmo {
  static calculateScale(
    axis: 'x' | 'y' | 'z' | 'uniform',
    startScale: Vec3,
    startMousePos: [number, number],
    currentMousePos: [number, number],
    objectType: 'sphere' | 'cuboid'
  ): Vec3 {
    const deltaX = currentMousePos[0] - startMousePos[0];
    const deltaY = currentMousePos[1] - startMousePos[1];
    
    // Scale factor based on mouse movement
    // Moving right/up = increase, left/down = decrease
    const sensitivity = 0.01;
    const delta = (deltaX - deltaY) * sensitivity;
    const scaleFactor = Math.max(0.1, 1 + delta);  // Minimum scale of 0.1
    
    if (axis === 'uniform' || objectType === 'sphere') {
      // Uniform scale
      return [
        startScale[0] * scaleFactor,
        startScale[1] * scaleFactor,
        startScale[2] * scaleFactor,
      ];
    }
    
    // Single axis scale
    const newScale: Vec3 = [...startScale];
    
    switch (axis) {
      case 'x':
        newScale[0] = Math.max(0.1, startScale[0] * scaleFactor);
        break;
      case 'y':
        newScale[1] = Math.max(0.1, startScale[1] * scaleFactor);
        break;
      case 'z':
        newScale[2] = Math.max(0.1, startScale[2] * scaleFactor);
        break;
    }
    
    return newScale;
  }
}
```

### 10.5 Gizmo Mode Switching

In keyboard handler:

```typescript
// In CameraController.ts or separate KeyboardHandler
window.addEventListener('keydown', (e) => {
  const gizmoStore = useGizmoStore.getState();
  
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'g':
      gizmoStore.setMode('translate');
      break;
    case 'e':
      gizmoStore.setMode('rotate');
      break;
    case 'r':
    case 's':
      gizmoStore.setMode('scale');
      break;
  }
});
```

### 10.6 Updated GizmoManager

```typescript
import { useGizmoStore, GizmoMode } from '../store/gizmoStore';
import { TranslateGizmo } from './TranslateGizmo';
import { RotateGizmo } from './RotateGizmo';
import { ScaleGizmo } from './ScaleGizmo';

export class GizmoManager {
  private translateGizmo: TranslateGizmoRenderer;
  private rotateGizmo: RotateGizmoRenderer;
  private scaleGizmo: ScaleGizmoRenderer;
  
  render(
    encoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    depthView: GPUTextureView,
    mode: GizmoMode,
    objectPosition: Vec3,
    // ... other params
  ): void {
    switch (mode) {
      case 'translate':
        this.translateGizmo.render(encoder, targetView, depthView, objectPosition, /* ... */);
        break;
      case 'rotate':
        this.rotateGizmo.render(encoder, targetView, depthView, objectPosition, /* ... */);
        break;
      case 'scale':
        this.scaleGizmo.render(encoder, targetView, depthView, objectPosition, /* ... */);
        break;
    }
  }
}
```

---

## Testing Requirements

### Rotation Gizmo Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T10.1 | X rotation | Drag red ring | Object rotates around X axis |
| T10.2 | Y rotation | Drag green ring | Object rotates around Y axis |
| T10.3 | Z rotation | Drag blue ring | Object rotates around Z axis |
| T10.4 | Trackball | Drag outer ring | Free rotation |
| T10.5 | Rotation display | Drag any ring | Show angle being applied |
| T10.6 | Snap 15° | Hold Ctrl while rotating | Snaps to 15° increments |

### Scale Gizmo Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T10.7 | X scale | Drag red cube | Object scales along X |
| T10.8 | Y scale | Drag green cube | Object scales along Y |
| T10.9 | Z scale | Drag blue cube | Object scales along Z |
| T10.10 | Uniform scale | Drag center cube | Object scales uniformly |
| T10.11 | Sphere scale | Scale sphere on any axis | Always uniform |
| T10.12 | Minimum scale | Scale very small | Doesn't go below minimum |

### Mode Switching Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T10.13 | Press W | With object selected, press W | Translate gizmo shown |
| T10.14 | Press E | Press E | Rotate gizmo shown |
| T10.15 | Press R | Press R | Scale gizmo shown |
| T10.16 | Mode indicator | Switch modes | UI shows current mode |

---

## Acceptance Criteria

- [ ] Rotation gizmo renders with three rings
- [ ] All rotation axes work correctly
- [ ] Trackball rotation works
- [ ] Rotation snapping (Ctrl) works
- [ ] Scale gizmo renders with cube handles
- [ ] All scale axes work correctly
- [ ] Uniform scale works
- [ ] Scale minimum enforced
- [ ] Keyboard shortcuts switch modes
- [ ] Visual feedback during drag

---

## Definition of Done

Stage 10 is complete when:
1. All three gizmo modes are fully functional
2. Keyboard shortcuts work (W/E/R)
3. Snapping works for rotation
4. Scale respects minimum limits
5. All gizmos feel polished and responsive

