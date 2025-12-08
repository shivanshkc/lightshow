import blitWGSL from './shaders/blit.wgsl?raw';

/**
 * Handles blitting the raytracing output to the screen
 * Uses a fullscreen triangle technique for efficiency
 */
export class BlitPipeline {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline;
  private sampler: GPUSampler;
  private bindGroupLayout: GPUBindGroupLayout;

  constructor(device: GPUDevice, outputFormat: GPUTextureFormat) {
    this.device = device;

    // Create shader module
    const shaderModule = device.createShaderModule({
      code: blitWGSL,
    });

    // Create sampler for texture sampling
    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // Create bind group layout
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
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
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format: outputFormat }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });
  }

  /**
   * Create a bind group for the given texture view
   */
  createBindGroup(textureView: GPUTextureView): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.sampler,
        },
        {
          binding: 1,
          resource: textureView,
        },
      ],
    });
  }

  /**
   * Render the fullscreen quad to copy source texture to target
   */
  render(
    commandEncoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    sourceTextureView: GPUTextureView
  ): void {
    const bindGroup = this.createBindGroup(sourceTextureView);

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: targetView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(3); // Draw fullscreen triangle (3 vertices)

    renderPass.end();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // GPU resources are automatically cleaned up when device is destroyed
  }
}

