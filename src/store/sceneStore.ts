import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  SceneObject,
  ObjectId,
  Transform,
  Material,
  createDefaultSphere,
  createDefaultCuboid,
  createDefaultCylinder,
  createDefaultCone,
  createDefaultTorus,
  createDefaultCapsule,
} from '../core/types';
import { LIMITS } from '../utils/limits';

/**
 * Default landing scene: Cornell Box
 * - Classic lighting test scene (white box with red/green walls + ceiling light)
 * - Designed to immediately showcase: global illumination, soft shadows, glossy reflections, refraction
 * - Open front face (camera looks in from +Z)
 */
function createCornellBoxScene(): SceneObject[] {
  const objects: SceneObject[] = [];

  const mkWall = (
    name: string,
    pos: [number, number, number],
    scale: [number, number, number],
    color: [number, number, number]
  ): SceneObject => ({
    id: nanoid(),
    name,
    type: 'cuboid',
    transform: { position: pos, rotation: [0, 0, 0], scale },
    material: { type: 'plastic', color, ior: 1.5, intensity: 5 },
    visible: true,
  });

  const toCol = (c: [number, number, number]): [number, number, number] => [c[0]/255, c[1]/255, c[2]/255];

  const white: [number, number, number] = toCol([212, 212, 212]);
  const red: [number, number, number] = toCol([209, 46, 51]);
  const green: [number, number, number] = toCol([46, 199, 66]);

  objects.push(
    mkWall('Cornell Floor', [0, -2.6, -5.0], [5.1, 0.1, 5.1], white),
    mkWall('Cornell Ceiling', [0, 2.6, -5.0], [5.1, 0.1, 5.1], white),
    mkWall('Cornell Back Wall', [0, 0, -10.1], [5.1, 2.6, 0.1], white),
    mkWall('Cornell Left Wall', [-5.1, 0, -5], [0.1, 2.6, 5.1], red),
    mkWall('Cornell Right Wall', [5.1, 0, -5], [0.1, 2.6, 5.1], green),
  );

  objects.push({
    id: nanoid(), name: 'Ceiling Light', type: 'cuboid',
    transform: { position: [0.0, 2.53, -5], rotation: [0, 0, 0], scale: [1.75, 0.05, 1.42] },
    material: { type: 'light', color: [1.0, 1.0, 1.0], ior: 1.5, intensity: 10 },
    visible: true,
  });

  const toRad = (deg: number) => deg * Math.PI / 180;

  objects.push({
    id: nanoid(), name: 'Cone', type: 'cone',
    transform: { position: [0.0, -2.04, -5.5], rotation: [0, 0, toRad(116.565)], scale: [1.0, 1.0, 1.0] },
    material: { type: 'metal', color: [1.0, 1.0, 1.0], ior: 1.5, intensity: 5 },
    visible: true,
  });

  objects.push({
    id: nanoid(), name: 'Cylinder', type: 'cylinder',
    transform: { position: [-2.3, -1.5, -4.0], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
    material: { type: 'glass', color: [1.0, 1.0, 1.0], ior: 1.5, intensity: 5 },
    visible: true,
  });

  objects.push({
    id: nanoid(), name: 'Sphere', type: 'sphere',
    transform: { position: [-2.3, 0.0, -4.0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5] },
    material: { type: 'glass', color: [1.0, 1.0, 1.0], ior: 1.5, intensity: 5 },
    visible: true,
  });

  objects.push({
    id: nanoid(), name: 'Capsule', type: 'capsule',
    transform: { position: [2.5, -2.2, -2.5], rotation: [toRad(25), 0, toRad(90)], scale: [0.3, 1, 0.3] },
    material: { type: 'metal', color: [1.0, 1.0, 1.0], ior: 1.5, intensity: 5 },
    visible: true,
  });

  objects.push({
    id: nanoid(), name: 'Cuboid', type: 'cuboid',
    transform: { position: [2.85, -1.0, -7.0], rotation: [0, toRad(-25), 0], scale: [0.8, 1.5, 0.8] },
    material: { type: 'plastic', color: [1.0, 1.0, 1.0], ior: 1.5, intensity: 5 },
    visible: true,
  });

  return objects;
}

/**
 * Default landing scene: Cornell Box
 */
function createInitialScene(): SceneObject[] {
  return createCornellBoxScene();
}


interface SceneState {
  objects: SceneObject[];
  selectedObjectId: ObjectId | null;
  backgroundColor: [number, number, number]; // RGB 0-1 (scene-wide)

  // Object management
  addSphere: () => ObjectId | null;
  addCuboid: () => ObjectId | null;
  addCylinder: () => ObjectId | null;
  addCone: () => ObjectId | null;
  addTorus: () => ObjectId | null;
  addCapsule: () => ObjectId | null;
  removeObject: (id: ObjectId) => void;
  duplicateObject: (id: ObjectId) => ObjectId | null;
  renameObject: (id: ObjectId, name: string) => void;
  toggleVisibility: (id: ObjectId) => void;

  // Selection
  selectObject: (id: ObjectId | null) => void;
  getSelectedObject: () => SceneObject | null;
  deleteSelected: () => void;
  duplicateSelected: () => ObjectId | null;

  // Updates
  updateObject: (id: ObjectId, updates: Partial<SceneObject>) => void;
  updateTransform: (id: ObjectId, transform: Partial<Transform>) => void;
  updateMaterial: (id: ObjectId, material: Partial<Material>) => void;

  // Utilities
  getObject: (id: ObjectId) => SceneObject | undefined;
  clear: () => void;

  // Environment (scene-wide)
  setBackgroundColor: (color: [number, number, number]) => void;
  applyBackgroundPreset: (preset: 'day' | 'dusk' | 'night') => void;
}

export const useSceneStore = create<SceneState>()(
  (set, get) => ({
      objects: createInitialScene(),
      selectedObjectId: null,
      // Default environment background: Night
      backgroundColor: [0.04, 0.05, 0.1],

      addSphere: () => {
        if (get().objects.length >= LIMITS.maxObjects) return null;
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
        if (get().objects.length >= LIMITS.maxObjects) return null;
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

      addCylinder: () => {
        if (get().objects.length >= LIMITS.maxObjects) return null;
        const id = nanoid();
        const count = get().objects.filter((o) => o.type === 'cylinder').length + 1;
        const cylinder: SceneObject = {
          id,
          ...createDefaultCylinder(),
          name: `Cylinder ${count}`,
        };
        set((state) => ({ objects: [...state.objects, cylinder] }));
        return id;
      },

      addCone: () => {
        if (get().objects.length >= LIMITS.maxObjects) return null;
        const id = nanoid();
        const count = get().objects.filter((o) => o.type === 'cone').length + 1;
        const cone: SceneObject = {
          id,
          ...createDefaultCone(),
          name: `Cone ${count}`,
        };
        set((state) => ({ objects: [...state.objects, cone] }));
        return id;
      },

      addTorus: () => {
        if (get().objects.length >= LIMITS.maxObjects) return null;
        const id = nanoid();
        const count = get().objects.filter((o) => o.type === 'torus').length + 1;
        const torus: SceneObject = {
          id,
          ...createDefaultTorus(),
          name: `Torus ${count}`,
        };
        set((state) => ({ objects: [...state.objects, torus] }));
        return id;
      },

      addCapsule: () => {
        if (get().objects.length >= LIMITS.maxObjects) return null;
        const id = nanoid();
        const count = get().objects.filter((o) => o.type === 'capsule').length + 1;
        const capsule: SceneObject = {
          id,
          ...createDefaultCapsule(),
          name: `Capsule ${count}`,
        };
        set((state) => ({ objects: [...state.objects, capsule] }));
        return id;
      },

      removeObject: (id) => {
        set((state) => ({
          objects: state.objects.filter((o) => o.id !== id),
          selectedObjectId:
            state.selectedObjectId === id ? null : state.selectedObjectId,
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
              obj.transform.position[0] + 0.5,
              obj.transform.position[1],
              obj.transform.position[2] + 0.5,
            ],
          },
        };
        set((state) => ({
          objects: [...state.objects, duplicate],
          selectedObjectId: newId,
        }));
        return newId;
      },

      renameObject: (id, name) => {
        set((state) => ({
          objects: state.objects.map((o) => (o.id === id ? { ...o, name } : o)),
        }));
      },

      toggleVisibility: (id) => {
        set((state) => ({
          objects: state.objects.map((o) =>
            o.id === id ? { ...o, visible: !o.visible } : o
          ),
        }));
      },

      selectObject: (id) => {
        set({ selectedObjectId: id });
      },

      getSelectedObject: () => {
        const { objects, selectedObjectId } = get();
        return objects.find((o) => o.id === selectedObjectId) ?? null;
      },

      deleteSelected: () => {
        const id = get().selectedObjectId;
        if (id) get().removeObject(id);
      },

      duplicateSelected: () => {
        const id = get().selectedObjectId;
        if (id) return get().duplicateObject(id);
        return null;
      },

      updateObject: (id, updates) => {
        set((state) => ({
          objects: state.objects.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        }));
      },

      updateTransform: (id, transform) => {
        set((state) => ({
          objects: state.objects.map((o) =>
            o.id === id
              ? { ...o, transform: { ...o.transform, ...transform } }
              : o
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

      setBackgroundColor: (color) => {
        set({ backgroundColor: color });
      },

      applyBackgroundPreset: (preset) => {
        const presets: Record<'day' | 'dusk' | 'night', [number, number, number]> = {
          day: [0.5, 0.7, 1.0],
          dusk: [0.18, 0.22, 0.35],
          night: [0.04, 0.05, 0.1],
        };
        set({ backgroundColor: presets[preset] });
      },

      clear: () => {
        // Clear scene objects and selection.
        set({ objects: [], selectedObjectId: null });
      },
    })
);

