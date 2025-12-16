import { createTranslateGizmoGeometry, GizmoMesh } from './GizmoGeometry';
import { createRotateGizmoGeometry } from './RotateGizmoGeometry';
import { createScaleGizmoGeometry } from './ScaleGizmoGeometry';
import { GizmoMode } from '../store/gizmoStore';
import gizmoShaderWGSL from './gizmoShader.wgsl?raw';

/**
 * Renders gizmos using WebGPU
 * Supports translate, rotate, and scale modes
 * Gizmos are rendered on top of the scene (no depth test)
 */
export class GizmoRenderer {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline;
  private bindGroupLayout: GPUBindGroupLayout;
  private bindGroup: GPUBindGroup;
  private uniformBuffer: GPUBuffer;

  // Geometry for each mode
  private translateGeometry: GizmoMesh;
  private rotateGeometry: GizmoMesh;
  private scaleGeometry: GizmoMesh;

  // Buffers for each mode
  private translateVertexBuffer: GPUBuffer;
  private translateIndexBuffer: GPUBuffer;
  private rotateVertexBuffer: GPUBuffer;
  private rotateIndexBuffer: GPUBuffer;
  private scaleVertexBuffer: GPUBuffer;
  private scaleIndexBuffer: GPUBuffer;

  constructor(device: GPUDevice, outputFormat: GPUTextureFormat) {
    this.device = device;

    // Create shader module
    const shaderModule = device.createShaderModule({
      code: gizmoShaderWGSL,
    });

    // Create bind group layout
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
      ],
    });

    // Create pipeline layout
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    // Create render pipeline
    this.pipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            // Interleaved: position(3) + color(4) + axisId(1) = 8 floats = 32 bytes
            arrayStride: 32,
            attributes: [
              { format: 'float32x3', offset: 0, shaderLocation: 0 }, // position
              { format: 'float32x4', offset: 12, shaderLocation: 1 }, // color
              { format: 'float32', offset: 28, shaderLocation: 2 }, // axisId
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: outputFormat,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none', // Gizmos visible from both sides
      },
      // No depth stencil - gizmos always render on top
    });

    // Create uniform buffer (96 bytes: mat4x4 + vec3 + f32 + 2*u32 + 2*f32 padding)
    this.uniformBuffer = device.createBuffer({
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create bind group
    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        },
      ],
    });

    // Create geometry for all modes
    this.translateGeometry = createTranslateGizmoGeometry();
    this.rotateGeometry = createRotateGizmoGeometry();
    this.scaleGeometry = createScaleGizmoGeometry();

    // Create buffers for translate gizmo
    this.translateVertexBuffer = device.createBuffer({
      size: this.translateGeometry.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.translateVertexBuffer,
      0,
      this.translateGeometry.vertices.buffer as ArrayBuffer,
      this.translateGeometry.vertices.byteOffset,
      this.translateGeometry.vertices.byteLength
    );

    this.translateIndexBuffer = device.createBuffer({
      size: this.translateGeometry.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.translateIndexBuffer,
      0,
      this.translateGeometry.indices.buffer as ArrayBuffer,
      this.translateGeometry.indices.byteOffset,
      this.translateGeometry.indices.byteLength
    );

    // Create buffers for rotate gizmo
    this.rotateVertexBuffer = device.createBuffer({
      size: this.rotateGeometry.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.rotateVertexBuffer,
      0,
      this.rotateGeometry.vertices.buffer as ArrayBuffer,
      this.rotateGeometry.vertices.byteOffset,
      this.rotateGeometry.vertices.byteLength
    );

    this.rotateIndexBuffer = device.createBuffer({
      size: this.rotateGeometry.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.rotateIndexBuffer,
      0,
      this.rotateGeometry.indices.buffer as ArrayBuffer,
      this.rotateGeometry.indices.byteOffset,
      this.rotateGeometry.indices.byteLength
    );

    // Create buffers for scale gizmo
    this.scaleVertexBuffer = device.createBuffer({
      size: this.scaleGeometry.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.scaleVertexBuffer,
      0,
      this.scaleGeometry.vertices.buffer as ArrayBuffer,
      this.scaleGeometry.vertices.byteOffset,
      this.scaleGeometry.vertices.byteLength
    );

    this.scaleIndexBuffer = device.createBuffer({
      size: this.scaleGeometry.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.scaleIndexBuffer,
      0,
      this.scaleGeometry.indices.buffer as ArrayBuffer,
      this.scaleGeometry.indices.byteOffset,
      this.scaleGeometry.indices.byteLength
    );
  }

  /**
   * Render the gizmo
   * Should be called after the main scene is rendered
   */
  render(
    commandEncoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    viewProjectionMatrix: Float32Array,
    gizmoPosition: [number, number, number],
    cameraDistance: number,
    hoveredAxis: number,
    activeAxis: number,
    mode: GizmoMode = 'translate'
  ): void {
    if (mode === 'none') return;

    // Select geometry based on mode
    let vertexBuffer: GPUBuffer;
    let indexBuffer: GPUBuffer;
    let indexCount: number;

    switch (mode) {
      case 'rotate':
        vertexBuffer = this.rotateVertexBuffer;
        indexBuffer = this.rotateIndexBuffer;
        indexCount = this.rotateGeometry.indexCount;
        break;
      case 'scale':
        vertexBuffer = this.scaleVertexBuffer;
        indexBuffer = this.scaleIndexBuffer;
        indexCount = this.scaleGeometry.indexCount;
        break;
      case 'translate':
      default:
        vertexBuffer = this.translateVertexBuffer;
        indexBuffer = this.translateIndexBuffer;
        indexCount = this.translateGeometry.indexCount;
        break;
    }

    // Calculate gizmo scale to maintain constant screen size
    const gizmoScale = cameraDistance * 0.12;

    // Update uniforms
    const uniformData = new ArrayBuffer(96);
    const floatView = new Float32Array(uniformData);
    const uint32View = new Uint32Array(uniformData);

    // viewProjection matrix (16 floats)
    floatView.set(viewProjectionMatrix, 0);

    // gizmoPosition (3 floats at offset 64)
    floatView[16] = gizmoPosition[0];
    floatView[17] = gizmoPosition[1];
    floatView[18] = gizmoPosition[2];

    // gizmoScale (1 float at offset 76)
    floatView[19] = gizmoScale;

    // hoveredAxis (1 u32 at offset 80)
    uint32View[20] = hoveredAxis;

    // activeAxis (1 u32 at offset 84)
    uint32View[21] = activeAxis;

    // _pad (2 floats, already 0)

    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

    // Begin render pass
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: targetView,
          loadOp: 'load', // Preserve existing content
          storeOp: 'store',
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, 'uint16');
    renderPass.drawIndexed(indexCount);
    renderPass.end();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.uniformBuffer.destroy();
    this.translateVertexBuffer.destroy();
    this.translateIndexBuffer.destroy();
    this.rotateVertexBuffer.destroy();
    this.rotateIndexBuffer.destroy();
    this.scaleVertexBuffer.destroy();
    this.scaleIndexBuffer.destroy();
  }
}
