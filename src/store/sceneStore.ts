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
 * Create an attractive default scene showcasing all material types
 */
function createInitialScene(): SceneObject[] {
  return [
    // Ground plane - large flat cuboid
    {
      id: nanoid(),
      name: 'Ground',
      type: 'cuboid',
      transform: {
        position: [0, -1.5, 0],
        rotation: [0, 0, 0],
        scale: [8, 0.2, 8],
      },
      material: {
        type: 'plastic',
        color: [0.15, 0.15, 0.18],
        roughness: 0.8,
        metalness: 0,
        ior: 1.5,
        intensity: 1,
      },
      visible: true,
    },
    // Main light source - warm orange sphere above
    {
      id: nanoid(),
      name: 'Sun Light',
      type: 'sphere',
      transform: {
        position: [2, 4, -2],
        rotation: [0, 0, 0],
        scale: [0.8, 0.8, 0.8],
      },
      material: {
        type: 'light',
        color: [1.0, 0.9, 0.7],
        roughness: 0,
        metalness: 0,
        ior: 1.5,
        intensity: 12,
      },
      visible: true,
    },
    // Glass sphere - center-left, showcasing refraction
    {
      id: nanoid(),
      name: 'Crystal Ball',
      type: 'sphere',
      transform: {
        position: [-1.2, 0, 0.5],
        rotation: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
      },
      material: {
        type: 'glass',
        color: [0.95, 0.98, 1.0],
        roughness: 0,
        metalness: 0,
        ior: 1.52,
        intensity: 1,
      },
      visible: true,
    },
    // Gold metal sphere - center-right
    {
      id: nanoid(),
      name: 'Gold Sphere',
      type: 'sphere',
      transform: {
        position: [1.3, 0.2, 0],
        rotation: [0, 0, 0],
        scale: [1.2, 1.2, 1.2],
      },
      material: {
        type: 'metal',
        color: [1.0, 0.76, 0.33],
        roughness: 0,
        metalness: 1,
        ior: 1.5,
        intensity: 1,
      },
      visible: true,
    },
    // Small red plastic sphere
    {
      id: nanoid(),
      name: 'Red Marble',
      type: 'sphere',
      transform: {
        position: [0.3, -0.8, 1.5],
        rotation: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
      },
      material: {
        type: 'plastic',
        color: [0.9, 0.2, 0.25],
        roughness: 0.3,
        metalness: 0,
        ior: 1.5,
        intensity: 1,
      },
      visible: true,
    },
    // Small cyan plastic sphere
    {
      id: nanoid(),
      name: 'Cyan Marble',
      type: 'sphere',
      transform: {
        position: [-0.5, -0.9, 1.8],
        rotation: [0, 0, 0],
        scale: [0.4, 0.4, 0.4],
      },
      material: {
        type: 'plastic',
        color: [0.2, 0.8, 0.85],
        roughness: 0.2,
        metalness: 0,
        ior: 1.5,
        intensity: 1,
      },
      visible: true,
    },
    // Tall mirror cuboid - back left
    {
      id: nanoid(),
      name: 'Mirror Pillar',
      type: 'cuboid',
      transform: {
        position: [-2.5, 0.5, -1.5],
        rotation: [0, 0.3, 0],
        scale: [0.4, 2.5, 0.4],
      },
      material: {
        type: 'metal',
        color: [0.9, 0.9, 0.95],
        roughness: 0,
        metalness: 1,
        ior: 1.5,
        intensity: 1,
      },
      visible: true,
    },
    // Small accent light - adds color interest
    {
      id: nanoid(),
      name: 'Accent Light',
      type: 'sphere',
      transform: {
        position: [-3, 1, 2],
        rotation: [0, 0, 0],
        scale: [0.3, 0.3, 0.3],
      },
      material: {
        type: 'light',
        color: [0.4, 0.6, 1.0],
        roughness: 0,
        metalness: 0,
        ior: 1.5,
        intensity: 8,
      },
      visible: true,
    },
  ];
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

