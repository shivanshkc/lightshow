import { Camera } from '../core/Camera';
import { SceneBuffer } from '../core/SceneBuffer';
import { SceneObject } from '../core/types';
import raytracerWGSL from './shaders/raytracer.wgsl?raw';

/**
 * Manages the raytracing compute pipeline
 * Handles compute shader dispatch, camera uniforms, scene buffer, and output texture
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

    // Create shader module
    const shaderModule = device.createShaderModule({
      code: raytracerWGSL,
    });

    // Create scene buffer
    this.sceneBuffer = new SceneBuffer(device);

    // Create bind group layout (with scene buffer bindings)
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
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // Scene header
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // Scene objects
        },
      ],
    });

    // Create pipeline layout
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    // Create compute pipeline
    this.pipeline = device.createComputePipeline({
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    // Create camera uniform buffer (144 bytes = 36 floats)
    this.cameraBuffer = device.createBuffer({
      size: 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Resize the output texture
   * Must be called before first dispatch and when canvas size changes
   */
  resizeOutput(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    if (width <= 0 || height <= 0) return;

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

    // Recreate bind group with new texture and scene buffer
    this.rebuildBindGroup();
  }

  /**
   * Rebuild the bind group (call after resize or scene buffer change)
   */
  private rebuildBindGroup(): void {
    if (!this.outputTextureView) return;

    const sceneBuffer = this.sceneBuffer.getBuffer();

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
          resource: { 
            buffer: sceneBuffer,
            offset: 0,
            size: 256, // Header size (padded to 256 bytes for WebGPU alignment)
          },
        },
        {
          binding: 3,
          resource: { 
            buffer: sceneBuffer,
            offset: 256, // After header (256-byte aligned)
          },
        },
      ],
    });
  }

  /**
   * Update camera uniform buffer
   */
  updateCamera(camera: Camera): void {
    const data = camera.getUniformData();
    this.device.queue.writeBuffer(this.cameraBuffer, 0, data.buffer);
  }

  /**
   * Update scene objects
   */
  updateScene(objects: SceneObject[]): void {
    this.sceneBuffer.upload(objects);
  }

  /**
   * Dispatch the compute shader
   */
  dispatch(commandEncoder: GPUCommandEncoder): void {
    if (!this.bindGroup || this.width === 0 || this.height === 0) return;

    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.pipeline);
    computePass.setBindGroup(0, this.bindGroup);

    // Dispatch workgroups (workgroup size is 8x8)
    const workgroupSize = 8;
    const workgroupsX = Math.ceil(this.width / workgroupSize);
    const workgroupsY = Math.ceil(this.height / workgroupSize);
    computePass.dispatchWorkgroups(workgroupsX, workgroupsY);

    computePass.end();
  }

  /**
   * Get the output texture view for blitting
   */
  getOutputTextureView(): GPUTextureView | null {
    return this.outputTextureView;
  }

  /**
   * Get current output dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.outputTexture) {
      this.outputTexture.destroy();
    }
    this.cameraBuffer.destroy();
    this.sceneBuffer.destroy();
  }
}
