import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Canvas } from '../components/Canvas';

// Mock ResizeObserver before anything else
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
});

// Mock WebGPU
const mockDevice = {
  destroy: vi.fn(),
  lost: Promise.resolve({ reason: 'destroyed', message: '' }),
  queue: { submit: vi.fn(), writeBuffer: vi.fn() },
  createCommandEncoder: vi.fn().mockReturnValue({
    beginRenderPass: vi.fn().mockReturnValue({ end: vi.fn(), setPipeline: vi.fn(), setBindGroup: vi.fn(), draw: vi.fn() }),
    beginComputePass: vi.fn().mockReturnValue({ end: vi.fn(), setPipeline: vi.fn(), setBindGroup: vi.fn(), dispatchWorkgroups: vi.fn() }),
    finish: vi.fn().mockReturnValue({}),
  }),
  createBuffer: vi.fn().mockReturnValue({ destroy: vi.fn() }),
  createTexture: vi.fn().mockReturnValue({ destroy: vi.fn(), createView: vi.fn() }),
  createShaderModule: vi.fn().mockReturnValue({}),
  createComputePipeline: vi.fn().mockReturnValue({}),
  createRenderPipeline: vi.fn().mockReturnValue({}),
  createBindGroupLayout: vi.fn().mockReturnValue({}),
  createPipelineLayout: vi.fn().mockReturnValue({}),
  createBindGroup: vi.fn().mockReturnValue({}),
  createSampler: vi.fn().mockReturnValue({}),
};

const mockGPUContext = {
  configure: vi.fn(),
  getCurrentTexture: vi.fn().mockReturnValue({ createView: vi.fn() }),
};

// Mock requestAnimationFrame and cancelAnimationFrame
let animationFrameId = 0;
vi.stubGlobal('requestAnimationFrame', vi.fn(() => {
  animationFrameId++;
  return animationFrameId;
}));
vi.stubGlobal('cancelAnimationFrame', vi.fn());

// Mock GPU constants
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

describe('Canvas Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue({
          requestDevice: vi.fn().mockResolvedValue(mockDevice),
        }),
        getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
      },
    });
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockGPUContext);
  });

  it('shows loading state initially', () => {
    render(<Canvas />);
    expect(screen.getByText('Initializing WebGPU...')).toBeDefined();
  });

  it('renders canvas element', () => {
    const { container } = render(<Canvas />);
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('applies className prop to the wrapper', () => {
    const { container } = render(<Canvas className="test-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('test-class');
  });

  it('hides loading overlay when ready', async () => {
    render(<Canvas />);
    await waitFor(() => {
      expect(screen.queryByText('Initializing WebGPU...')).toBeNull();
    });
  });
});

describe('Canvas Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error state when WebGPU is not supported', async () => {
    vi.stubGlobal('navigator', { gpu: undefined });
    render(<Canvas />);
    await waitFor(() => {
      expect(screen.getByText('WebGPU Not Available')).toBeDefined();
    });
  });
});
