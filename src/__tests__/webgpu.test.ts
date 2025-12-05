import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWebGPUSupport } from '../renderer/webgpu';

describe('WebGPU Utilities', () => {
  describe('checkWebGPUSupport', () => {
    beforeEach(() => {
      // Reset navigator.gpu mock
      vi.stubGlobal('navigator', { gpu: undefined });
    });

    it('returns not supported when navigator.gpu is undefined', () => {
      const result = checkWebGPUSupport();
      
      expect(result.supported).toBe(false);
      expect(result.reason).toContain('not supported');
    });

    it('returns supported when navigator.gpu exists', () => {
      vi.stubGlobal('navigator', { gpu: {} });
      
      const result = checkWebGPUSupport();
      
      expect(result.supported).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });
});

describe('WebGPU Context Types', () => {
  it('WebGPUContext interface has required properties', () => {
    // Type check - this test passes if types compile correctly
    const mockContext: import('../renderer/webgpu').WebGPUContext = {
      device: {} as GPUDevice,
      context: {} as GPUCanvasContext,
      format: 'bgra8unorm',
      canvas: document.createElement('canvas'),
    };
    
    expect(mockContext.format).toBe('bgra8unorm');
  });
});

