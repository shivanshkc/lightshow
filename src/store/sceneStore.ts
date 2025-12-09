import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  SceneObject,
  ObjectId,
  Transform,
  Material,
  createDefaultSphere,
  createDefaultCuboid,
} from '../core/types';

/**
 * Seeded random number generator for reproducible scenes
 */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Convert HSL to RGB (h: 0-360, s: 0-1, l: 0-1)
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  return [r + m, g + m, b + m];
}

/**
 * Create a stunning "Sphere Cloud" scene - inspired by classic raytracing art
 * Procedurally generates a cloud of colorful spheres with varied materials
 */
function createInitialScene(): SceneObject[] {
  const objects: SceneObject[] = [];
  const random = seededRandom(42); // Fixed seed for reproducible scene
  
  // Configuration
  const sphereCount = 80;
  const cloudRadius = 4.5;
  const minSize = 0.15;
  const maxSize = 0.9;
  
  // Material distribution weights
  const materialTypes: Array<'plastic' | 'metal' | 'glass'> = ['plastic', 'metal', 'glass'];
  const materialWeights = [0.55, 0.25, 0.20]; // 55% plastic, 25% metal, 20% glass
  
  // Generate spheres in a cloud formation
  for (let i = 0; i < sphereCount; i++) {
    // Spherical distribution with bias toward center
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = cloudRadius * Math.pow(random(), 0.6); // Power < 1 = more density at center
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.6; // Flatten slightly
    const z = r * Math.cos(phi);
    
    // Size: mix of small and large, with more small ones
    const sizeRand = random();
    const size = minSize + (maxSize - minSize) * Math.pow(sizeRand, 1.5);
    
    // Select material type based on weights
    const materialRand = random();
    let materialType: 'plastic' | 'metal' | 'glass';
    if (materialRand < materialWeights[0]) {
      materialType = 'plastic';
    } else if (materialRand < materialWeights[0] + materialWeights[1]) {
      materialType = 'metal';
    } else {
      materialType = 'glass';
    }
    
    // Generate color based on material type
    let color: [number, number, number];
    
    if (materialType === 'plastic') {
      // Full spectrum, varied saturation and lightness
      const hue = random() * 360;
      const saturation = 0.4 + random() * 0.5; // 0.4-0.9
      const lightness = 0.35 + random() * 0.35; // 0.35-0.7
      color = hslToRgb(hue, saturation, lightness);
    } else if (materialType === 'metal') {
      // Metallic colors: silver, gold, copper, colored metals
      const metalRand = random();
      if (metalRand < 0.35) {
        // Silver/chrome
        const v = 0.85 + random() * 0.15;
        color = [v, v, v + random() * 0.05];
      } else if (metalRand < 0.55) {
        // Gold
        color = [1.0, 0.75 + random() * 0.1, 0.0 + random() * 0.2];
      } else if (metalRand < 0.70) {
        // Copper/rose gold
        color = [0.95, 0.5 + random() * 0.2, 0.4 + random() * 0.2];
      } else {
        // Colored metal (tinted chrome)
        const hue = random() * 360;
        const rgb = hslToRgb(hue, 0.6, 0.7);
        color = [rgb[0], rgb[1], rgb[2]];
      }
    } else {
      // Glass: mostly clear with slight tints
      const tintRand = random();
      if (tintRand < 0.6) {
        // Clear glass
        color = [0.98, 0.99, 1.0];
      } else {
        // Tinted glass
        const hue = random() * 360;
        const rgb = hslToRgb(hue, 0.15, 0.95);
        color = [rgb[0], rgb[1], rgb[2]];
      }
    }
    
    objects.push({
      id: nanoid(),
      name: `Sphere ${i + 1}`,
      type: 'sphere',
      transform: {
        position: [x, y, z],
        rotation: [0, 0, 0],
        scale: [size, size, size],
      },
      material: {
        type: materialType,
        color,
        roughness: materialType === 'plastic' ? 0.05 + random() * 0.1 : 0,
        metalness: materialType === 'metal' ? 1 : 0,
        ior: materialType === 'glass' ? 1.45 + random() * 0.15 : 1.5,
        intensity: 1,
      },
      visible: true,
    });
  }
  
  // Add key light - bright, warm white from upper right
  objects.push({
    id: nanoid(),
    name: 'Key Light',
    type: 'sphere',
    transform: {
      position: [8, 10, -6],
      rotation: [0, 0, 0],
      scale: [2, 2, 2],
    },
    material: {
      type: 'light',
      color: [1.0, 0.98, 0.95],
      roughness: 0,
      metalness: 0,
      ior: 1.5,
      intensity: 18,
    },
    visible: true,
  });
  
  // Add fill light - cooler, softer from left
  objects.push({
    id: nanoid(),
    name: 'Fill Light',
    type: 'sphere',
    transform: {
      position: [-10, 5, 4],
      rotation: [0, 0, 0],
      scale: [1.5, 1.5, 1.5],
    },
    material: {
      type: 'light',
      color: [0.8, 0.9, 1.0],
      roughness: 0,
      metalness: 0,
      ior: 1.5,
      intensity: 8,
    },
    visible: true,
  });
  
  return objects;
}

interface SceneState {
  objects: SceneObject[];
  selectedObjectId: ObjectId | null;

  // Object management
  addSphere: () => ObjectId;
  addCuboid: () => ObjectId;
  removeObject: (id: ObjectId) => void;
  duplicateObject: (id: ObjectId) => ObjectId | null;

  // Selection
  selectObject: (id: ObjectId | null) => void;
  getSelectedObject: () => SceneObject | null;

  // Updates
  updateObject: (id: ObjectId, updates: Partial<SceneObject>) => void;
  updateTransform: (id: ObjectId, transform: Partial<Transform>) => void;
  updateMaterial: (id: ObjectId, material: Partial<Material>) => void;

  // Utilities
  getObject: (id: ObjectId) => SceneObject | undefined;
  clear: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: createInitialScene(),
  selectedObjectId: null,

  addSphere: () => {
    const id = nanoid();
    const count = get().objects.filter((o) => o.type === 'sphere').length + 1;
    const sphere: SceneObject = {
      id,
      ...createDefaultSphere(),
      name: `Sphere ${count}`,
    };
    set((state) => ({ objects: [...state.objects, sphere] }));
    return id;
  },

  addCuboid: () => {
    const id = nanoid();
    const count = get().objects.filter((o) => o.type === 'cuboid').length + 1;
    const cuboid: SceneObject = {
      id,
      ...createDefaultCuboid(),
      name: `Cuboid ${count}`,
    };
    set((state) => ({ objects: [...state.objects, cuboid] }));
    return id;
  },

  removeObject: (id) => {
    set((state) => ({
      objects: state.objects.filter((o) => o.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    }));
  },

  duplicateObject: (id) => {
    const obj = get().getObject(id);
    if (!obj) return null;

    const newId = nanoid();
    const duplicate: SceneObject = {
      ...structuredClone(obj),
      id: newId,
      name: `${obj.name} Copy`,
      transform: {
        ...obj.transform,
        position: [
          obj.transform.position[0] + 1,
          obj.transform.position[1],
          obj.transform.position[2],
        ],
      },
    };
    set((state) => ({ objects: [...state.objects, duplicate] }));
    return newId;
  },

  selectObject: (id) => {
    set({ selectedObjectId: id });
  },

  getSelectedObject: () => {
    const { objects, selectedObjectId } = get();
    return objects.find((o) => o.id === selectedObjectId) ?? null;
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  },

  updateTransform: (id, transform) => {
    set((state) => ({
      objects: state.objects.map((o) =>
        o.id === id ? { ...o, transform: { ...o.transform, ...transform } } : o
      ),
    }));
  },

  updateMaterial: (id, material) => {
    set((state) => ({
      objects: state.objects.map((o) =>
        o.id === id ? { ...o, material: { ...o.material, ...material } } : o
      ),
    }));
  },

  getObject: (id) => {
    return get().objects.find((o) => o.id === id);
  },

  clear: () => {
    set({ objects: [], selectedObjectId: null });
  },
}));

