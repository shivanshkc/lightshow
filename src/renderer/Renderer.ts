import { WebGPUContext } from './webgpu';

export interface RendererStats {
  fps: number;
  frameTime: number;
  frameCount: number;
}

export class Renderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;
  
  private clearColor: GPUColor = { r: 0.05, g: 0.05, b: 0.08, a: 1.0 };

  constructor(ctx: WebGPUContext) {
    this.device = ctx.device;
    this.context = ctx.context;
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
   * Set the clear color
   */
  setClearColor(color: GPUColor): void {
    this.clearColor = color;
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

    // Get current texture
    const textureView = this.context.getCurrentTexture().createView();

    // Create command encoder
    const commandEncoder = this.device.createCommandEncoder();

    // Create render pass that clears to our color
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: this.clearColor,
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    renderPass.end();

    // Submit commands
    this.device.queue.submit([commandEncoder.finish()]);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.render);
  };
}

