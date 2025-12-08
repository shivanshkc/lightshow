import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../components/StatusBar';
import { useRef } from 'react';

// Mock Renderer
const mockRenderer = {
  getSampleCount: vi.fn().mockReturnValue(42),
  getStats: vi.fn().mockReturnValue({ fps: 60, frameTime: 16, frameCount: 100, sampleCount: 42 }),
};

// Wrapper component to provide ref
function TestWrapper() {
  const rendererRef = useRef(mockRenderer as any);
  return <StatusBar rendererRef={rendererRef} />;
}

describe('StatusBar', () => {
  it('renders samples label', () => {
    render(<TestWrapper />);
    expect(screen.getByText(/Samples:/)).toBeDefined();
  });

  it('renders FPS label', () => {
    render(<TestWrapper />);
    expect(screen.getByText(/FPS:/)).toBeDefined();
  });

  it('is rendered as footer element', () => {
    const { container } = render(<TestWrapper />);
    expect(container.querySelector('footer')).toBeDefined();
  });
});

