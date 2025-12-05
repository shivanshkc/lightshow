import {
  Vec3,
  Mat4,
  mat4LookAt,
  mat4Perspective,
  mat4Inverse,
} from './math';

export interface CameraState {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fovY: number;
  aspect: number;
  near: number;
  far: number;
}

/**
 * Camera class for generating view/projection matrices
 * 
 * Uniform buffer layout (must match WGSL):
 * struct CameraUniforms {
 *   inverseProjection: mat4x4<f32>,  // bytes 0-63
 *   inverseView: mat4x4<f32>,        // bytes 64-127
 *   position: vec3<f32>,             // bytes 128-139
 *   _padding: f32,                   // bytes 140-143
 * }
 * Total: 144 bytes (36 floats)
 */
export class Camera {
  position: Vec3 = [0, 2, 5];
  target: Vec3 = [0, 0, 0];
  up: Vec3 = [0, 1, 0];
  fovY: number = Math.PI / 3; // 60 degrees
  aspect: number = 1;
  near: number = 0.1;
  far: number = 1000;

  constructor(state?: Partial<CameraState>) {
    if (state) {
      if (state.position) this.position = [...state.position];
      if (state.target) this.target = [...state.target];
      if (state.up) this.up = [...state.up];
      if (state.fovY !== undefined) this.fovY = state.fovY;
      if (state.aspect !== undefined) this.aspect = state.aspect;
      if (state.near !== undefined) this.near = state.near;
      if (state.far !== undefined) this.far = state.far;
    }
  }

  getPosition(): Vec3 {
    return [...this.position];
  }

  getTarget(): Vec3 {
    return [...this.target];
  }

  getFovY(): number {
    return this.fovY;
  }

  setPosition(pos: Vec3): void {
    this.position = [...pos];
  }

  setTarget(target: Vec3): void {
    this.target = [...target];
  }

  setAspect(aspect: number): void {
    this.aspect = aspect;
  }

  getViewMatrix(): Mat4 {
    return mat4LookAt(this.position, this.target, this.up);
  }

  getProjectionMatrix(): Mat4 {
    return mat4Perspective(this.fovY, this.aspect, this.near, this.far);
  }

  getInverseViewMatrix(): Mat4 {
    return mat4Inverse(this.getViewMatrix());
  }

  getInverseProjectionMatrix(): Mat4 {
    return mat4Inverse(this.getProjectionMatrix());
  }

  /**
   * Returns Float32Array for GPU uniform buffer
   * Layout: inverseProjection (16) + inverseView (16) + position (3) + padding (1) = 36 floats
   */
  getUniformData(): Float32Array {
    const data = new Float32Array(36);
    data.set(this.getInverseProjectionMatrix(), 0);
    data.set(this.getInverseViewMatrix(), 16);
    data.set(this.position, 32);
    // data[35] is padding (0)
    return data;
  }
}

