import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock WebGPU globals
vi.stubGlobal('GPUBufferUsage', {
  UNIFORM: 0x0040,
  COPY_DST: 0x0008,
  STORAGE: 0x0080,
});

vi.stubGlobal('GPUTextureUsage', {
  STORAGE_BINDING: 0x0008,
  TEXTURE_BINDING: 0x0004,
  RENDER_ATTACHMENT: 0x0010,
});

vi.stubGlobal('GPUShaderStage', {
  VERTEX: 0x1,
  FRAGMENT: 0x2,
  COMPUTE: 0x4,
});

describe('RaytracingPipeline', () => {
  const mockTextureView = { label: 'mockTextureView' };
  const mockTexture = {
    createView: vi.fn().mockReturnValue(mockTextureView),
    destroy: vi.fn(),
  };
  const mockBuffer = { destroy: vi.fn() };
  const mockDevice = {
    createBuffer: vi.fn().mockReturnValue(mockBuffer),
    createTexture: vi.fn().mockReturnValue(mockTexture),
    createShaderModule: vi.fn().mockReturnValue({}),
    createBindGroupLayout: vi.fn().mockReturnValue({}),
    createPipelineLayout: vi.fn().mockReturnValue({}),
    createComputePipeline: vi.fn().mockReturnValue({}),
    createBindGroup: vi.fn().mockReturnValue({}),
    queue: {
      writeBuffer: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates camera and settings buffers on construction', async () => {
    const { RaytracingPipeline } = await import('../renderer/RaytracingPipeline');
    new RaytracingPipeline(mockDevice as unknown as GPUDevice);
    
    // Should create: camera buffer, settings buffer, scene buffer (header + objects)
    expect(mockDevice.createBuffer).toHaveBeenCalled();
  });

  it('creates compute pipeline with shader', async () => {
    const { RaytracingPipeline } = await import('../renderer/RaytracingPipeline');
    new RaytracingPipeline(mockDevice as unknown as GPUDevice);
    
    expect(mockDevice.createShaderModule).toHaveBeenCalled();
    expect(mockDevice.createComputePipeline).toHaveBeenCalled();
  });

  it('creates output and ping-pong accumulation textures on resize', async () => {
    const { RaytracingPipeline } = await import('../renderer/RaytracingPipeline');
    const pipeline = new RaytracingPipeline(mockDevice as unknown as GPUDevice);
    
    pipeline.resizeOutput(800, 600);
    
    // Should create: 1 output texture + 2 accumulation textures
    expect(mockDevice.createTexture).toHaveBeenCalledTimes(3);
  });

  it('returns null texture view before resize', async () => {
    const { RaytracingPipeline } = await import('../renderer/RaytracingPipeline');
    const pipeline = new RaytracingPipeline(mockDevice as unknown as GPUDevice);
    
    expect(pipeline.getOutputTextureView()).toBeNull();
  });

  it('returns texture view after resize', async () => {
    const { RaytracingPipeline } = await import('../renderer/RaytracingPipeline');
    const pipeline = new RaytracingPipeline(mockDevice as unknown as GPUDevice);
    
    pipeline.resizeOutput(800, 600);
    
    expect(pipeline.getOutputTextureView()).toBeDefined();
  });

  it('resets frame index on resetAccumulation', async () => {
    const { RaytracingPipeline } = await import('../renderer/RaytracingPipeline');
    const pipeline = new RaytracingPipeline(mockDevice as unknown as GPUDevice);
    
    // Simulate some frames by calling resize and getting frameIndex
    pipeline.resizeOutput(800, 600);
    
    // Mock dispatch to increment frameIndex
    const mockEncoder = {
      beginComputePass: vi.fn().mockReturnValue({
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        dispatchWorkgroups: vi.fn(),
        end: vi.fn(),
      }),
    };
    
    pipeline.dispatch(mockEncoder as unknown as GPUCommandEncoder);
    expect(pipeline.getFrameIndex()).toBe(1);
    
    pipeline.resetAccumulation();
    expect(pipeline.getFrameIndex()).toBe(0);
  });

  it('creates bind group layout with 7 entries (including ping-pong textures)', async () => {
    const { RaytracingPipeline } = await import('../renderer/RaytracingPipeline');
    new RaytracingPipeline(mockDevice as unknown as GPUDevice);
    
    expect(mockDevice.createBindGroupLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ binding: 0 }), // camera
          expect.objectContaining({ binding: 1 }), // settings
          expect.objectContaining({ binding: 2 }), // output
          expect.objectContaining({ binding: 3 }), // prev accumulation (read)
          expect.objectContaining({ binding: 4 }), // curr accumulation (write)
          expect.objectContaining({ binding: 5 }), // scene header
          expect.objectContaining({ binding: 6 }), // scene objects
        ]),
      })
    );
  });

  it('destroys textures on resize', async () => {
    const { RaytracingPipeline } = await import('../renderer/RaytracingPipeline');
    const pipeline = new RaytracingPipeline(mockDevice as unknown as GPUDevice);
    
    pipeline.resizeOutput(800, 600);
    mockTexture.destroy.mockClear();
    
    pipeline.resizeOutput(1024, 768);
    
    // Should destroy old output + 2 accumulation textures
    expect(mockTexture.destroy).toHaveBeenCalledTimes(3);
  });
});
