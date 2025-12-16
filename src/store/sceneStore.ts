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
import { historyMiddleware, type WithHistory } from './historyMiddleware';
import { LIMITS } from '../utils/limits';

/**
 * Default landing scene: Cornell Box
 * - Classic lighting test scene (white box with red/green walls + ceiling light)
 * - Designed to immediately showcase: global illumination, soft shadows, glossy reflections, refraction
 * - Open front face (camera looks in from +Z)
 */
function createCornellBoxScene(): SceneObject[] {
  const objects: SceneObject[] = [];

  // Box dimensions (interior).
  // We place the box so the OPENING is centered at the origin (0,0,0),
  // i.e. front face lies on the Z=0 plane and the interior extends into -Z.
  const halfX = 3.0;
  const halfY = 1.5; // interior height = 3.0
  const halfZ = 3.0; // interior depth = 6.0 (from z=0 to z=-6)
  const wallT = 0.06; // wall half-thickness (actual thickness = 2*wallT)

  const white: [number, number, number] = [0.83, 0.83, 0.83];
  const red: [number, number, number] = [0.82, 0.18, 0.2];
  const green: [number, number, number] = [0.18, 0.78, 0.26];

  // Interior planes (useful for “flush” placement)
  const yFloor = -halfY;
  const yCeil = halfY;
  const zFront = 0;
  const zBack = -2 * halfZ;
  const zCenter = -halfZ;

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

  // Cornell box (open front at z=zFront). Walls overlap slightly to avoid visible seams.
  objects.push(
    // Floor slab: top surface aligns with y=yFloor
    mkWall('Cornell Floor', [0, yFloor - wallT, zCenter], [halfX + wallT, wallT, halfZ + wallT], white),
    // Back wall: front surface aligns with z=zBack
    mkWall('Cornell Back Wall', [0, 0, zBack - wallT], [halfX + wallT, halfY + wallT, wallT], white),
    // Side walls: inner surfaces align with x=±halfX
    mkWall('Cornell Left Wall', [-halfX - wallT, 0, zCenter], [wallT, halfY + wallT, halfZ + wallT], red),
    mkWall('Cornell Right Wall', [halfX + wallT, 0, zCenter], [wallT, halfY + wallT, halfZ + wallT], green)
  );

  // Ceiling “frame” with a cutout for the light panel, so the light is visible and not blocked by the ceiling slab.
  const outerX = halfX + wallT;
  const outerZ = halfZ + wallT;
  const zOuterFront = zFront + wallT; // slight overlap past the opening plane
  const zOuterBack = zBack - wallT;

  const lightHalfX = 1.05;
  const lightHalfZ = 0.85;
  const cutMargin = 0.06;
  const cutHalfX = lightHalfX + cutMargin;
  const cutHalfZ = lightHalfZ + cutMargin;

  const ceilingY = yCeil + wallT; // bottom face aligns with y=yCeil

  const ceilSideHalfX = (outerX - cutHalfX) * 0.5;
  const ceilSideCenterX = (outerX + cutHalfX) * 0.5;

  const ceilFrontHalfZ = (zOuterFront - (zCenter + cutHalfZ)) * 0.5;
  const ceilFrontCenterZ = (zOuterFront + (zCenter + cutHalfZ)) * 0.5;

  const ceilBackHalfZ = ((zCenter - cutHalfZ) - zOuterBack) * 0.5;
  const ceilBackCenterZ = (zOuterBack + (zCenter - cutHalfZ)) * 0.5;

  objects.push(
    mkWall('Cornell Ceiling', [ -ceilSideCenterX, ceilingY, zCenter], [ceilSideHalfX, wallT, outerZ], white),
    mkWall('Cornell Ceiling', [  ceilSideCenterX, ceilingY, zCenter], [ceilSideHalfX, wallT, outerZ], white),
    mkWall('Cornell Ceiling', [0, ceilingY, ceilFrontCenterZ], [cutHalfX, wallT, ceilFrontHalfZ], white),
    mkWall('Cornell Ceiling', [0, ceilingY, ceilBackCenterZ], [cutHalfX, wallT, ceilBackHalfZ], white)
  );

  // Ceiling light: thin emissive panel that sits “flush” with the interior ceiling plane,
  // overlapping slightly into the ceiling slab so it reads as part of the same plane.
  const lightT = 0.03; // half-thickness; must be < wallT
  objects.push({
    id: nanoid(),
    name: 'Ceiling Light',
    type: 'cuboid',
    transform: {
      // bottom face at y=yCeil, top face at y=yCeil + 2*lightT (inside the ceiling slab)
      position: [0.0, yCeil + lightT, zCenter],
      rotation: [0, 0, 0],
      scale: [lightHalfX, lightT, lightHalfZ],
    },
    material: {
      type: 'light',
      color: [1.0, 0.98, 0.95],
      ior: 1.5,
      intensity: 10,
    },
    visible: true,
  });

  // Classic Cornell boxes (renderer treats cuboid scale as half-extents)
  objects.push(
    {
      id: nanoid(),
      name: 'Tall Box',
      type: 'cuboid',
      transform: {
        position: [1.1, yFloor + 1.0, -4.4],
        rotation: [0, 0.35, 0],
        scale: [0.55, 1.0, 0.55],
      },
      material: { type: 'plastic', color: white, ior: 1.5, intensity: 5 },
      visible: true,
    },
    {
      id: nanoid(),
      name: 'Short Box',
      type: 'cuboid',
      transform: {
        position: [-0.9, yFloor + 0.6, -2.6],
        rotation: [0, -0.25, 0],
        scale: [0.65, 0.6, 0.65],
      },
      material: { type: 'plastic', color: white, ior: 1.5, intensity: 5 },
      visible: true,
    }
  );

  // Hero objects for extra raytracing "wow"
  objects.push(
    {
      id: nanoid(),
      name: 'Glass Sphere',
      type: 'sphere',
      transform: {
        position: [-1.6, yFloor + 0.55, -5.0],
        rotation: [0, 0, 0],
        scale: [0.55, 0.55, 0.55],
      },
      material: {
        type: 'glass',
        color: [0.95, 0.98, 1.0],
        ior: 1.52,
        intensity: 5,
      },
      visible: true,
    },
    {
      id: nanoid(),
      name: 'Chrome Sphere',
      type: 'sphere',
      transform: {
        position: [0.6, yFloor + 0.5, -2.0],
        rotation: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
      },
      material: {
        type: 'metal',
        color: [0.96, 0.97, 0.99],
        ior: 1.5,
        intensity: 5,
      },
      visible: true,
    }
  );

  return objects;
}

/**
 * Default landing scene: Cornell Box
 */
function createInitialScene(): SceneObject[] {
  return createCornellBoxScene();
}

/*
 * Legacy landing scene: "Gallery Study" (kept for reference)
function createInitialScene_GalleryStudy(): SceneObject[] {
  const objects: SceneObject[] = [];
  const rand = seededRandom(1337);

  const floorTopY = -1.0;

  // === Cuboids: gallery stage ===
  objects.push(
    {
      id: nanoid(),
      name: 'Gallery Floor',
      type: 'cuboid',
      transform: {
        position: [0, floorTopY - 0.08, 0],
        rotation: [0, 0, 0],
        // NOTE: renderer treats cuboid scale as half-extents
        scale: [10, 0.08, 10],
      },
      material: {
        type: 'plastic',
        color: [0.08, 0.09, 0.11],
        ior: 1.5,
        intensity: 5,
      },
      visible: true,
    },
    {
      id: nanoid(),
      name: 'Backdrop',
      type: 'cuboid',
      transform: {
        position: [0, 3.0, -8.0],
        rotation: [0, 0, 0],
        scale: [10, 5, 0.08],
      },
      material: {
        type: 'plastic',
        color: [0.92, 0.95, 1.0],
        ior: 1.5,
        intensity: 5,
      },
      visible: true,
    },
    {
      id: nanoid(),
      name: 'Plinth Left',
      type: 'cuboid',
      transform: {
        position: [-3.2, floorTopY + 0.55, -1.8],
        rotation: [0, 0.22, 0],
        scale: [1.35, 0.55, 1.35],
      },
      material: {
        type: 'plastic',
        color: [0.84, 0.84, 0.86],
        ior: 1.5,
        intensity: 5,
      },
      visible: true,
    },
    {
      id: nanoid(),
      name: 'Plinth Right',
      type: 'cuboid',
      transform: {
        position: [3.1, floorTopY + 0.8, -1.2],
        rotation: [0, -0.18, 0],
        scale: [1.1, 0.8, 1.1],
      },
      material: {
        type: 'plastic',
        color: [0.88, 0.88, 0.9],
        ior: 1.5,
        intensity: 5,
      },
      visible: true,
    }
  );

  // === Lights (emissive spheres) ===
  objects.push(
    {
      id: nanoid(),
      name: 'Key Light',
      type: 'sphere',
      transform: {
        position: [7.5, 7.0, -4.5],
        rotation: [0, 0, 0],
        scale: [1.8, 1.8, 1.8],
      },
      material: {
        type: 'light',
        color: [1.0, 0.98, 0.95],
        ior: 1.5,
        intensity: 14,
      },
      visible: true,
    },
    {
      id: nanoid(),
      name: 'Fill Light',
      type: 'sphere',
      transform: {
        position: [-8.5, 4.0, 2.5],
        rotation: [0, 0, 0],
        scale: [1.2, 1.2, 1.2],
      },
      material: {
        type: 'light',
        color: [0.75, 0.86, 1.0],
        ior: 1.5,
        intensity: 6,
      },
      visible: true,
    }
  );

  // === Hero spheres (placed explicitly) ===
  const heroSpheres: Array<{
    name: string;
    position: [number, number, number];
    radius: number;
    material: { type: MaterialType; color: [number, number, number]; ior?: number };
  }> = [
    {
      name: 'Chrome Hero',
      position: [0.0, floorTopY + 1.05, 0.35],
      radius: 1.05,
      material: { type: 'metal', color: [0.96, 0.97, 0.99] },
    },
    {
      name: 'Crystal Hero',
      position: [-3.2, (floorTopY + 0.55) + 0.55 + 0.82, -1.8],
      radius: 0.82,
      material: { type: 'glass', color: [0.97, 0.99, 1.0], ior: 1.52 },
    },
    {
      name: 'Gold Hero',
      position: [3.1, (floorTopY + 0.8) + 0.8 + 0.72, -1.2],
      radius: 0.72,
      material: { type: 'metal', color: [1.0, 0.78, 0.25] },
    },
  ];

  const placed: Array<{ position: [number, number, number]; radius: number }> = [];

  const addSphere = (name: string, pos: [number, number, number], r: number, mat: { type: MaterialType; color: [number, number, number]; ior?: number }) => {
    objects.push({
      id: nanoid(),
      name,
      type: 'sphere',
      transform: {
        position: pos,
        rotation: [0, 0, 0],
        scale: [r, r, r],
      },
      material: {
        type: mat.type,
        color: mat.color,
        ior: mat.type === 'glass' ? (mat.ior ?? 1.5) : 1.5,
        intensity: mat.type === 'light' ? 10 : 5,
      },
      visible: true,
    });
    placed.push({ position: pos, radius: r });
  };

  const distSq = (a: [number, number, number], b: [number, number, number]) => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return dx * dx + dy * dy + dz * dz;
  };

  const canPlace = (pos: [number, number, number], r: number) => {
    const pad = 0.04;
    for (const p of placed) {
      const rr = r + p.radius + pad;
      if (distSq(pos, p.position) < rr * rr) return false;
    }
    return true;
  };

  // Place heroes first (guaranteed non-overlapping by construction)
  for (const h of heroSpheres) {
    addSphere(h.name, h.position, h.radius, h.material);
  }

  // Curated color palette (high-contrast, “artwork” friendly)
  const palette: Array<[number, number, number]> = [
    [0.92, 0.28, 0.32], // red
    [0.25, 0.64, 0.96], // sky blue
    [0.20, 0.82, 0.55], // green
    [0.95, 0.78, 0.18], // yellow
    [0.66, 0.42, 0.92], // purple
    [0.95, 0.50, 0.20], // orange
    [0.35, 0.90, 0.90], // cyan
    [0.98, 0.98, 0.98], // near white
  ];

  const metalPalette: Array<[number, number, number]> = [
    [0.93, 0.94, 0.96], // silver
    [1.0, 0.78, 0.22],  // gold
    [0.95, 0.62, 0.45], // copper
    [0.78, 0.82, 0.98], // cool chrome
  ];

  // Additional spheres: a “composed spiral” on the floor, non-overlapping
  const extraCount = 18;
  const radii = [
    0.62, 0.56, 0.52, 0.48, 0.44, 0.40,
    0.36, 0.34, 0.32, 0.30, 0.28, 0.26,
    0.24, 0.22, 0.20, 0.18, 0.16, 0.14,
  ];

  const golden = 2.399963229728653; // golden angle
  const base = 0.55;

  for (let i = 0; i < extraCount; i++) {
    const r = radii[i];

    let placedOk = false;
    for (let attempt = 0; attempt < 500; attempt++) {
      // Spiral candidate with slight jitter
      const t = i + attempt * 0.12;
      const a = t * golden;
      const rad = base * Math.sqrt(t + 1) + (rand() - 0.5) * 0.25;
      const x = rad * Math.cos(a);
      const z = rad * Math.sin(a);

      // keep in front-ish of backdrop and near heroes
      const pos: [number, number, number] = [
        x * 1.25,
        floorTopY + r,
        z * 1.05 + 0.8,
      ];

      if (!canPlace(pos, r)) continue;

      // Choose material type deterministically but varied
      const mPick = rand();
      let matType: MaterialType = 'plastic';
      if (mPick < 0.22) matType = 'glass';
      else if (mPick < 0.45) matType = 'metal';

      let color: [number, number, number] = palette[i % palette.length];
      let ior = 1.5;

      if (matType === 'metal') {
        color = metalPalette[i % metalPalette.length];
      } else if (matType === 'glass') {
        // Slight tint, but mostly clear
        const hue = (i * 47) % 360;
        const rgb = hslToRgb(hue, 0.12, 0.96);
        color = rgb;
        ior = 1.45 + rand() * 0.12;
      }

      addSphere(`Orb ${String(i + 1).padStart(2, '0')}`, pos, r, {
        type: matType,
        color,
        ior,
      });
      placedOk = true;
      break;
    }

    if (!placedOk) {
      // If we ever fail (should be rare), stop adding more to avoid overlaps
      break;
    }
  }

  return objects;
}
*/

interface SceneState {
  objects: SceneObject[];
  selectedObjectId: ObjectId | null;
  backgroundColor: [number, number, number]; // RGB 0-1 (scene-wide)

  // Object management
  addSphere: () => ObjectId | null;
  addCuboid: () => ObjectId | null;
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

export const useSceneStore = create<WithHistory<SceneState>>()(
  historyMiddleware<SceneState>(
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
        // Clear scene objects and selection. History stacks are cleared by tests via setState.
        set({ objects: [], selectedObjectId: null });
      },
    }),
    { limit: 30 }
  )
);

