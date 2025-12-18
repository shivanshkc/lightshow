import type { ObjectId } from './commands';
import type { MaterialType, Vec3 } from './commands';

export type SceneObjectSnapshot = {
  id: ObjectId;
  name: string;
  type: 'sphere' | 'cuboid';
  visible: boolean;
  transform: {
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
  };
  material: {
    type: MaterialType;
    color: Vec3;
    ior: number;
    intensity: number;
  };
};

export type SceneSnapshot = {
  objects: readonly SceneObjectSnapshot[];
  selectedObjectId: ObjectId | null;
  backgroundColor: Vec3;
};

/**
 * v2 read contract: coarse-grained, allocation-light queries.
 *
 * NOTE: This is a contract only. The kernel will implement this in Milestones 03+.
 */
export interface KernelQueries {
  /** Scene state needed by UI + renderer. */
  getSceneSnapshot(): SceneSnapshot;
}


