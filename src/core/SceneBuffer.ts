import { SceneObject } from './types';

/**
 * GPU buffer layout constants
 * Must match the WGSL shader struct layout exactly
 */
const OBJECT_SIZE_BYTES = 128; // Each object is 128 bytes aligned
const MAX_OBJECTS = 256;
const HEADER_SIZE_BYTES = 32; // SceneHeader struct size (must be at least 32 for WebGPU min binding size)

/**
 * SceneBuffer manages the GPU storage buffers for scene objects
 * 
 * Uses two separate buffers to meet WebGPU alignment requirements:
 * - Header buffer (16 bytes): objectCount (u32) + padding (vec3<u32>)
 * - Objects buffer (128 bytes each):
 *   Transform (64 bytes):
 *     - position (vec3<f32>) + objectType (u32) = 16 bytes
 *     - scale (vec3<f32>) + pad = 16 bytes
 *     - rotation (vec3<f32>) + pad = 16 bytes
 *     - padding (vec4<f32>) = 16 bytes
 *   Material (64 bytes):
 *     - color (vec3<f32>) + roughness (f32) = 16 bytes
 *     - emissionColor (vec3<f32>) + emission (f32) = 16 bytes
 *     - transparency (f32) + ior (f32) + metallic (f32) + pad (f32) = 16 bytes
 *     - padding (vec4<f32>) = 16 bytes
 */
export class SceneBuffer {
  private device: GPUDevice;
  private headerBuffer: GPUBuffer;
  private objectsBuffer: GPUBuffer;
  private headerData: Uint32Array;
  private objectsData: Float32Array;

  constructor(device: GPUDevice) {
    this.device = device;

    // Create header buffer (16 bytes minimum, but use 256 for alignment)
    this.headerBuffer = device.createBuffer({
      size: HEADER_SIZE_BYTES,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Create objects buffer
    const objectsBufferSize = MAX_OBJECTS * OBJECT_SIZE_BYTES;
    this.objectsBuffer = device.createBuffer({
      size: objectsBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Create staging arrays (CPU side) - 32 bytes = 8 u32s
    this.headerData = new Uint32Array(HEADER_SIZE_BYTES / 4);
    this.objectsData = new Float32Array(objectsBufferSize / 4);
  }

  /**
   * Upload scene objects to GPU
   */
  upload(objects: SceneObject[]): void {
    const count = Math.min(objects.length, MAX_OBJECTS);

    // Clear staging buffers
    this.headerData.fill(0);
    this.objectsData.fill(0);

    // Write header (object count)
    this.headerData[0] = count;

    // Write each object
    const objectFloats = OBJECT_SIZE_BYTES / 4; // 32 floats per object

    for (let i = 0; i < count; i++) {
      const obj = objects[i];
      if (obj.visible) {
        const offset = i * objectFloats;
        this.writeObject(obj, offset);
      }
    }

    // Upload to GPU
    this.device.queue.writeBuffer(this.headerBuffer, 0, this.headerData);
    this.device.queue.writeBuffer(this.objectsBuffer, 0, this.objectsData);
  }

  /**
   * Write a single object to the staging buffer
   */
  private writeObject(obj: SceneObject, offset: number): void {
    const buf = this.objectsData;
    const uint32View = new Uint32Array(buf.buffer);

    // Transform section (64 bytes = 16 floats)
    // Row 0: position (vec3) + objectType (u32)
    buf[offset + 0] = obj.transform.position[0];
    buf[offset + 1] = obj.transform.position[1];
    buf[offset + 2] = obj.transform.position[2];
    uint32View[offset + 3] = obj.type === 'sphere' ? 0 : 1;

    // Row 1: scale (vec3) + padding (f32)
    buf[offset + 4] = obj.transform.scale[0];
    buf[offset + 5] = obj.transform.scale[1];
    buf[offset + 6] = obj.transform.scale[2];
    buf[offset + 7] = 0; // padding

    // Row 2: rotation (vec3) + padding (f32)
    buf[offset + 8] = obj.transform.rotation[0];
    buf[offset + 9] = obj.transform.rotation[1];
    buf[offset + 10] = obj.transform.rotation[2];
    buf[offset + 11] = 0; // padding

    // Row 3: transform padding (vec4)
    buf[offset + 12] = 0;
    buf[offset + 13] = 0;
    buf[offset + 14] = 0;
    buf[offset + 15] = 0;

    // Material section (64 bytes = 16 floats)
    const matOffset = offset + 16;

    // Row 0: color (vec3) + roughness (f32)
    buf[matOffset + 0] = obj.material.color[0];
    buf[matOffset + 1] = obj.material.color[1];
    buf[matOffset + 2] = obj.material.color[2];
    buf[matOffset + 3] = obj.material.roughness;

    // Row 1: emissionColor (vec3) + emission (f32)
    buf[matOffset + 4] = obj.material.emissionColor[0];
    buf[matOffset + 5] = obj.material.emissionColor[1];
    buf[matOffset + 6] = obj.material.emissionColor[2];
    buf[matOffset + 7] = obj.material.emission;

    // Row 2: transparency (f32) + ior (f32) + metallic (f32) + padding (f32)
    buf[matOffset + 8] = obj.material.transparency;
    buf[matOffset + 9] = obj.material.ior;
    buf[matOffset + 10] = obj.material.metallic;
    buf[matOffset + 11] = 0; // padding

    // Row 3: material padding (vec4)
    buf[matOffset + 12] = 0;
    buf[matOffset + 13] = 0;
    buf[matOffset + 14] = 0;
    buf[matOffset + 15] = 0;
  }

  /**
   * Get the header GPU buffer for binding
   */
  getHeaderBuffer(): GPUBuffer {
    return this.headerBuffer;
  }

  /**
   * Get the objects GPU buffer for binding
   */
  getObjectsBuffer(): GPUBuffer {
    return this.objectsBuffer;
  }

  /**
   * Get buffer size constants
   */
  static getHeaderSize(): number {
    return HEADER_SIZE_BYTES;
  }

  static getMaxObjects(): number {
    return MAX_OBJECTS;
  }

  static getObjectSize(): number {
    return OBJECT_SIZE_BYTES;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.headerBuffer.destroy();
    this.objectsBuffer.destroy();
  }
}
