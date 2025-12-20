import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../components/layout/StatusBar';
import { useRef } from 'react';
import { KernelProvider } from '@adapters';

// Mock Renderer
const mockRenderer = {
  getSampleCount: vi.fn().mockReturnValue(42),
  getStats: vi
    .fn()
    .mockReturnValue({ fps: 60, frameTime: 16, frameCount: 100, sampleCount: 42 }),
};

// Wrapper component to provide ref
function TestWrapper() {
  const rendererRef = useRef(mockRenderer as any);
  return (
    <KernelProvider>
      <StatusBar rendererRef={rendererRef} />
    </KernelProvider>
  );
}

describe('StatusBar', () => {
  it('renders performance widget labels', () => {
    render(<TestWrapper />);
    expect(screen.getByText('FPS')).toBeDefined();
    expect(screen.getByText('Samples')).toBeDefined();
  });

  it('does not render legacy footer strip', () => {
    const { container } = render(<TestWrapper />);
    expect(container.querySelector('footer')).toBeNull();
  });
});
