import { create } from 'zustand';
import {
  Vec3,
  Mat4,
  mat4LookAt,
  mat4Inverse,
  mat4Perspective,
  normalize,
  sub,
  cross,
} from '../core/math';

/**
 * Camera state store using orbit camera model
 * - Position is derived from target + spherical coordinates
 * - Orbit, pan, and zoom modify these parameters
 */

interface CameraState {
  // Position derived from orbit parameters
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fovY: number;

  // Orbit camera parameters
  distance: number;
  azimuth: number; // Horizontal angle (radians)
  elevation: number; // Vertical angle (radians)

  // Actions
  orbit: (deltaAzimuth: number, deltaElevation: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (delta: number) => void;
  focusOn: (point: Vec3, distance?: number) => void;
  reset: () => void;

  // Getters
  getViewMatrix: () => Mat4;
  getInverseViewMatrix: () => Mat4;
  getProjectionMatrix: (aspect: number) => Mat4;
  getInverseProjectionMatrix: (aspect: number) => Mat4;
}

// Default camera configuration
// For the Cornell Box landing scene, we want the initial view to be centered
// and looking straight into the box opening (front face centered at the origin).
const DEFAULT_DISTANCE = 5;
const DEFAULT_AZIMUTH = 0; // head-on along +Z -> -Z
const DEFAULT_ELEVATION = 0; // level (no tilt up/down)
const DEFAULT_TARGET: Vec3 = [0, 0, 0];
const DEFAULT_UP: Vec3 = [0, 1, 0];
const DEFAULT_FOV = Math.PI / 3; // 60 degrees

// Camera limits
const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 100;
const MIN_ELEVATION = -Math.PI / 2 + 0.1; // Prevent gimbal lock
const MAX_ELEVATION = Math.PI / 2 - 0.1;

/**
 * Calculate camera position from orbit parameters
 */
function calculatePosition(
  target: Vec3,
  distance: number,
  azimuth: number,
  elevation: number
): Vec3 {
  const x = target[0] + distance * Math.cos(elevation) * Math.sin(azimuth);
  const y = target[1] + distance * Math.sin(elevation);
  const z = target[2] + distance * Math.cos(elevation) * Math.cos(azimuth);
  return [x, y, z];
}

export const useCameraStore = create<CameraState>((set, get) => ({
  position: calculatePosition(
    DEFAULT_TARGET,
    DEFAULT_DISTANCE,
    DEFAULT_AZIMUTH,
    DEFAULT_ELEVATION
  ),
  target: [...DEFAULT_TARGET] as Vec3,
  up: [...DEFAULT_UP] as Vec3,
  fovY: DEFAULT_FOV,

  distance: DEFAULT_DISTANCE,
  azimuth: DEFAULT_AZIMUTH,
  elevation: DEFAULT_ELEVATION,

  orbit: (deltaAzimuth, deltaElevation) => {
    set((state) => {
      const newAzimuth = state.azimuth + deltaAzimuth;
      const newElevation = Math.max(
        MIN_ELEVATION,
        Math.min(MAX_ELEVATION, state.elevation + deltaElevation)
      );
      const newPosition = calculatePosition(
        state.target,
        state.distance,
        newAzimuth,
        newElevation
      );

      return {
        azimuth: newAzimuth,
        elevation: newElevation,
        position: newPosition,
      };
    });
  },

  pan: (deltaX, deltaY) => {
    set((state) => {
      // Calculate camera right and up vectors
      const forward = normalize(sub(state.target, state.position));
      const right = normalize(cross(forward, state.up));
      const up = normalize(cross(right, forward));

      // Scale pan by distance for consistent feel
      const scale = state.distance * 0.002;

      const panOffset: Vec3 = [
        (right[0] * -deltaX + up[0] * deltaY) * scale,
        (right[1] * -deltaX + up[1] * deltaY) * scale,
        (right[2] * -deltaX + up[2] * deltaY) * scale,
      ];

      const newTarget: Vec3 = [
        state.target[0] + panOffset[0],
        state.target[1] + panOffset[1],
        state.target[2] + panOffset[2],
      ];

      const newPosition = calculatePosition(
        newTarget,
        state.distance,
        state.azimuth,
        state.elevation
      );

      return {
        target: newTarget,
        position: newPosition,
      };
    });
  },

  zoom: (delta) => {
    set((state) => {
      const zoomFactor = 1 - delta * 0.001;
      const newDistance = Math.max(
        MIN_DISTANCE,
        Math.min(MAX_DISTANCE, state.distance * zoomFactor)
      );
      const newPosition = calculatePosition(
        state.target,
        newDistance,
        state.azimuth,
        state.elevation
      );

      return {
        distance: newDistance,
        position: newPosition,
      };
    });
  },

  focusOn: (point, distance) => {
    set((state) => {
      const newDistance = distance ?? state.distance;
      const newPosition = calculatePosition(
        point,
        newDistance,
        state.azimuth,
        state.elevation
      );

      return {
        target: [...point] as Vec3,
        distance: newDistance,
        position: newPosition,
      };
    });
  },

  reset: () => {
    set({
      target: [...DEFAULT_TARGET] as Vec3,
      distance: DEFAULT_DISTANCE,
      azimuth: DEFAULT_AZIMUTH,
      elevation: DEFAULT_ELEVATION,
      position: calculatePosition(
        DEFAULT_TARGET,
        DEFAULT_DISTANCE,
        DEFAULT_AZIMUTH,
        DEFAULT_ELEVATION
      ),
    });
  },

  getViewMatrix: () => {
    const state = get();
    return mat4LookAt(state.position, state.target, state.up);
  },

  getInverseViewMatrix: () => {
    const state = get();
    return mat4Inverse(mat4LookAt(state.position, state.target, state.up));
  },

  getProjectionMatrix: (aspect: number) => {
    const state = get();
    return mat4Perspective(state.fovY, aspect, 0.1, 1000);
  },

  getInverseProjectionMatrix: (aspect: number) => {
    const state = get();
    return mat4Inverse(mat4Perspective(state.fovY, aspect, 0.1, 1000));
  },
}));

