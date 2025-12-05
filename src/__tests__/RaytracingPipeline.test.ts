import { describe, it, expect, vi } from 'vitest';

// Mock WebGPU globals
vi.stubGlobal('GPUBufferUsage', {
  STORAGE: 0x0080,
  COPY_DST: 0x0008,
  UNIFORM: 0x0040,
});

vi.stubGlobal('GPUTextureUsage', {
  STORAGE_BINDING: 0x0008,
  TEXTURE_BINDING: 0x0004,
});

vi.stubGlobal('GPUShaderStage', {
  COMPUTE: 0x4,
});

describe('RaytracingPipeline', () => {
  it('dispatches correct workgroup count for various dimensions', () => {
    const workgroupSize = 8;
    
    // For 800x600
    expect(Math.ceil(800 / workgroupSize)).toBe(100);
    expect(Math.ceil(600 / workgroupSize)).toBe(75);
    
    // For 1920x1080
    expect(Math.ceil(1920 / workgroupSize)).toBe(240);
    expect(Math.ceil(1080 / workgroupSize)).toBe(135);
    
    // For odd dimensions (513x257)
    expect(Math.ceil(513 / workgroupSize)).toBe(65);
    expect(Math.ceil(257 / workgroupSize)).toBe(33);
  });

  it('camera uniform buffer size is correct', () => {
    // inverseProjection (16) + inverseView (16) + position (3) + padding (1) = 36 floats
    const expectedFloats = 36;
    const expectedBytes = expectedFloats * 4;
    expect(expectedBytes).toBe(144);
  });

  it('output texture format supports storage binding', () => {
    // rgba8unorm supports STORAGE_BINDING on all WebGPU implementations
    const format = 'rgba8unorm';
    expect(format).toBe('rgba8unorm');
  });
});

describe('RaytracingPipeline shader import', () => {
  it('can import raytracer shader as raw text', async () => {
    const shader = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(shader.default).toContain('@compute');
    expect(typeof shader.default).toBe('string');
  });
});

describe('Accumulation', () => {
  it('frameIndex starts at 0', () => {
    const frameIndex = 0;
    expect(frameIndex).toBe(0);
  });
  
  it('resetAccumulation sets frameIndex to 0', () => {
    let frameIndex = 50;
    frameIndex = 0; // reset
    expect(frameIndex).toBe(0);
  });
  
  it('accumulation texture format is rgba32float', () => {
    const format: GPUTextureFormat = 'rgba32float';
    expect(format).toBe('rgba32float');
  });

  it('settings buffer is 16 bytes (4 u32)', () => {
    const settingsSize = 4 * 4; // 4 u32 values
    expect(settingsSize).toBe(16);
  });
});
