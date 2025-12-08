import {
  Vec3,
  Mat4,
  mat4LookAt,
  mat4Perspective,
  mat4Inverse,
} from './math';

/**
 * Camera class for generating view/projection matrices
 * Used for ray generation in the raytracer
 */
export class Camera {
  position: Vec3 = [0, 2, 5];
  target: Vec3 = [0, 0, 0];
  up: Vec3 = [0, 1, 0];
  fovY: number = Math.PI / 3; // 60 degrees
  aspect: number = 1;

  /**
   * Set the aspect ratio (width / height)
   */
  setAspect(aspect: number): void {
    this.aspect = aspect;
  }

  /**
   * Set the camera position
   */
  setPosition(position: Vec3): void {
    this.position = position;
  }

  /**
   * Set the look-at target
   */
  setTarget(target: Vec3): void {
    this.target = target;
  }

  /**
   * Get the view matrix (world to camera space)
   */
  getViewMatrix(): Mat4 {
    return mat4LookAt(this.position, this.target, this.up);
  }

  /**
   * Get the projection matrix (camera to clip space)
   */
  getProjectionMatrix(): Mat4 {
    return mat4Perspective(this.fovY, this.aspect, 0.1, 1000);
  }

  /**
   * Get the inverse view matrix (camera to world space)
   */
  getInverseViewMatrix(): Mat4 {
    return mat4Inverse(this.getViewMatrix());
  }

  /**
   * Get the inverse projection matrix (clip to camera space)
   */
  getInverseProjectionMatrix(): Mat4 {
    return mat4Inverse(this.getProjectionMatrix());
  }

  /**
   * Get uniform data for GPU upload
   * Layout (144 bytes total, aligned to 16):
   *   - inverseProjection: mat4x4<f32> (64 bytes, offset 0)
   *   - inverseView: mat4x4<f32> (64 bytes, offset 64)
   *   - position: vec3<f32> (12 bytes, offset 128)
   *   - _padding: f32 (4 bytes, offset 140)
   * 
   * Total: 36 floats = 144 bytes
   */
  getUniformData(): Float32Array {
    const data = new Float32Array(36);
    
    // Inverse projection matrix (16 floats)
    data.set(this.getInverseProjectionMatrix(), 0);
    
    // Inverse view matrix (16 floats)
    data.set(this.getInverseViewMatrix(), 16);
    
    // Camera position (3 floats + 1 padding)
    data.set(this.position, 32);
    // data[35] is padding, already 0
    
    return data;
  }
}

