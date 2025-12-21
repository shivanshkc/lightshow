import { Camera, SceneBuffer, mat3FromRotation, mat3MultiplyVec3, type SceneObject, type Vec3 } from '@core';
import raytracerWGSL from './shaders/raytracer.wgsl?raw';
import { BUILTIN_MESH_COUNT, buildBuiltinMeshLibrary, type BuiltinMeshId } from './meshLibrary';

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

  // Mesh library buffers (Step 06 plumbing; not used by shader tracing yet)
  private meshSceneHeaderBuffer: GPUBuffer;
  private meshMetaBuffer: GPUBuffer;
  private meshVertexBuffer: GPUBuffer;
  private meshIndexBuffer: GPUBuffer;
  private meshBlasNodesBuffer: GPUBuffer;
  private meshInstancesBuffer: GPUBuffer;

  private meshAabbs: Array<{ min: Vec3; max: Vec3 }>;

  private width: number = 0;
  private height: number = 0;
  private frameIndex: number = 0;
  private lastBgColorPacked: number | null = null;
  private selectedObjectIndex: number = -1;
  private bgColorPacked: number = 0; // 0xRRGGBB

  constructor(device: GPUDevice) {
    this.device = device;

    // Create shader module
    const shaderModule = device.createShaderModule({
      code: raytracerWGSL,
    });

    // Create scene buffer
    this.sceneBuffer = new SceneBuffer(device);

    // Build CPU-side mesh library and upload GPU buffers (static for this release).
    const lib = buildBuiltinMeshLibrary();
    if (lib.meshCount !== BUILTIN_MESH_COUNT) {
      throw new Error(`Unexpected meshCount=${lib.meshCount}, expected ${BUILTIN_MESH_COUNT}`);
    }
    this.meshAabbs = lib.meshAabbs;

    // Mesh scene header (uniform to stay under maxStorageBuffersPerShaderStage on more GPUs)
    this.meshSceneHeaderBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // Write initial meshCount; instanceCount will be written on scene upload.
    {
      const header = new ArrayBuffer(16);
      const u32 = new Uint32Array(header);
      u32[0] = 0; // instanceCount
      u32[1] = lib.meshCount; // meshCount
      this.device.queue.writeBuffer(this.meshSceneHeaderBuffer, 0, header);
    }

    this.meshMetaBuffer = device.createBuffer({
      size: lib.meshMeta.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.meshMetaBuffer,
      0,
      lib.meshMeta.buffer,
      lib.meshMeta.byteOffset,
      lib.meshMeta.byteLength
    );

    this.meshVertexBuffer = device.createBuffer({
      size: lib.vertices.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.meshVertexBuffer,
      0,
      lib.vertices.buffer,
      lib.vertices.byteOffset,
      lib.vertices.byteLength
    );

    this.meshIndexBuffer = device.createBuffer({
      size: lib.indices.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.meshIndexBuffer,
      0,
      lib.indices.buffer,
      lib.indices.byteOffset,
      lib.indices.byteLength
    );

    this.meshBlasNodesBuffer = device.createBuffer({
      size: lib.blasNodes.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.meshBlasNodesBuffer, 0, lib.blasNodes);

    // Instances buffer: up to 256 visible instances, 128 bytes each (matches WGSL MeshInstance layout in Step 06)
    this.meshInstancesBuffer = device.createBuffer({
      size: 256 * 128,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

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
        // Mesh tracing buffers (Step 06 plumbing; not used by traceScene yet)
        {
          binding: 6,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' }, // Mesh scene header
        },
        {
          binding: 7,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // Mesh meta
        },
        {
          binding: 8,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // Mesh vertices
        },
        {
          binding: 9,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // Mesh indices
        },
        {
          binding: 10,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // BLAS nodes
        },
        {
          binding: 11,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // Instances
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
   * Update selection index (-1 if none) used by shader.
   *
   * This should be computed by the integration layer (renderer) without
   * per-frame allocations.
   */
  setSelectedObjectIndex(index: number): void {
    this.selectedObjectIndex = index | 0;
  }

  /**
   * Update background color packed as 0xRRGGBB (RGB 0..255).
   * Resets accumulation when the background changes so the update is visible immediately.
   */
  setBackgroundColorPacked(bgPacked: number): void {
    const next = bgPacked >>> 0;
    if (this.lastBgColorPacked !== null && next !== this.lastBgColorPacked) {
      this.resetAccumulation();
    }
    this.lastBgColorPacked = next;
    this.bgColorPacked = next;
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
        {
          binding: 6,
          resource: { buffer: this.meshSceneHeaderBuffer },
        },
        {
          binding: 7,
          resource: { buffer: this.meshMetaBuffer },
        },
        {
          binding: 8,
          resource: { buffer: this.meshVertexBuffer },
        },
        {
          binding: 9,
          resource: { buffer: this.meshIndexBuffer },
        },
        {
          binding: 10,
          resource: { buffer: this.meshBlasNodesBuffer },
        },
        {
          binding: 11,
          resource: { buffer: this.meshInstancesBuffer },
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
   *   bgData: vec3<u32>      offset 32-43 (16-byte aligned)
   *   (struct padding)       offset 44-47
   */
  private updateSettings(): void {
    // Create buffer: 48 bytes to match WGSL struct alignment
    const buffer = new ArrayBuffer(48);
    const uint32View = new Uint32Array(buffer);
    const int32View = new Int32Array(buffer);

    uint32View[0] = this.frameIndex;
    uint32View[1] = 1; // samples per pixel per frame
    uint32View[2] = 8; // max bounces
    uint32View[3] = 1; // flags: bit 0 = accumulate
    int32View[4] = this.selectedObjectIndex; // selected object index (-1 if none)
    // uint32View[5-7] = implicit padding (already 0)
    uint32View[8] = this.bgColorPacked >>> 0;
    // uint32View[9-10] = unused (already 0)
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
  updateScene(objects: readonly SceneObject[]): void {
    this.sceneBuffer.upload(objects as SceneObject[]);
    this.uploadMeshInstances(objects as SceneObject[]);
  }

  private uploadMeshInstances(objects: SceneObject[]): void {
    const visible = objects.filter((o) => o.visible);
    const count = Math.min(visible.length, 256);

    // Header (instanceCount, meshCount)
    const header = new ArrayBuffer(16);
    const headerU32 = new Uint32Array(header);
    headerU32[0] = count;
    headerU32[1] = BUILTIN_MESH_COUNT;
    this.device.queue.writeBuffer(this.meshSceneHeaderBuffer, 0, header);

    // Instance layout: 128 bytes = 32 floats (with u32 overlay), matching WGSL MeshInstance.
    const INSTANCE_FLOATS = 32;
    const staging = new Float32Array(count * INSTANCE_FLOATS);
    const u32 = new Uint32Array(staging.buffer);

    for (let i = 0; i < count; i++) {
      const obj = visible[i]!;
      const base = i * INSTANCE_FLOATS;

      // Transform
      staging[base + 0] = obj.transform.position[0];
      staging[base + 1] = obj.transform.position[1];
      staging[base + 2] = obj.transform.position[2];
      u32[base + 3] = this.primitiveToMeshId(obj.type);

      staging[base + 4] = obj.transform.scale[0];
      staging[base + 5] = obj.transform.scale[1];
      staging[base + 6] = obj.transform.scale[2];
      staging[base + 7] = 0;

      staging[base + 8] = obj.transform.rotation[0];
      staging[base + 9] = obj.transform.rotation[1];
      staging[base + 10] = obj.transform.rotation[2];
      staging[base + 11] = 0;

      // Material (same mapping as SceneBuffer)
      staging[base + 16] = obj.material.color[0];
      staging[base + 17] = obj.material.color[1];
      staging[base + 18] = obj.material.color[2];
      u32[base + 19] = this.materialTypeToGpu(obj.material.type);
      staging[base + 20] = obj.material.ior;
      staging[base + 21] = obj.material.intensity;

      // Instance AABB (world space) at slots [24..29]
      const meshId = this.primitiveToMeshId(obj.type) as BuiltinMeshId;
      const aabb = this.computeInstanceAabb(obj, this.meshAabbs[meshId]!);
      staging[base + 24] = aabb.min[0];
      staging[base + 25] = aabb.min[1];
      staging[base + 26] = aabb.min[2];
      staging[base + 28] = aabb.max[0];
      staging[base + 29] = aabb.max[1];
      staging[base + 30] = aabb.max[2];
    }

    this.device.queue.writeBuffer(this.meshInstancesBuffer, 0, staging);
  }

  private primitiveToMeshId(type: SceneObject['type']): number {
    switch (type) {
      case 'sphere':
        return 0;
      case 'cuboid':
        return 1;
      case 'cylinder':
        return 2;
      case 'cone':
        return 3;
      case 'capsule':
        return 4;
      case 'torus':
        return 5;
    }
  }

  private materialTypeToGpu(type: SceneObject['material']['type']): number {
    switch (type) {
      case 'plastic':
        return 0;
      case 'metal':
        return 1;
      case 'glass':
        return 2;
      case 'light':
        return 3;
    }
  }

  private computeInstanceAabb(
    obj: SceneObject,
    meshAabb: { min: Vec3; max: Vec3 }
  ): { min: Vec3; max: Vec3 } {
    // Scale object-space bounds (support negative scale by min/max of endpoints).
    const sx = obj.transform.scale[0];
    const sy = obj.transform.scale[1];
    const sz = obj.transform.scale[2];
    const minX = Math.min(meshAabb.min[0] * sx, meshAabb.max[0] * sx);
    const maxX = Math.max(meshAabb.min[0] * sx, meshAabb.max[0] * sx);
    const minY = Math.min(meshAabb.min[1] * sy, meshAabb.max[1] * sy);
    const maxY = Math.max(meshAabb.min[1] * sy, meshAabb.max[1] * sy);
    const minZ = Math.min(meshAabb.min[2] * sz, meshAabb.max[2] * sz);
    const maxZ = Math.max(meshAabb.min[2] * sz, meshAabb.max[2] * sz);

    const corners: Vec3[] = [
      [minX, minY, minZ],
      [minX, minY, maxZ],
      [minX, maxY, minZ],
      [minX, maxY, maxZ],
      [maxX, minY, minZ],
      [maxX, minY, maxZ],
      [maxX, maxY, minZ],
      [maxX, maxY, maxZ],
    ];

    const rot = mat3FromRotation(obj.transform.rotation);
    const pos = obj.transform.position;

    let outMin: Vec3 = [Infinity, Infinity, Infinity];
    let outMax: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const c of corners) {
      const r = mat3MultiplyVec3(rot, c);
      const w: Vec3 = [r[0] + pos[0], r[1] + pos[1], r[2] + pos[2]];
      outMin = [Math.min(outMin[0], w[0]), Math.min(outMin[1], w[1]), Math.min(outMin[2], w[2])];
      outMax = [Math.max(outMax[0], w[0]), Math.max(outMax[1], w[1]), Math.max(outMax[2], w[2])];
    }
    return { min: outMin, max: outMax };
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
    this.meshSceneHeaderBuffer.destroy();
    this.meshMetaBuffer.destroy();
    this.meshVertexBuffer.destroy();
    this.meshIndexBuffer.destroy();
    this.meshBlasNodesBuffer.destroy();
    this.meshInstancesBuffer.destroy();
  }
}
