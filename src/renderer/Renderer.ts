import { WebGPUContext } from './webgpu';
import { Camera } from '../core/Camera';
import { RaytracingPipeline } from './RaytracingPipeline';
import { BlitPipeline } from './BlitPipeline';
import { GizmoRenderer } from '../gizmos/GizmoRenderer';
import { useSceneStore } from '../store/sceneStore';
import { useCameraStore } from '../store/cameraStore';
import { useGizmoStore, axisToId } from '../store/gizmoStore';
import { mat4Multiply, mat4Perspective } from '../core/math';

export interface RendererStats {
  fps: number;
  frameTime: number;
  frameCount: number;
  sampleCount: number;
}

export class Renderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;

  private raytracingPipeline: RaytracingPipeline;
  private blitPipeline: BlitPipeline;
  private gizmoRenderer: GizmoRenderer;
  private camera: Camera;

  private width: number = 0;
  private height: number = 0;

  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;

  private unsubscribeStore: (() => void) | null = null;
  private lastObjectsRef: unknown = null;

  constructor(ctx: WebGPUContext) {
    this.device = ctx.device;
    this.context = ctx.context;
    this.format = ctx.format;

    // Create camera
    this.camera = new Camera();

    // Create pipelines
    this.raytracingPipeline = new RaytracingPipeline(this.device);
    this.blitPipeline = new BlitPipeline(this.device, this.format);
    this.gizmoRenderer = new GizmoRenderer(this.device, this.format);

    // Subscribe to scene store changes
    this.unsubscribeStore = useSceneStore.subscribe((state) => {
      // Update scene data
      this.raytracingPipeline.updateScene(state.objects);
      
      // Reset accumulation if objects array reference changed (add/remove/modify)
      if (this.lastObjectsRef !== null && state.objects !== this.lastObjectsRef) {
        this.raytracingPipeline.resetAccumulation();
      }
      this.lastObjectsRef = state.objects;
    });

    // Initial scene sync
    const initialState = useSceneStore.getState();
    this.raytracingPipeline.updateScene(initialState.objects);
    this.lastObjectsRef = initialState.objects;
  }

  /**
   * Handle canvas resize
   */
  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    if (width === this.width && height === this.height) return;

    this.width = width;
    this.height = height;

    // Update camera aspect ratio
    this.camera.setAspect(width / height);

    // Resize raytracing output (this also resets accumulation)
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
   * Get current sample count (frame index)
   */
  getSampleCount(): number {
    return this.raytracingPipeline.getFrameIndex();
  }

  /**
   * Reset accumulation (e.g., when camera moves)
   */
  resetAccumulation(): void {
    this.raytracingPipeline.resetAccumulation();
  }

  /**
   * Get current renderer statistics
   */
  getStats(): RendererStats {
    return {
      fps: this.fps,
      frameTime: performance.now() - this.lastFrameTime,
      frameCount: this.frameCount,
      sampleCount: this.raytracingPipeline.getFrameIndex(),
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    
    // Unsubscribe from store
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }

    this.raytracingPipeline.destroy();
    this.blitPipeline.destroy();
    this.gizmoRenderer.destroy();
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

    // Skip if not properly sized
    if (this.width === 0 || this.height === 0) {
      this.animationFrameId = requestAnimationFrame(this.render);
      return;
    }

    // Sync camera from store
    const cameraState = useCameraStore.getState();
    this.camera.setPosition(cameraState.position);
    this.camera.setTarget(cameraState.target);

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

    // 3. Render gizmo if object is selected
    const sceneState = useSceneStore.getState();
    const gizmoState = useGizmoStore.getState();
    
    if (sceneState.selectedObjectId && gizmoState.mode !== 'none') {
      const selectedObject = sceneState.objects.find(
        (obj) => obj.id === sceneState.selectedObjectId
      );
      
      if (selectedObject) {
        // Calculate view-projection matrix
        const viewMatrix = this.camera.getViewMatrix();
        const projMatrix = mat4Perspective(
          cameraState.fovY,
          this.width / this.height,
          0.1,
          1000
        );
        const viewProjection = mat4Multiply(projMatrix, viewMatrix);
        
        // Get hovered and active axis IDs
        const hoveredAxis = axisToId(gizmoState.hoveredAxis);
        const activeAxis = axisToId(gizmoState.activeAxis);
        
        this.gizmoRenderer.render(
          commandEncoder,
          targetView,
          viewProjection,
          selectedObject.transform.position,
          cameraState.distance,
          hoveredAxis,
          activeAxis
        );
      }
    }

    // Submit commands
    this.device.queue.submit([commandEncoder.finish()]);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.render);
  };
}
