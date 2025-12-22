/**
 * Core type definitions for scene objects
 */

// Unique identifier for objects
export type ObjectId = string;

// Supported primitive types
export type PrimitiveType = 'sphere' | 'cuboid' | 'cylinder' | 'cone' | 'torus' | 'capsule';

// Material type enum
export type MaterialType = 'plastic' | 'metal' | 'glass' | 'light';

/**
 * Transform data for positioning objects in 3D space
 */
export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles in radians
  scale: [number, number, number]; // Encodes primitive parameters. See PRPs for conventions.
}

/**
 * Material properties for rendering
 * - plastic: Lambertian diffuse surface
 * - metal: Perfect mirror reflection, color tints reflection
 * - glass: Transparent with refraction, Fresnel effect
 * - light: Emissive surface that illuminates scene
 */
export interface Material {
  type: MaterialType;
  color: [number, number, number];  // RGB 0-1
  ior: number;                      // Glass only: Index of refraction (1.0-2.5)
  intensity: number;                // Light only: Emission intensity (0.1-20)
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
 * Create a default material (plastic, light gray)
 */
export function createDefaultMaterial(): Material {
  return {
    type: 'plastic',
    color: [0.8, 0.8, 0.8],
    ior: 1.5,
    intensity: 5.0,
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

/**
 * Create a default cylinder object (without id)
 * Parameter encoding (per PRP v3.2): scale = [radius, halfHeight, radius]
 * Default: radius=1, height=2 => halfHeight=1 => [1, 1, 1]
 */
export function createDefaultCylinder(): Omit<SceneObject, 'id'> {
  return {
    name: 'Cylinder',
    type: 'cylinder',
    transform: { ...createDefaultTransform(), scale: [1, 1, 1] },
    material: createDefaultMaterial(),
    visible: true,
  };
}

/**
 * Create a default cone object (without id)
 * Parameter encoding (per PRP v3.2): scale = [baseRadius, halfHeight, baseRadius]
 * Default: radius=1, height=2 => halfHeight=1 => [1, 1, 1]
 */
export function createDefaultCone(): Omit<SceneObject, 'id'> {
  return {
    name: 'Cone',
    type: 'cone',
    transform: { ...createDefaultTransform(), scale: [1, 1, 1] },
    material: createDefaultMaterial(),
    visible: true,
  };
}

/**
 * Create a default torus object (without id)
 * Parameter encoding (per PRP v3.2): scale = [R, r, r]
 * Default: inner=0.5, outer=1 => R=0.75, r=0.25 => [0.75, 0.25, 0.25]
 */
export function createDefaultTorus(): Omit<SceneObject, 'id'> {
  return {
    name: 'Torus',
    type: 'torus',
    transform: { ...createDefaultTransform(), scale: [0.75, 0.25, 0.25] },
    material: createDefaultMaterial(),
    visible: true,
  };
}

/**
 * Create a default capsule object (without id)
 * Parameter encoding (per PRP v3.2): scale = [radius, halfHeightTotal, radius]
 * Default: radius=0.5, height=2 => halfHeightTotal=1 => [0.5, 1, 0.5]
 */
export function createDefaultCapsule(): Omit<SceneObject, 'id'> {
  return {
    name: 'Capsule',
    type: 'capsule',
    transform: { ...createDefaultTransform(), scale: [0.5, 1, 0.5] },
    material: createDefaultMaterial(),
    visible: true,
  };
}

// ============================================
// Material Types and Presets
// ============================================

/**
 * Material type options for UI dropdowns
 */
export const MATERIAL_TYPES: { value: MaterialType; label: string }[] = [
  { value: 'plastic', label: 'Plastic' },
  { value: 'metal', label: 'Metal' },
  { value: 'glass', label: 'Glass' },
  { value: 'light', label: 'Light' },
];
