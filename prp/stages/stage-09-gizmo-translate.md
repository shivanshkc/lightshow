# Stage 9: Transform Gizmos — Translation

## Objective
Implement a polished translation gizmo that appears when an object is selected, allowing users to move objects along specific axes or planes by dragging.

---

## Prerequisites
- Stage 8 completed (selection working)
- Object can be selected by clicking

---

## Gizmo Design

```
             ▲ Y (Green)
             │
             │
             ■───────► X (Red)
            /│
           / │
          ▼  Z (Blue)
          
Components:
- 3 axis arrows (X=Red, Y=Green, Z=Blue)
- 3 plane handles (XY, XZ, YZ)
- Center sphere for free movement (optional)
```

### Visual Specifications

| Component | Color | Size |
|-----------|-------|------|
| X Arrow | #E53935 (Red) | Length: 1.5 units |
| Y Arrow | #43A047 (Green) | Length: 1.5 units |
| Z Arrow | #1E88E5 (Blue) | Length: 1.5 units |
| Arrow head | Same as shaft | Cone, 0.15 radius |
| XY Plane | Yellow (#FFEB3B) | 0.4 × 0.4 square |
| XZ Plane | Cyan (#00BCD4) | 0.4 × 0.4 square |
| YZ Plane | Magenta (#E040FB) | 0.4 × 0.4 square |
| Hover state | Brightened + thicker | +20% brightness |
| Active state | Full bright | +40% brightness |

---

## Architecture

```
┌─────────────────┐
│ GizmoManager    │  Coordinates gizmo state
├─────────────────┤
│ - activeGizmo   │
│ - hoveredAxis   │
│ - isDragging    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────────┐ ┌──────────────┐
│ Gizmo    │ │ GizmoRenderer│
│ Geometry │ │ (WebGPU)     │
└──────────┘ └──────────────┘
```

---

## Project Structure

```
src/
├── gizmos/
│   ├── GizmoManager.ts       # NEW: gizmo state & coordination
│   ├── TranslateGizmo.ts     # NEW: translation gizmo logic
│   ├── GizmoRenderer.ts      # NEW: WebGPU rendering for gizmos
│   ├── GizmoGeometry.ts      # NEW: gizmo mesh generation
│   └── gizmoShader.wgsl      # NEW: gizmo rendering shader
├── store/
│   └── gizmoStore.ts         # NEW: gizmo state store
```

---

## Detailed Implementation

### 9.1 Gizmo Store (gizmoStore.ts)

```typescript
import { create } from 'zustand';

export type GizmoMode = 'translate' | 'rotate' | 'scale' | 'none';
export type GizmoAxis = 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz' | null;

interface GizmoState {
  mode: GizmoMode;
  hoveredAxis: GizmoAxis;
  activeAxis: GizmoAxis;
  isDragging: boolean;
  
  // Drag state
  dragStartPosition: [number, number, number] | null;
  dragStartMousePosition: [number, number] | null;
  
  setMode: (mode: GizmoMode) => void;
  setHoveredAxis: (axis: GizmoAxis) => void;
  startDrag: (axis: GizmoAxis, objectPosition: [number, number, number], mousePosition: [number, number]) => void;
  endDrag: () => void;
}

export const useGizmoStore = create<GizmoState>((set) => ({
  mode: 'translate',
  hoveredAxis: null,
  activeAxis: null,
  isDragging: false,
  dragStartPosition: null,
  dragStartMousePosition: null,
  
  setMode: (mode) => set({ mode }),
  
  setHoveredAxis: (axis) => set({ hoveredAxis: axis }),
  
  startDrag: (axis, objectPosition, mousePosition) => set({
    activeAxis: axis,
    isDragging: true,
    dragStartPosition: objectPosition,
    dragStartMousePosition: mousePosition,
  }),
  
  endDrag: () => set({
    activeAxis: null,
    isDragging: false,
    dragStartPosition: null,
    dragStartMousePosition: null,
  }),
}));
```

### 9.2 Gizmo Geometry (GizmoGeometry.ts)

Generate vertices for gizmo components.

```typescript
export interface GizmoMesh {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint16Array;
}

// Colors
const AXIS_COLORS = {
  x: [0.90, 0.22, 0.21, 1.0],  // Red
  y: [0.26, 0.63, 0.28, 1.0],  // Green
  z: [0.12, 0.53, 0.90, 1.0],  // Blue
  xy: [1.0, 0.92, 0.23, 0.6],  // Yellow (semi-transparent)
  xz: [0.0, 0.74, 0.83, 0.6],  // Cyan
  yz: [0.88, 0.25, 0.98, 0.6], // Magenta
};

export function createTranslateGizmoGeometry(scale: number = 1): GizmoMesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let indexOffset = 0;
  
  // Arrow parameters
  const shaftRadius = 0.02 * scale;
  const shaftLength = 1.2 * scale;
  const headRadius = 0.08 * scale;
  const headLength = 0.3 * scale;
  const segments = 12;
  
  // Create arrow for each axis
  const axes: Array<{ axis: 'x' | 'y' | 'z'; dir: [number, number, number] }> = [
    { axis: 'x', dir: [1, 0, 0] },
    { axis: 'y', dir: [0, 1, 0] },
    { axis: 'z', dir: [0, 0, 1] },
  ];
  
  for (const { axis, dir } of axes) {
    const color = AXIS_COLORS[axis];
    const result = createArrow(dir, shaftRadius, shaftLength, headRadius, headLength, segments, color, indexOffset);
    positions.push(...result.positions);
    colors.push(...result.colors);
    indices.push(...result.indices);
    indexOffset += result.vertexCount;
  }
  
  // Create plane handles
  const planeSize = 0.35 * scale;
  const planeOffset = 0.5 * scale;
  
  const planes: Array<{ plane: 'xy' | 'xz' | 'yz'; normal: [number, number, number]; u: [number, number, number]; v: [number, number, number] }> = [
    { plane: 'xy', normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { plane: 'xz', normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { plane: 'yz', normal: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  ];
  
  for (const { plane, u, v } of planes) {
    const color = AXIS_COLORS[plane];
    const result = createPlaneHandle(u, v, planeSize, planeOffset, color, indexOffset);
    positions.push(...result.positions);
    colors.push(...result.colors);
    indices.push(...result.indices);
    indexOffset += result.vertexCount;
  }
  
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
  };
}

function createArrow(
  direction: [number, number, number],
  shaftRadius: number,
  shaftLength: number,
  headRadius: number,
  headLength: number,
  segments: number,
  color: number[],
  indexOffset: number
): { positions: number[]; colors: number[]; indices: number[]; vertexCount: number } {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  
  // Build local coordinate system
  const [dx, dy, dz] = direction;
  let up: [number, number, number] = Math.abs(dy) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const right = normalize3(cross3(direction, up));
  up = cross3(right, direction) as [number, number, number];
  
  // Shaft cylinder
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle) * shaftRadius;
    const sin = Math.sin(angle) * shaftRadius;
    
    // Bottom vertex
    positions.push(
      right[0] * cos + up[0] * sin,
      right[1] * cos + up[1] * sin,
      right[2] * cos + up[2] * sin
    );
    colors.push(...color);
    
    // Top vertex (at shaft end)
    positions.push(
      dx * shaftLength + right[0] * cos + up[0] * sin,
      dy * shaftLength + right[1] * cos + up[1] * sin,
      dz * shaftLength + right[2] * cos + up[2] * sin
    );
    colors.push(...color);
  }
  
  // Shaft indices
  for (let i = 0; i < segments; i++) {
    const base = indexOffset + i * 2;
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
  }
  
  const shaftVertices = (segments + 1) * 2;
  
  // Cone head
  const coneBase = indexOffset + shaftVertices;
  const tipIndex = coneBase + segments + 1;
  
  // Cone base vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle) * headRadius;
    const sin = Math.sin(angle) * headRadius;
    
    positions.push(
      dx * shaftLength + right[0] * cos + up[0] * sin,
      dy * shaftLength + right[1] * cos + up[1] * sin,
      dz * shaftLength + right[2] * cos + up[2] * sin
    );
    colors.push(...color);
  }
  
  // Cone tip
  positions.push(
    dx * (shaftLength + headLength),
    dy * (shaftLength + headLength),
    dz * (shaftLength + headLength)
  );
  colors.push(...color);
  
  // Cone indices
  for (let i = 0; i < segments; i++) {
    indices.push(coneBase + i, tipIndex, coneBase + i + 1);
  }
  
  const totalVertices = shaftVertices + segments + 2;
  
  return { positions, colors, indices, vertexCount: totalVertices };
}

function createPlaneHandle(
  u: [number, number, number],
  v: [number, number, number],
  size: number,
  offset: number,
  color: number[],
  indexOffset: number
): { positions: number[]; colors: number[]; indices: number[]; vertexCount: number } {
  const positions: number[] = [];
  const colors: number[] = [];
  
  // Quad vertices (offset from origin along both axes)
  const corners = [
    [offset, offset],
    [offset + size, offset],
    [offset + size, offset + size],
    [offset, offset + size],
  ];
  
  for (const [a, b] of corners) {
    positions.push(
      u[0] * a + v[0] * b,
      u[1] * a + v[1] * b,
      u[2] * a + v[2] * b
    );
    colors.push(...color);
  }
  
  const indices = [
    indexOffset, indexOffset + 1, indexOffset + 2,
    indexOffset, indexOffset + 2, indexOffset + 3,
  ];
  
  return { positions, colors, indices, vertexCount: 4 };
}

// Helper functions
function cross3(a: number[], b: number[]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
}
```

### 9.3 Gizmo Shader (gizmoShader.wgsl)

```wgsl
struct Uniforms {
  viewProjection: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  gizmoScale: f32,
  hoveredAxis: u32,  // 0=none, 1=x, 2=y, 3=z, 4=xy, 5=xz, 6=yz
  activeAxis: u32,
  _pad: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) color: vec4<f32>,
  @location(2) axisId: u32,  // Which axis this vertex belongs to
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  let worldPos = uniforms.modelMatrix * vec4<f32>(input.position * uniforms.gizmoScale, 1.0);
  output.position = uniforms.viewProjection * worldPos;
  
  // Brighten if hovered or active
  var color = input.color;
  if (input.axisId == uniforms.hoveredAxis || input.axisId == uniforms.activeAxis) {
    color = vec4<f32>(min(color.rgb * 1.4, vec3<f32>(1.0)), color.a);
  }
  
  output.color = color;
  
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
```

### 9.4 Gizmo Renderer (GizmoRenderer.ts)

```typescript
import { GizmoMesh, createTranslateGizmoGeometry } from './GizmoGeometry';

export class GizmoRenderer {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline;
  private uniformBuffer: GPUBuffer;
  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private bindGroup: GPUBindGroup;
  private indexCount: number;
  
  constructor(device: GPUDevice, outputFormat: GPUTextureFormat) {
    this.device = device;
    this.createPipeline(outputFormat);
    this.createGeometry();
    this.createUniforms();
  }
  
  private createPipeline(format: GPUTextureFormat): void {
    const shaderModule = this.device.createShaderModule({
      code: gizmoShaderWGSL,
    });
    
    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: 32,  // 3 floats pos + 4 floats color + 1 uint axis
          attributes: [
            { format: 'float32x3', offset: 0, shaderLocation: 0 },
            { format: 'float32x4', offset: 12, shaderLocation: 1 },
            { format: 'uint32', offset: 28, shaderLocation: 2 },
          ],
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{
          format,
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
          },
        }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none',  // Gizmos visible from both sides
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,  // Don't write to depth
        depthCompare: 'always',    // Always render on top
      },
    });
  }
  
  render(
    encoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    depthView: GPUTextureView,
    viewProjection: Float32Array,
    objectPosition: [number, number, number],
    cameraDistance: number,
    hoveredAxis: number,
    activeAxis: number
  ): void {
    // Update uniforms
    const gizmoScale = cameraDistance * 0.15;  // Constant screen size
    
    const modelMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      objectPosition[0], objectPosition[1], objectPosition[2], 1,
    ]);
    
    const uniformData = new Float32Array(36);
    uniformData.set(viewProjection, 0);
    uniformData.set(modelMatrix, 16);
    uniformData[32] = gizmoScale;
    
    const uniformDataUint = new Uint32Array(uniformData.buffer);
    uniformDataUint[33] = hoveredAxis;
    uniformDataUint[34] = activeAxis;
    
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    
    // Render pass
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: targetView,
        loadOp: 'load',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: depthView,
        depthLoadOp: 'load',
        depthStoreOp: 'store',
      },
    });
    
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
    pass.end();
  }
  
  // ... createGeometry, createUniforms, destroy methods
}
```

### 9.5 Translation Drag Logic (TranslateGizmo.ts)

Use **ray-plane intersection** for accurate straight-line movement. This approach casts a ray from the mouse position and finds where it intersects with a constraint plane, giving consistent movement regardless of perspective foreshortening.

**Why Ray-Plane Intersection?**
- Screen-space delta projection causes curved movement paths due to perspective
- Ray-plane intersection gives perfectly straight movement matching user expectations
- This is the approach used by professional 3D software (Blender, Maya, etc.)

```typescript
import { Vec3, Ray, sub, add, dot, normalize, cross, screenToWorldRay } from '../core/math';
import { GizmoAxis } from '../store/gizmoStore';

export class TranslateGizmo {
  /**
   * Calculate new position using ray-plane intersection
   * For single-axis: intersect with plane containing the axis (perpendicular to best view)
   * For plane handles: intersect directly with that plane
   */
  static calculateDragPositionRayPlane(
    axis: GizmoAxis,
    startPosition: Vec3,
    startRay: Ray,
    currentRay: Ray,
    cameraForward: Vec3
  ): Vec3 {
    if (!axis) return startPosition;

    // Determine constraint plane based on axis
    const { planeNormal, planePoint } = this.getConstraintPlane(axis, startPosition, cameraForward);

    // Find intersection points on the plane
    const startHit = this.rayPlaneIntersect(startRay, planePoint, planeNormal);
    const currentHit = this.rayPlaneIntersect(currentRay, planePoint, planeNormal);

    if (!startHit || !currentHit) return startPosition;

    // Calculate movement delta on the plane
    let delta = sub(currentHit, startHit);

    // For single-axis constraints, project onto that axis
    if (axis === 'x' || axis === 'y' || axis === 'z') {
      const axisDir: Vec3 = axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];
      const projected = dot(delta, axisDir);
      delta = [axisDir[0] * projected, axisDir[1] * projected, axisDir[2] * projected];
    }

    return add(startPosition, delta);
  }

  /**
   * Get the constraint plane for a given axis
   * For single-axis: choose plane that's most perpendicular to view
   * For plane handles: use that plane directly
   */
  private static getConstraintPlane(
    axis: GizmoAxis,
    objectPosition: Vec3,
    cameraForward: Vec3
  ): { planeNormal: Vec3; planePoint: Vec3 } {
    let planeNormal: Vec3;

    switch (axis) {
      case 'x': {
        // For X axis, choose YZ or XZ plane based on view angle
        const useYZ = Math.abs(cameraForward[0]) > Math.abs(cameraForward[2]);
        planeNormal = useYZ ? [1, 0, 0] : [0, 0, 1];
        break;
      }
      case 'y': {
        // For Y axis, choose XY or YZ plane based on view angle
        const useXY = Math.abs(cameraForward[2]) > Math.abs(cameraForward[0]);
        planeNormal = useXY ? [0, 0, 1] : [1, 0, 0];
        break;
      }
      case 'z': {
        // For Z axis, choose XZ or YZ plane based on view angle
        const useXZ = Math.abs(cameraForward[1]) > Math.abs(cameraForward[0]);
        planeNormal = useXZ ? [0, 1, 0] : [1, 0, 0];
        break;
      }
      case 'xy':
        planeNormal = [0, 0, 1];
        break;
      case 'xz':
        planeNormal = [0, 1, 0];
        break;
      case 'yz':
        planeNormal = [1, 0, 0];
        break;
      case 'xyz':
      default:
        // Free movement: use plane perpendicular to camera
        planeNormal = normalize(cameraForward);
        break;
    }

    return { planeNormal, planePoint: objectPosition };
  }

  /**
   * Ray-plane intersection
   * Returns intersection point or null if parallel
   */
  private static rayPlaneIntersect(ray: Ray, planePoint: Vec3, planeNormal: Vec3): Vec3 | null {
    const denom = dot(ray.direction, planeNormal);
    if (Math.abs(denom) < 0.0001) return null; // Ray parallel to plane

    const t = dot(sub(planePoint, ray.origin), planeNormal) / denom;
    if (t < 0) return null; // Plane behind ray

    return add(ray.origin, [
      ray.direction[0] * t,
      ray.direction[1] * t,
      ray.direction[2] * t,
    ]);
  }

  // Snap position to grid
  static snapToGrid(position: Vec3, gridSize: number): Vec3 {
    return [
      Math.round(position[0] / gridSize) * gridSize,
      Math.round(position[1] / gridSize) * gridSize,
      Math.round(position[2] / gridSize) * gridSize,
    ];
  }

  // Apply precision modifier (slower movement when Shift is held)
  static applyPrecision(movement: Vec3, isPrecision: boolean, factor: number = 0.1): Vec3 {
    if (!isPrecision) return movement;
    return [movement[0] * factor, movement[1] * factor, movement[2] * factor];
  }
}
```

---

## Testing Requirements

### Manual Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T9.1 | Gizmo appears | Select object | Translation gizmo visible at object center |
| T9.2 | Gizmo disappears | Deselect object | Gizmo hidden |
| T9.3 | X axis drag | Drag red arrow | Object moves only along X |
| T9.4 | Y axis drag | Drag green arrow | Object moves only along Y |
| T9.5 | Z axis drag | Drag blue arrow | Object moves only along Z |
| T9.6 | XY plane drag | Drag yellow square | Object moves in XY plane |
| T9.7 | XZ plane drag | Drag cyan square | Object moves in XZ plane |
| T9.8 | YZ plane drag | Drag magenta square | Object moves in YZ plane |
| T9.9 | Hover highlight | Hover over axis | Axis brightens |
| T9.10 | Screen-space size | Zoom in/out | Gizmo stays same screen size |
| T9.11 | Snap with Ctrl | Hold Ctrl while dragging | Position snaps to 0.5 unit grid |
| T9.12 | Precision with Shift | Hold Shift while dragging | Movement slowed for precision |

### Edge Cases

| Test ID | Description | Expected |
|---------|-------------|----------|
| T9.E1 | Drag outside canvas | Drag continues, stops on mouse up |
| T9.E2 | Very small movement | Object position updates smoothly |
| T9.E3 | Camera looking down X | Y and Z axes still usable |

---

## Acceptance Criteria

- [ ] Translation gizmo renders at selected object
- [ ] All three axis arrows work correctly
- [ ] All three plane handles work correctly
- [ ] Hover state provides visual feedback
- [ ] Active (dragging) state clearly visible
- [ ] Gizmo maintains constant screen size
- [ ] Grid snapping works with Ctrl key
- [ ] Movement feels responsive and predictable
- [ ] Gizmo doesn't interfere with scene rendering

---

## Definition of Done

Stage 9 is complete when:
1. Translation gizmo appears on selected objects
2. All axis and plane translations work
3. Visual feedback for hover/active states
4. Snapping functionality works
5. Gizmo feels polished and responsive

