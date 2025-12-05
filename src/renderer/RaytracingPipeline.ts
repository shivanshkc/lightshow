import { Camera } from '../core/Camera';
import { SceneBuffer } from '../core/SceneBuffer';
import { SceneObject } from '../core/types';
import raytracerWGSL from './shaders/raytracer.wgsl?raw';

/**
 * Manages the raytracing compute pipeline and resources
 */
export class RaytracingPipeline {
  private device: GPUDevice;
  private pipeline: GPUComputePipeline;
  private bindGroupLayout: GPUBindGroupLayout;
  private bindGroup: GPUBindGroup | null = null;

  private outputTexture: GPUTexture | null = null;
  private outputTextureView: GPUTextureView | null = null;

  private cameraBuffer: GPUBuffer;
  private sceneBuffer: SceneBuffer;

  private width: number = 0;
  private height: number = 0;

  constructor(device: GPUDevice) {
    this.device = device;

    // Create camera uniform buffer (144 bytes = 36 floats)
    this.cameraBuffer = device.createBuffer({
      size: 144, // 36 * 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create scene buffer
    this.sceneBuffer = new SceneBuffer(device);

    // Create bind group layout
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: {
            access: 'write-only',
            format: 'rgba8unorm',
            viewDimension: '2d',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' },
        },
      ],
    });

    // Create compute pipeline
    const shaderModule = device.createShaderModule({
      code: raytracerWGSL,
    });

    this.pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });
  }

  /**
   * Create/recreate output texture when canvas resizes
   */
  resizeOutput(width: number, height: number): void {
    if (this.width === width && this.height === height) return;

    this.width = width;
    this.height = height;

    // Destroy old texture
    if (this.outputTexture) {
      this.outputTexture.destroy();
    }

    // Create new output texture
    this.outputTexture = this.device.createTexture({
      size: { width, height },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.outputTextureView = this.outputTexture.createView();

    // Recreate bind group with new texture
    this.recreateBindGroup();
  }

  /**
   * Recreate bind group (needed when texture changes)
   */
  private recreateBindGroup(): void {
    if (!this.outputTextureView) return;

    const sceneBuffer = this.sceneBuffer.getBuffer();
    const headerSize = SceneBuffer.getHeaderSize();

    this.bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.cameraBuffer },
        },
        {
          binding: 1,
          resource: this.outputTextureView,
        },
        {
          binding: 2,
          resource: { buffer: sceneBuffer, offset: 0, size: headerSize },
        },
        {
          binding: 3,
          resource: { buffer: sceneBuffer, offset: headerSize },
        },
      ],
    });
  }

  /**
   * Update camera uniform buffer
   */
  updateCamera(camera: Camera): void {
    const data = camera.getUniformData();
    this.device.queue.writeBuffer(this.cameraBuffer, 0, data);
  }

  /**
   * Update scene objects buffer
   */
  updateScene(objects: SceneObject[]): void {
    this.sceneBuffer.upload(objects);
  }

  /**
   * Run the compute pass
   */
  dispatch(commandEncoder: GPUCommandEncoder): void {
    if (!this.bindGroup || this.width === 0 || this.height === 0) return;

    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.pipeline);
    computePass.setBindGroup(0, this.bindGroup);

    // Calculate workgroup count (8x8 workgroup size)
    const workgroupSize = 8;
    const workgroupsX = Math.ceil(this.width / workgroupSize);
    const workgroupsY = Math.ceil(this.height / workgroupSize);

    computePass.dispatchWorkgroups(workgroupsX, workgroupsY);
    computePass.end();
  }

  /**
   * Get output texture view for blit
   */
  getOutputTextureView(): GPUTextureView | null {
    return this.outputTextureView;
  }

  /**
   * Get current dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cameraBuffer.destroy();
    this.sceneBuffer.destroy();
    if (this.outputTexture) {
      this.outputTexture.destroy();
    }
  }
}
