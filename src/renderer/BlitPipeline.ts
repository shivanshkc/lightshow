import blitWGSL from './shaders/blit.wgsl?raw';

/**
 * Handles the fullscreen blit pass to copy compute output to screen
 */
export class BlitPipeline {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline;
  private sampler: GPUSampler;
  private bindGroupLayout: GPUBindGroupLayout;

  constructor(device: GPUDevice, outputFormat: GPUTextureFormat) {
    this.device = device;

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
          texture: { sampleType: 'float', viewDimension: '2d' },
        },
      ],
    });

    // Create shader module
    const shaderModule = device.createShaderModule({
      code: blitWGSL,
    });

    // Create render pipeline
    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
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
   * Create bind group for the given texture view
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
    renderPass.draw(3); // Fullscreen triangle
    renderPass.end();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // GPU resources are cleaned up automatically
  }
}

