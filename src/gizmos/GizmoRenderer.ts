import { createTranslateGizmoGeometry, GizmoMesh } from './GizmoGeometry';
import gizmoShaderWGSL from './gizmoShader.wgsl?raw';

/**
 * Renders gizmos using WebGPU
 * Gizmos are rendered on top of the scene (no depth test)
 */
export class GizmoRenderer {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline;
  private bindGroupLayout: GPUBindGroupLayout;
  private bindGroup: GPUBindGroup;
  private uniformBuffer: GPUBuffer;
  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private indexCount: number;

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

    // Create geometry
    const geometry = createTranslateGizmoGeometry();
    this.indexCount = geometry.indexCount;

    // Create vertex buffer
    this.vertexBuffer = device.createBuffer({
      size: geometry.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, geometry.vertices);

    // Create index buffer
    this.indexBuffer = device.createBuffer({
      size: geometry.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.indexBuffer, 0, geometry.indices);
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
    activeAxis: number
  ): void {
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
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
    renderPass.drawIndexed(this.indexCount);
    renderPass.end();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.uniformBuffer.destroy();
    this.vertexBuffer.destroy();
    this.indexBuffer.destroy();
  }
}

