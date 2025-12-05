import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

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
};

const mockContext = {
  configure: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal('navigator', {
    gpu: {
      requestAdapter: vi.fn().mockResolvedValue({
        requestDevice: vi.fn().mockResolvedValue(mockDevice),
      }),
      getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
    },
  });

  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);
});

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.bg-base')).toBeDefined();
  });

  it('contains a Canvas component', () => {
    const { container } = render(<App />);
    // The canvas shows loading initially
    expect(container.textContent).toContain('Initializing WebGPU');
  });
});
