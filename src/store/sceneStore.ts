import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  SceneObject,
  ObjectId,
  Transform,
  Material,
  createDefaultSphere,
  createDefaultCuboid,
  cloneSceneObject,
} from '../core/types';

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
  objects: [],
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
      ...cloneSceneObject(obj),
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

