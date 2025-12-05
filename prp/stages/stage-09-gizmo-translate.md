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

```typescript
import { Vec3, sub, add, mul, dot, normalize, cross } from '../core/math';
import { useGizmoStore, GizmoAxis } from '../store/gizmoStore';
import { useSceneStore } from '../store/sceneStore';

export class TranslateGizmo {
  // Calculate new position during drag
  static calculateDragPosition(
    axis: GizmoAxis,
    startPosition: Vec3,
    startMousePos: [number, number],
    currentMousePos: [number, number],
    cameraPosition: Vec3,
    cameraRight: Vec3,
    cameraUp: Vec3,
    screenScale: number
  ): Vec3 {
    const deltaX = (currentMousePos[0] - startMousePos[0]) * screenScale;
    const deltaY = (currentMousePos[1] - startMousePos[1]) * screenScale;
    
    // Project mouse movement onto the constrained axis/plane
    let movement: Vec3 = [0, 0, 0];
    
    switch (axis) {
      case 'x': {
        // Project onto X axis
        const xDir: Vec3 = [1, 0, 0];
        const screenX = dot(xDir, cameraRight);
        const screenY = dot(xDir, cameraUp);
        const projected = deltaX * screenX - deltaY * screenY;
        movement = [projected, 0, 0];
        break;
      }
      case 'y': {
        const yDir: Vec3 = [0, 1, 0];
        const screenX = dot(yDir, cameraRight);
        const screenY = dot(yDir, cameraUp);
        const projected = deltaX * screenX - deltaY * screenY;
        movement = [0, projected, 0];
        break;
      }
      case 'z': {
        const zDir: Vec3 = [0, 0, 1];
        const screenX = dot(zDir, cameraRight);
        const screenY = dot(zDir, cameraUp);
        const projected = deltaX * screenX - deltaY * screenY;
        movement = [0, 0, projected];
        break;
      }
      case 'xy': {
        movement = [
          deltaX * cameraRight[0] - deltaY * cameraUp[0],
          deltaX * cameraRight[1] - deltaY * cameraUp[1],
          0,
        ];
        break;
      }
      case 'xz': {
        movement = [
          deltaX * cameraRight[0],
          0,
          -deltaY,  // Approximate - proper implementation uses plane intersection
        ];
        break;
      }
      case 'yz': {
        movement = [
          0,
          -deltaY * cameraUp[1],
          deltaX * cameraRight[2],
        ];
        break;
      }
      case 'xyz': {
        movement = [
          deltaX * cameraRight[0] - deltaY * cameraUp[0],
          deltaX * cameraRight[1] - deltaY * cameraUp[1],
          deltaX * cameraRight[2] - deltaY * cameraUp[2],
        ];
        break;
      }
    }
    
    return add(startPosition, movement);
  }
  
  // Snap position to grid
  static snapToGrid(position: Vec3, gridSize: number): Vec3 {
    return [
      Math.round(position[0] / gridSize) * gridSize,
      Math.round(position[1] / gridSize) * gridSize,
      Math.round(position[2] / gridSize) * gridSize,
    ];
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

