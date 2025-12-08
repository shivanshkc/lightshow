/**
 * Core type definitions for scene objects
 */

// Unique identifier for objects
export type ObjectId = string;

// Supported primitive types
export type PrimitiveType = 'sphere' | 'cuboid';

/**
 * Transform data for positioning objects in 3D space
 */
export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles in radians
  scale: [number, number, number];    // For cuboid: width, height, depth
                                      // For sphere: [radius, radius, radius] (uniform)
}

/**
 * Material properties for rendering
 */
export interface Material {
  color: [number, number, number];        // RGB, 0-1 range
  roughness: number;                      // 0 = mirror, 1 = diffuse
  metallic: number;                       // 0 = dielectric, 1 = metal
  transparency: number;                   // 0 = opaque, 1 = fully transparent
  ior: number;                            // Index of refraction (for glass)
  emission: number;                       // 0 = no emission, >0 = light source
  emissionColor: [number, number, number]; // RGB of emitted light
}

/**
 * Complete scene object definition
 */
export interface SceneObject {
  id: ObjectId;
  name: string;
  type: PrimitiveType;
  transform: Transform;
  material: Material;
  visible: boolean;
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a default transform (origin, no rotation, unit scale)
 */
export function createDefaultTransform(): Transform {
  return {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  };
}

/**
 * Create a default material (light gray, slightly rough)
 */
export function createDefaultMaterial(): Material {
  return {
    color: [0.8, 0.8, 0.8],
    roughness: 0.5,
    metallic: 0,
    transparency: 0,
    ior: 1.5,
    emission: 0,
    emissionColor: [1, 1, 1],
  };
}

/**
 * Create a default sphere object (without id)
 */
export function createDefaultSphere(): Omit<SceneObject, 'id'> {
  return {
    name: 'Sphere',
    type: 'sphere',
    transform: createDefaultTransform(),
    material: createDefaultMaterial(),
    visible: true,
  };
}

/**
 * Create a default cuboid object (without id)
 */
export function createDefaultCuboid(): Omit<SceneObject, 'id'> {
  return {
    name: 'Cuboid',
    type: 'cuboid',
    transform: createDefaultTransform(),
    material: createDefaultMaterial(),
    visible: true,
  };
}

// ============================================
// Render Settings
// ============================================

/**
 * Settings for path tracing renderer
 */
export interface RenderSettings {
  frameIndex: number;       // Increments each frame (reset on scene change)
  samplesPerPixel: number;  // Samples per frame (usually 1 for interactive)
  maxBounces: number;       // Maximum ray bounces
  accumulate: boolean;      // Whether to accumulate or reset
}

