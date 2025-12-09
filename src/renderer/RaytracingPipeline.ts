import { Camera } from '../core/Camera';
import { SceneBuffer } from '../core/SceneBuffer';
import { SceneObject } from '../core/types';
import { useSceneStore } from '../store/sceneStore';
import raytracerWGSL from './shaders/raytracer.wgsl?raw';

/**
 * Manages the raytracing compute pipeline
 * Handles compute shader dispatch, camera uniforms, scene buffer, and output texture
 * Supports progressive accumulation for path tracing
 */
export class RaytracingPipeline {
  private device: GPUDevice;
  private pipeline: GPUComputePipeline;
  private bindGroupLayout: GPUBindGroupLayout;
  private bindGroup: GPUBindGroup | null = null;

  private outputTexture: GPUTexture | null = null;
  private outputTextureView: GPUTextureView | null = null;

  private accumulationBuffer: GPUBuffer | null = null;

  private cameraBuffer: GPUBuffer;
  private settingsBuffer: GPUBuffer;
  private sceneBuffer: SceneBuffer;

  private width: number = 0;
  private height: number = 0;
  private frameIndex: number = 0;

  constructor(device: GPUDevice) {
    this.device = device;

    // Create shader module
    const shaderModule = device.createShaderModule({
      code: raytracerWGSL,
    });

    // Create scene buffer
    this.sceneBuffer = new SceneBuffer(device);

    // Create bind group layout (with accumulation buffer and settings)
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' }, // Camera
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' }, // Settings
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: {
            access: 'write-only',
            format: 'rgba8unorm',
          }, // Output texture
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' }, // Accumulation buffer (read-write)
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // Scene header
        },
        {
          binding: 5,
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

    // Create settings uniform buffer (48 bytes due to WGSL alignment: vec3 needs 16-byte alignment)
    this.settingsBuffer = device.createBuffer({
      size: 48,
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

    // Destroy old resources
    if (this.outputTexture) {
      this.outputTexture.destroy();
    }
    if (this.accumulationBuffer) {
      this.accumulationBuffer.destroy();
    }

    // Create new output texture (rgba8unorm for final display)
    this.outputTexture = this.device.createTexture({
      size: { width, height },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.outputTextureView = this.outputTexture.createView();

    // Create new accumulation buffer (4 floats per pixel: RGB + sample count)
    const bufferSize = width * height * 4 * 4; // width * height * 4 components * 4 bytes
    this.accumulationBuffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Reset accumulation on resize
    this.resetAccumulation();

    // Recreate bind group with new resources
    this.rebuildBindGroup();
  }

  /**
   * Rebuild the bind group (call after resize)
   */
  private rebuildBindGroup(): void {
    if (!this.outputTextureView || !this.accumulationBuffer) return;

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
          resource: { buffer: this.settingsBuffer },
        },
        {
          binding: 2,
          resource: this.outputTextureView,
        },
        {
          binding: 3,
          resource: { buffer: this.accumulationBuffer },
        },
        {
          binding: 4,
          resource: {
            buffer: sceneBuffer,
            offset: 0,
            size: 256, // Header size (padded to 256 bytes for WebGPU alignment)
          },
        },
        {
          binding: 5,
          resource: {
            buffer: sceneBuffer,
            offset: 256, // After header (256-byte aligned)
          },
        },
      ],
    });
  }

  /**
   * Reset accumulation (call when scene or camera changes)
   */
  resetAccumulation(): void {
    this.frameIndex = 0;
  }

  /**
   * Get current frame index (sample count)
   */
  getFrameIndex(): number {
    return this.frameIndex;
  }

  /**
   * Update settings uniform buffer
   * WGSL struct layout (48 bytes due to vec3 alignment):
   *   frameIndex: u32        offset 0
   *   samplesPerPixel: u32   offset 4
   *   maxBounces: u32        offset 8
   *   flags: u32             offset 12
   *   selectedObjectIndex: i32  offset 16
   *   (implicit padding)     offset 20-31
   *   _pad: vec3<u32>        offset 32-43 (16-byte aligned)
   *   (struct padding)       offset 44-47
   */
  private updateSettings(): void {
    // Find the index of the selected object
    const { objects, selectedObjectId } = useSceneStore.getState();
    const visibleObjects = objects.filter((o) => o.visible);
    const selectedIndex = selectedObjectId
      ? visibleObjects.findIndex((o) => o.id === selectedObjectId)
      : -1;

    // Create buffer: 48 bytes to match WGSL struct alignment
    const buffer = new ArrayBuffer(48);
    const uint32View = new Uint32Array(buffer);
    const int32View = new Int32Array(buffer);

    uint32View[0] = this.frameIndex;
    uint32View[1] = 1; // samples per pixel per frame
    uint32View[2] = 8; // max bounces
    uint32View[3] = 1; // flags: bit 0 = accumulate
    int32View[4] = selectedIndex; // selected object index (-1 if none)
    // uint32View[5-7] = implicit padding (already 0)
    // uint32View[8-10] = _pad vec3 (already 0)
    // uint32View[11] = struct padding (already 0)

    this.device.queue.writeBuffer(this.settingsBuffer, 0, buffer);
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

    // Update settings before dispatch
    this.updateSettings();

    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.pipeline);
    computePass.setBindGroup(0, this.bindGroup);

    // Dispatch workgroups (workgroup size is 8x8)
    const workgroupSize = 8;
    const workgroupsX = Math.ceil(this.width / workgroupSize);
    const workgroupsY = Math.ceil(this.height / workgroupSize);
    computePass.dispatchWorkgroups(workgroupsX, workgroupsY);

    computePass.end();

    // Increment frame index after dispatch
    this.frameIndex++;
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
    if (this.accumulationBuffer) {
      this.accumulationBuffer.destroy();
    }
    this.cameraBuffer.destroy();
    this.settingsBuffer.destroy();
    this.sceneBuffer.destroy();
  }
}
