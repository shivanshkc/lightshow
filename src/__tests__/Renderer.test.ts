import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Renderer, RendererStats } from '../renderer/Renderer';
import { WebGPUContext } from '../renderer/webgpu';

describe('Renderer', () => {
  let mockContext: WebGPUContext;
  let mockDevice: GPUDevice;
  let mockGPUContext: GPUCanvasContext;
  let mockCommandEncoder: GPUCommandEncoder;
  let mockRenderPass: GPURenderPassEncoder;

  beforeEach(() => {
    mockRenderPass = {
      end: vi.fn(),
    } as unknown as GPURenderPassEncoder;

    mockCommandEncoder = {
      beginRenderPass: vi.fn().mockReturnValue(mockRenderPass),
      finish: vi.fn().mockReturnValue({}),
    } as unknown as GPUCommandEncoder;

    mockGPUContext = {
      getCurrentTexture: vi.fn().mockReturnValue({
        createView: vi.fn().mockReturnValue({}),
      }),
    } as unknown as GPUCanvasContext;

    mockDevice = {
      createCommandEncoder: vi.fn().mockReturnValue(mockCommandEncoder),
      queue: {
        submit: vi.fn(),
      },
      destroy: vi.fn(),
    } as unknown as GPUDevice;

    mockContext = {
      device: mockDevice,
      context: mockGPUContext,
      format: 'bgra8unorm',
      canvas: document.createElement('canvas'),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a renderer instance', () => {
    const renderer = new Renderer(mockContext);
    expect(renderer).toBeDefined();
    renderer.destroy();
  });

  it('starts and stops the render loop', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const cafSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const renderer = new Renderer(mockContext);
    
    renderer.start();
    expect(rafSpy).toHaveBeenCalled();
    
    renderer.stop();
    expect(cafSpy).toHaveBeenCalledWith(1);
    
    renderer.destroy();
  });

  it('returns renderer stats', () => {
    const renderer = new Renderer(mockContext);
    
    const stats: RendererStats = renderer.getStats();
    
    expect(stats).toHaveProperty('fps');
    expect(stats).toHaveProperty('frameTime');
    expect(stats).toHaveProperty('frameCount');
    expect(typeof stats.fps).toBe('number');
    
    renderer.destroy();
  });

  it('allows setting clear color', () => {
    const renderer = new Renderer(mockContext);
    
    // Should not throw
    renderer.setClearColor({ r: 1, g: 0, b: 0, a: 1 });
    
    renderer.destroy();
  });

  it('cleans up on destroy', () => {
    const cafSpy = vi.spyOn(window, 'cancelAnimationFrame');
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);

    const renderer = new Renderer(mockContext);
    renderer.start();
    renderer.destroy();
    
    expect(cafSpy).toHaveBeenCalled();
  });

  it('does not start multiple render loops', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);

    const renderer = new Renderer(mockContext);
    
    renderer.start();
    renderer.start(); // Second call should be ignored
    
    // Should only be called once (from the first start)
    expect(rafSpy).toHaveBeenCalledTimes(1);
    
    renderer.destroy();
  });
});

