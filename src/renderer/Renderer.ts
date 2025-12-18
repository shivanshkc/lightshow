import { WebGPUContext } from './webgpu';
import { Camera, mat4Multiply, mat4Perspective } from '@core';
import { RaytracingPipeline } from './RaytracingPipeline';
import { BlitPipeline } from './BlitPipeline';
import { GizmoRenderer } from '@gizmos';
import type { KernelEvents, KernelQueries, SceneSnapshot } from '@ports';

export interface RendererStats {
  fps: number;
  frameTime: number;
  frameCount: number;
  sampleCount: number;
}

export type RendererCameraState = {
  position: [number, number, number];
  target: [number, number, number];
  fovY: number;
  distance: number;
};

export type RendererGizmoState = {
  mode: 'translate' | 'rotate' | 'scale' | 'none';
  hoveredAxisId: number;
  activeAxisId: number;
};

export interface RendererDeps {
  queries: KernelQueries;
  events: KernelEvents;
  getCameraState(): RendererCameraState;
  getGizmoState(): RendererGizmoState;
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

  private deps: RendererDeps;
  private unsubscribeKernelEvents: (() => void) | null = null;

  private lastSnapshot: SceneSnapshot | null = null;
  private lastObjectsRef: unknown = null;

  constructor(ctx: WebGPUContext, deps: RendererDeps) {
    this.device = ctx.device;
    this.context = ctx.context;
    this.format = ctx.format;
    this.deps = deps;

    // Create camera
    this.camera = new Camera();

    // Create pipelines
    this.raytracingPipeline = new RaytracingPipeline(this.device);
    this.blitPipeline = new BlitPipeline(this.device, this.format);
    this.gizmoRenderer = new GizmoRenderer(this.device, this.format);

    // Initial sync + subscribe to kernel events (no direct store subscription).
    this.syncFromSnapshot(this.deps.queries.getSceneSnapshot());
    this.unsubscribeKernelEvents = this.deps.events.subscribe((event) => {
      if (event.type === 'state.changed') {
        this.syncFromSnapshot(this.deps.queries.getSceneSnapshot());
      }
      if (event.type === 'render.invalidated') {
        this.raytracingPipeline.resetAccumulation();
      }
    });
  }

  private syncFromSnapshot(snapshot: SceneSnapshot): void {
    this.lastSnapshot = snapshot;

    // Upload scene only when object array reference changes.
    const objectsRef = snapshot.objects as unknown;
    if (this.lastObjectsRef !== objectsRef) {
      this.raytracingPipeline.updateScene(snapshot.objects as any);
      this.lastObjectsRef = objectsRef;
    }

    // Selection index is in terms of *visible* objects (shader only knows visible objects).
    const selectedIndex = computeSelectedVisibleIndex(snapshot.objects as any, snapshot.selectedObjectId);
    this.raytracingPipeline.setSelectedObjectIndex(selectedIndex);

    // Pack background color (RGB 0..1) into 0xRRGGBB.
    const bg = snapshot.backgroundColor ?? ([0.5, 0.7, 1.0] as [number, number, number]);
    const r = Math.max(0, Math.min(255, Math.round(bg[0] * 255)));
    const g = Math.max(0, Math.min(255, Math.round(bg[1] * 255)));
    const b = Math.max(0, Math.min(255, Math.round(bg[2] * 255)));
    const bgPacked = (r << 16) | (g << 8) | b;
    this.raytracingPipeline.setBackgroundColorPacked(bgPacked);
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
    
    if (this.unsubscribeKernelEvents) {
      this.unsubscribeKernelEvents();
      this.unsubscribeKernelEvents = null;
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

    // Sync camera from integration layer.
    const cameraState = this.deps.getCameraState();
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
    const snapshot = this.lastSnapshot;
    const gizmoState = this.deps.getGizmoState();

    if (snapshot?.selectedObjectId && gizmoState.mode !== 'none') {
      const selectedObject = (snapshot.objects as any).find(
        (obj: any) => obj.id === snapshot.selectedObjectId
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
        
        this.gizmoRenderer.render(
          commandEncoder,
          targetView,
          viewProjection,
          selectedObject.transform.position,
          cameraState.distance,
          gizmoState.hoveredAxisId,
          gizmoState.activeAxisId,
          gizmoState.mode
        );
      }
    }

    // Submit commands
    this.device.queue.submit([commandEncoder.finish()]);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.render);
  };
}

function computeSelectedVisibleIndex(
  objects: readonly { id: string; visible: boolean }[],
  selectedObjectId: string | null
): number {
  if (!selectedObjectId) return -1;

  // No allocations: compute index in the "visible objects" stream.
  let visibleIndex = 0;
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    if (!obj.visible) continue;
    if (obj.id === selectedObjectId) return visibleIndex;
    visibleIndex++;
  }
  return -1;
}
