/**
 * Core type definitions for scene objects
 */

// Unique identifier for objects
export type ObjectId = string;

// Supported primitive types
export type PrimitiveType =
  | 'sphere'
  | 'cuboid'
  | 'cylinder'
  | 'cone'
  | 'capsule'
  | 'torus';

// Material type enum
export type MaterialType = 'plastic' | 'metal' | 'glass' | 'light';

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
 */
export function createDefaultCylinder(): Omit<SceneObject, 'id'> {
  return {
    name: 'Cylinder',
    type: 'cylinder',
    transform: createDefaultTransform(),
    material: createDefaultMaterial(),
    visible: true,
  };
}

/**
 * Create a default cone object (without id)
 */
export function createDefaultCone(): Omit<SceneObject, 'id'> {
  return {
    name: 'Cone',
    type: 'cone',
    transform: createDefaultTransform(),
    material: createDefaultMaterial(),
    visible: true,
  };
}

/**
 * Create a default capsule object (without id)
 */
export function createDefaultCapsule(): Omit<SceneObject, 'id'> {
  return {
    name: 'Capsule',
    type: 'capsule',
    transform: createDefaultTransform(),
    material: createDefaultMaterial(),
    visible: true,
  };
}

/**
 * Create a default torus object (without id)
 */
export function createDefaultTorus(): Omit<SceneObject, 'id'> {
  return {
    name: 'Torus',
    type: 'torus',
    transform: createDefaultTransform(),
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

/**
 * Preset materials for quick selection
 */
export const MATERIAL_PRESETS = {
  redPlastic: {
    type: 'plastic' as const,
    color: [0.8, 0.2, 0.2] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  bluePlastic: {
    type: 'plastic' as const,
    color: [0.2, 0.4, 0.8] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  gold: {
    type: 'metal' as const,
    color: [1.0, 0.84, 0.0] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  silver: {
    type: 'metal' as const,
    color: [0.95, 0.95, 0.95] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  copper: {
    type: 'metal' as const,
    color: [0.72, 0.45, 0.2] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  glass: {
    type: 'glass' as const,
    color: [1.0, 1.0, 1.0] as [number, number, number],
    ior: 1.5,
    intensity: 5.0,
  },
  diamond: {
    type: 'glass' as const,
    color: [1.0, 1.0, 1.0] as [number, number, number],
    ior: 2.4,
    intensity: 5.0,
  },
  warmLight: {
    type: 'light' as const,
    color: [1.0, 0.95, 0.8] as [number, number, number],
    ior: 1.5,
    intensity: 10.0,
  },
  coolLight: {
    type: 'light' as const,
    color: [0.8, 0.9, 1.0] as [number, number, number],
    ior: 1.5,
    intensity: 10.0,
  },
};

// ============================================
// Validation
// ============================================

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Validate and clamp material properties
 */
export function validateMaterial(mat: Partial<Material>): Material {
  const def = createDefaultMaterial();
  return {
    type: mat.type ?? def.type,
    color: mat.color ?? def.color,
    ior: clamp(mat.ior ?? def.ior, 1.0, 2.5),
    intensity: clamp(mat.intensity ?? def.intensity, 0.1, 20.0),
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
