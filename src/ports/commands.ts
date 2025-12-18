export type ObjectId = string;

export type Vec3 = [number, number, number];

export type PrimitiveType = 'sphere' | 'cuboid';

export type MaterialType = 'plastic' | 'metal' | 'glass' | 'light';

export type TransformPatch = {
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
};

export type MaterialPatch = {
  type?: MaterialType;
  color?: Vec3;
  ior?: number;
  intensity?: number;
};

export type BackgroundPreset = 'day' | 'dusk' | 'night';

/**
 * v2 write contract: Commands represent user intent (NOT low-level input events).
 *
 * Notes:
 * - Must stay stable and serializable (for logging / tests / future persistence).
 * - Versioned via `v` so we can evolve commands safely in later milestones.
 */
export type Command =
  | { v: 1; type: 'selection.set'; objectId: ObjectId | null }
  | { v: 1; type: 'object.add'; primitive: PrimitiveType }
  | { v: 1; type: 'object.remove'; objectId: ObjectId }
  | { v: 1; type: 'object.duplicate'; objectId: ObjectId }
  | { v: 1; type: 'object.rename'; objectId: ObjectId; name: string }
  | { v: 1; type: 'object.visibility.set'; objectId: ObjectId; visible: boolean }
  | { v: 1; type: 'transform.update'; objectId: ObjectId; transform: TransformPatch }
  | { v: 1; type: 'material.update'; objectId: ObjectId; material: MaterialPatch }
  | { v: 1; type: 'environment.background.set'; color: Vec3 }
  | { v: 1; type: 'environment.background.preset'; preset: BackgroundPreset }
  | { v: 1; type: 'history.undo' }
  | { v: 1; type: 'history.redo' };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isVec3(v: unknown): v is Vec3 {
  return (
    Array.isArray(v) &&
    v.length === 3 &&
    typeof v[0] === 'number' &&
    typeof v[1] === 'number' &&
    typeof v[2] === 'number'
  );
}

/**
 * Runtime decoder for commands (safe rejection of unknown/invalid inputs).
 * Returns null instead of throwing.
 */
export function parseCommand(input: unknown): Command | null {
  if (!isRecord(input)) return null;
  if (input.v !== 1) return null;
  if (typeof input.type !== 'string') return null;

  const type = input.type;

  switch (type) {
    case 'selection.set': {
      const objectId = input.objectId;
      if (objectId !== null && typeof objectId !== 'string') return null;
      return { v: 1, type, objectId };
    }
    case 'object.add': {
      const primitive = input.primitive;
      if (primitive !== 'sphere' && primitive !== 'cuboid') return null;
      return { v: 1, type, primitive };
    }
    case 'object.remove':
    case 'object.duplicate': {
      const objectId = input.objectId;
      if (typeof objectId !== 'string') return null;
      return { v: 1, type, objectId } as Command;
    }
    case 'object.rename': {
      const objectId = input.objectId;
      const name = input.name;
      if (typeof objectId !== 'string') return null;
      if (typeof name !== 'string') return null;
      return { v: 1, type, objectId, name };
    }
    case 'object.visibility.set': {
      const objectId = input.objectId;
      const visible = input.visible;
      if (typeof objectId !== 'string') return null;
      if (typeof visible !== 'boolean') return null;
      return { v: 1, type, objectId, visible };
    }
    case 'transform.update': {
      const objectId = input.objectId;
      const transform = input.transform;
      if (typeof objectId !== 'string') return null;
      if (!isRecord(transform)) return null;
      const patch: TransformPatch = {};
      if ('position' in transform) {
        if (!isVec3(transform.position)) return null;
        patch.position = transform.position;
      }
      if ('rotation' in transform) {
        if (!isVec3(transform.rotation)) return null;
        patch.rotation = transform.rotation;
      }
      if ('scale' in transform) {
        if (!isVec3(transform.scale)) return null;
        patch.scale = transform.scale;
      }
      return { v: 1, type, objectId, transform: patch };
    }
    case 'material.update': {
      const objectId = input.objectId;
      const material = input.material;
      if (typeof objectId !== 'string') return null;
      if (!isRecord(material)) return null;
      const patch: MaterialPatch = {};
      if ('type' in material) {
        const mt = material.type;
        if (mt !== 'plastic' && mt !== 'metal' && mt !== 'glass' && mt !== 'light') return null;
        patch.type = mt;
      }
      if ('color' in material) {
        if (!isVec3(material.color)) return null;
        patch.color = material.color;
      }
      if ('ior' in material) {
        if (typeof material.ior !== 'number') return null;
        patch.ior = material.ior;
      }
      if ('intensity' in material) {
        if (typeof material.intensity !== 'number') return null;
        patch.intensity = material.intensity;
      }
      return { v: 1, type, objectId, material: patch };
    }
    case 'environment.background.set': {
      const color = input.color;
      if (!isVec3(color)) return null;
      return { v: 1, type, color };
    }
    case 'environment.background.preset': {
      const preset = input.preset;
      if (preset !== 'day' && preset !== 'dusk' && preset !== 'night') return null;
      return { v: 1, type, preset };
    }
    case 'history.undo':
    case 'history.redo': {
      return { v: 1, type } as Command;
    }
    default:
      return null;
  }
}

export function isCommand(input: unknown): input is Command {
  return parseCommand(input) !== null;
}


