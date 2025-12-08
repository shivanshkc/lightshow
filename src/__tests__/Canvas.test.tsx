import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Canvas } from '../components/Canvas';

describe('Canvas Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    
    // Setup default WebGPU mock
    const mockDevice = {
      destroy: vi.fn(),
      lost: Promise.resolve({ reason: 'destroyed', message: '' }),
    };

    const mockGPUContext = {
      configure: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue({
          requestDevice: vi.fn().mockResolvedValue(mockDevice),
        }),
        getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
      },
    });

    // Mock canvas.getContext to return our mock GPU context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type: string) => {
      if (type === 'webgpu') {
        return mockGPUContext;
      }
      return null;
    });
  });

  it('shows loading state initially', () => {
    render(<Canvas />);
    expect(screen.getByText('Initializing WebGPU...')).toBeDefined();
  });

  it('renders canvas element immediately', () => {
    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('calls onContextReady when initialization succeeds', async () => {
    const onContextReady = vi.fn();
    
    render(<Canvas onContextReady={onContextReady} />);
    
    await waitFor(() => {
      expect(onContextReady).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('hides loading overlay when ready', async () => {
    render(<Canvas />);
    
    // Initially shows loading
    expect(screen.getByText('Initializing WebGPU...')).toBeDefined();
    
    // After init, loading should be gone
    await waitFor(() => {
      expect(screen.queryByText('Initializing WebGPU...')).toBeNull();
    }, { timeout: 2000 });
  });

  it('applies className prop', () => {
    const { container } = render(<Canvas className="test-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('test-class');
  });
});

describe('Canvas Error Handling', () => {
  it('shows error state when WebGPU is not supported', async () => {
    // Override mock to simulate no WebGPU
    vi.stubGlobal('navigator', { gpu: undefined });
    
    render(<Canvas />);
    
    await waitFor(() => {
      expect(screen.getByText('WebGPU Not Available')).toBeDefined();
    }, { timeout: 2000 });
  });

  it('calls onError when initialization fails', async () => {
    vi.stubGlobal('navigator', { gpu: undefined });
    const onError = vi.fn();
    
    render(<Canvas onError={onError} />);
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});
