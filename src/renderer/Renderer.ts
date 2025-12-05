import { WebGPUContext } from './webgpu';
import { RaytracingPipeline } from './RaytracingPipeline';
import { BlitPipeline } from './BlitPipeline';
import { Camera } from '../core/Camera';

export interface RendererStats {
  fps: number;
  frameTime: number;
  frameCount: number;
}

export class Renderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;

  private raytracingPipeline: RaytracingPipeline;
  private blitPipeline: BlitPipeline;
  private camera: Camera;

  private width: number = 0;
  private height: number = 0;

  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;

  constructor(ctx: WebGPUContext) {
    this.device = ctx.device;
    this.context = ctx.context;
    this.format = ctx.format;

    // Initialize camera
    this.camera = new Camera();

    // Initialize pipelines
    this.raytracingPipeline = new RaytracingPipeline(this.device);
    this.blitPipeline = new BlitPipeline(this.device, this.format);
  }

  /**
   * Update render dimensions (call when canvas resizes)
   */
  resize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    if (width <= 0 || height <= 0) return;

    this.width = width;
    this.height = height;

    // Update camera aspect ratio
    this.camera.setAspect(width / height);

    // Resize raytracing output
    this.raytracingPipeline.resizeOutput(width, height);
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this.animationFrameId !== null) return;

    this.lastFrameTime = performance.now();
    this.fpsUpdateTime = this.lastFrameTime;
    this.render();
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get the camera for external manipulation
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * Get current renderer statistics
   */
  getStats(): RendererStats {
    return {
      fps: this.fps,
      frameTime: performance.now() - this.lastFrameTime,
      frameCount: this.frameCount,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.raytracingPipeline.destroy();
    this.blitPipeline.destroy();
  }

  private render = (): void => {
    const now = performance.now();

    // Update FPS counter
    this.frameCount++;
    if (now - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
    this.lastFrameTime = now;

    // Skip render if not sized yet
    if (this.width === 0 || this.height === 0) {
      this.animationFrameId = requestAnimationFrame(this.render);
      return;
    }

    // Update camera uniform buffer
    this.raytracingPipeline.updateCamera(this.camera);

    // Create command encoder
    const commandEncoder = this.device.createCommandEncoder();

    // 1. Run raytracing compute pass
    this.raytracingPipeline.dispatch(commandEncoder);

    // 2. Blit result to screen
    const targetView = this.context.getCurrentTexture().createView();
    const sourceView = this.raytracingPipeline.getOutputTextureView();

    if (sourceView) {
      this.blitPipeline.render(commandEncoder, targetView, sourceView);
    }

    // Submit commands
    this.device.queue.submit([commandEncoder.finish()]);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.render);
  };
}
