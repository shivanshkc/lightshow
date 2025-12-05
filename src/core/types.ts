/**
 * Core type definitions for scene objects
 */

// Unique identifier for objects
export type ObjectId = string;

// Supported primitive types
export type PrimitiveType = 'sphere' | 'cuboid';

// Transform data
export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];  // Euler angles in radians
  scale: [number, number, number];     // For cuboid: width, height, depth
                                       // For sphere: [radius, radius, radius] (uniform)
}

// Material properties
export interface Material {
  color: [number, number, number];        // RGB, 0-1 range
  roughness: number;                       // 0 = mirror, 1 = diffuse
  metallic: number;                        // 0 = dielectric, 1 = metal
  transparency: number;                    // 0 = opaque, 1 = fully transparent
  ior: number;                             // Index of refraction (for transparency)
  emission: number;                        // 0 = no emission, >0 = light source
  emissionColor: [number, number, number]; // RGB of emitted light
}

// Complete scene object
export interface SceneObject {
  id: ObjectId;
  name: string;
  type: PrimitiveType;
  transform: Transform;
  material: Material;
  visible: boolean;
}

// ============================================
// Default value factories
// ============================================

export function createDefaultTransform(): Transform {
  return {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  };
}

export function createDefaultMaterial(): Material {
  return {
    color: [0.8, 0.8, 0.8],       // Light gray
    roughness: 0.5,               // Semi-glossy
    metallic: 0,                  // Dielectric
    transparency: 0,              // Opaque
    ior: 1.5,                     // Glass-like IOR
    emission: 0,                  // No emission
    emissionColor: [1, 1, 1],     // White emission color
  };
}

export function createDefaultSphere(): Omit<SceneObject, 'id'> {
  return {
    name: 'Sphere',
    type: 'sphere',
    transform: createDefaultTransform(),
    material: createDefaultMaterial(),
    visible: true,
  };
}

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
// Utility functions
// ============================================

export function cloneTransform(t: Transform): Transform {
  return {
    position: [...t.position] as [number, number, number],
    rotation: [...t.rotation] as [number, number, number],
    scale: [...t.scale] as [number, number, number],
  };
}

export function cloneMaterial(m: Material): Material {
  return {
    color: [...m.color] as [number, number, number],
    roughness: m.roughness,
    metallic: m.metallic,
    transparency: m.transparency,
    ior: m.ior,
    emission: m.emission,
    emissionColor: [...m.emissionColor] as [number, number, number],
  };
}

export function cloneSceneObject(obj: SceneObject): SceneObject {
  return {
    ...obj,
    transform: cloneTransform(obj.transform),
    material: cloneMaterial(obj.material),
  };
}

// ============================================
// Render Settings
// ============================================

export interface RenderSettings {
  frameIndex: number;
  samplesPerPixel: number;
  maxBounces: number;
  accumulate: boolean;
}

export function createDefaultRenderSettings(): RenderSettings {
  return {
    frameIndex: 0,
    samplesPerPixel: 1,
    maxBounces: 8,
    accumulate: true,
  };
}

