import { SceneObject } from './types';
import {
  Ray,
  Vec3,
  Mat4,
  screenToWorldRay,
  intersectRaySphere,
  intersectRayBox,
  intersectRayCylinderCapped,
  intersectRayConeCapped,
  intersectRayCapsule,
  mat3FromRotation,
  mat3Transpose,
  mat3MultiplyVec3,
  sub,
} from './math';

export interface PickResult {
  objectId: string | null;
  point: Vec3 | null;
  distance: number;
}

/**
 * Raycaster for CPU-side object picking
 * Casts rays from screen coordinates and tests against scene objects
 */
export class Raycaster {
  /**
   * Pick object at screen coordinates
   */
  pick(
    screenX: number,
    screenY: number,
    canvasWidth: number,
    canvasHeight: number,
    cameraPosition: Vec3,
    inverseProjection: Mat4,
    inverseView: Mat4,
    objects: SceneObject[]
  ): PickResult {
    const ray = screenToWorldRay(
      screenX,
      screenY,
      canvasWidth,
      canvasHeight,
      inverseProjection,
      inverseView,
      cameraPosition
    );

    return this.pickWithRay(ray, objects);
  }

  /**
   * Pick object with a ray
   */
  pickWithRay(ray: Ray, objects: SceneObject[]): PickResult {
    let closestHit: PickResult = {
      objectId: null,
      point: null,
      distance: Infinity,
    };

    for (const obj of objects) {
      if (!obj.visible) continue;

      // Transform ray to object's local space
      const localRay = this.transformRayToObjectSpace(ray, obj);

      let result: { hit: boolean; t: number };

      switch (obj.type) {
        case 'sphere': {
          // For sphere, scale.x is radius
          result = intersectRaySphere(localRay, [0, 0, 0], obj.transform.scale[0]);
          break;
        }
        case 'cuboid': {
          // For cuboid, scale is half-extents
          result = intersectRayBox(localRay, [0, 0, 0], obj.transform.scale);
          break;
        }
        case 'cylinder': {
          result = intersectRayCylinderCapped(localRay, obj.transform.scale[0], obj.transform.scale[1]);
          break;
        }
        case 'cone': {
          result = intersectRayConeCapped(localRay, obj.transform.scale[0], obj.transform.scale[1]);
          break;
        }
        case 'capsule': {
          result = intersectRayCapsule(localRay, obj.transform.scale[0], obj.transform.scale[1]);
          break;
        }
        case 'torus': {
          // CPU torus intersection is introduced in Step 04 (quartic).
          result = { hit: false, t: Infinity };
          break;
        }
      }

      if (result.hit && result.t < closestHit.distance) {
        const point: Vec3 = [
          ray.origin[0] + ray.direction[0] * result.t,
          ray.origin[1] + ray.direction[1] * result.t,
          ray.origin[2] + ray.direction[2] * result.t,
        ];

        closestHit = {
          objectId: obj.id,
          point,
          distance: result.t,
        };
      }
    }

    return closestHit;
  }

  /**
   * Transform a ray from world space to object's local space
   */
  private transformRayToObjectSpace(ray: Ray, obj: SceneObject): Ray {
    // Create inverse rotation matrix
    const rotMat = mat3FromRotation(obj.transform.rotation);
    const invRotMat = mat3Transpose(rotMat);

    // Transform origin (translate then rotate)
    const translatedOrigin = sub(ray.origin, obj.transform.position);
    const localOrigin = mat3MultiplyVec3(invRotMat, translatedOrigin);

    // Transform direction (rotate only)
    const localDirection = mat3MultiplyVec3(invRotMat, ray.direction);

    return {
      origin: localOrigin,
      direction: localDirection,
    };
  }
}

// Singleton instance
export const raycaster = new Raycaster();

