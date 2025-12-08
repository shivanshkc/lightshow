import { SceneObject, MaterialType } from './types';

/**
 * GPU buffer layout constants
 * These must match the shader struct definitions exactly
 * Note: WebGPU requires 256-byte alignment for storage buffer bindings
 */
const OBJECT_SIZE_BYTES = 128; // 32 floats per object
const MAX_OBJECTS = 256;
const HEADER_SIZE_BYTES = 256; // Padded to 256 bytes for WebGPU alignment

/**
 * Material type to GPU index mapping
 */
const MATERIAL_TYPE_MAP: Record<MaterialType, number> = {
  plastic: 0,
  metal: 1,
  glass: 2,
  light: 3,
};

/**
 * Manages GPU buffer for scene objects
 * Serializes SceneObject data into a format the shader can read
 */
export class SceneBuffer {
  private device: GPUDevice;
  private buffer: GPUBuffer;
  private stagingData: Float32Array;

  constructor(device: GPUDevice) {
    this.device = device;

    // Total buffer size: header + max objects
    const bufferSize = HEADER_SIZE_BYTES + MAX_OBJECTS * OBJECT_SIZE_BYTES;

    // Create GPU buffer
    this.buffer = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Create staging buffer (CPU side) - sized in floats
    this.stagingData = new Float32Array(bufferSize / 4);
  }

  /**
   * Upload scene objects to GPU buffer
   * Should be called whenever scene changes
   */
  upload(objects: SceneObject[]): void {
    const visibleObjects = objects.filter((o) => o.visible);
    const count = Math.min(visibleObjects.length, MAX_OBJECTS);

    // Clear staging buffer
    this.stagingData.fill(0);

    // Write header (object count as u32)
    const headerView = new Uint32Array(this.stagingData.buffer, 0, 4);
    headerView[0] = count;

    // Write each object
    const headerFloats = HEADER_SIZE_BYTES / 4;
    const objectFloats = OBJECT_SIZE_BYTES / 4;

    for (let i = 0; i < count; i++) {
      const obj = visibleObjects[i];
      const offset = headerFloats + i * objectFloats;
      this.writeObject(obj, offset);
    }

    // Upload to GPU
    this.device.queue.writeBuffer(this.buffer, 0, this.stagingData.buffer);
  }

  /**
   * Write a single object to the staging buffer
   * Layout (128 bytes = 32 floats):
   * 
   * Transform section (64 bytes = 16 floats):
   *   [0-2]   position (vec3)
   *   [3]     objectType (u32: 0=sphere, 1=cuboid)
   *   [4-6]   scale (vec3)
   *   [7]     padding
   *   [8-10]  rotation (vec3)
   *   [11]    padding
   *   [12-15] padding (vec4)
   * 
   * Material section (64 bytes = 16 floats):
   *   [16-18] color (vec3)
   *   [19]    materialType (u32: 0=plastic, 1=metal, 2=glass, 3=light)
   *   [20]    ior (f32)
   *   [21]    intensity (f32)
   *   [22-23] padding (vec2)
   *   [24-31] padding (vec4 + vec4)
   */
  private writeObject(obj: SceneObject, offset: number): void {
    const buf = this.stagingData;
    const uint32View = new Uint32Array(buf.buffer);

    // === Transform section ===
    
    // Position (vec3)
    buf[offset + 0] = obj.transform.position[0];
    buf[offset + 1] = obj.transform.position[1];
    buf[offset + 2] = obj.transform.position[2];

    // Object type (u32): 0 = sphere, 1 = cuboid
    uint32View[offset + 3] = obj.type === 'sphere' ? 0 : 1;

    // Scale (vec3)
    buf[offset + 4] = obj.transform.scale[0];
    buf[offset + 5] = obj.transform.scale[1];
    buf[offset + 6] = obj.transform.scale[2];

    // Padding
    buf[offset + 7] = 0;

    // Rotation (vec3) - Euler angles
    buf[offset + 8] = obj.transform.rotation[0];
    buf[offset + 9] = obj.transform.rotation[1];
    buf[offset + 10] = obj.transform.rotation[2];

    // Padding (to reach 64 bytes for transform)
    buf[offset + 11] = 0;
    buf[offset + 12] = 0;
    buf[offset + 13] = 0;
    buf[offset + 14] = 0;
    buf[offset + 15] = 0;

    // === Material section (starts at offset + 16) ===
    const matOffset = offset + 16;

    // Color (vec3)
    buf[matOffset + 0] = obj.material.color[0];
    buf[matOffset + 1] = obj.material.color[1];
    buf[matOffset + 2] = obj.material.color[2];

    // Material type (u32): 0=plastic, 1=metal, 2=glass, 3=light
    uint32View[matOffset + 3] = MATERIAL_TYPE_MAP[obj.material.type];

    // IOR (Index of Refraction) - used by glass
    buf[matOffset + 4] = obj.material.ior;

    // Intensity - used by light
    buf[matOffset + 5] = obj.material.intensity;

    // Padding (to reach 64 bytes for material)
    buf[matOffset + 6] = 0;
    buf[matOffset + 7] = 0;
    buf[matOffset + 8] = 0;
    buf[matOffset + 9] = 0;
    buf[matOffset + 10] = 0;
    buf[matOffset + 11] = 0;
    buf[matOffset + 12] = 0;
    buf[matOffset + 13] = 0;
    buf[matOffset + 14] = 0;
    buf[matOffset + 15] = 0;
  }

  /**
   * Get the GPU buffer for binding
   */
  getBuffer(): GPUBuffer {
    return this.buffer;
  }

  /**
   * Clean up GPU resources
   */
  destroy(): void {
    this.buffer.destroy();
  }
}

// Export constants for testing
export { OBJECT_SIZE_BYTES, MAX_OBJECTS, HEADER_SIZE_BYTES, MATERIAL_TYPE_MAP };
