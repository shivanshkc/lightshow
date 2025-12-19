import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../components/layout/StatusBar';
import { useRef } from 'react';
import { useSceneStore } from '../store/sceneStore';
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
  it('renders undo/redo buttons', () => {
    // Ensure history functions exist (sceneStore is wrapped with history middleware)
    useSceneStore.setState({ past: [], future: [] } as any);

    render(<TestWrapper />);
    expect(screen.getByLabelText('Undo')).toBeDefined();
    expect(screen.getByLabelText('Redo')).toBeDefined();
  });

  it('renders samples label', () => {
    render(<TestWrapper />);
    expect(screen.getByText(/Samples:/)).toBeDefined();
  });

  it('renders FPS label', () => {
    render(<TestWrapper />);
    expect(screen.getByText(/FPS:/)).toBeDefined();
  });

  it('renders objects count label', () => {
    render(<TestWrapper />);
    expect(screen.getByText(/Objects:/)).toBeDefined();
  });

  it('is rendered as footer element', () => {
    const { container } = render(<TestWrapper />);
    expect(container.querySelector('footer')).toBeDefined();
  });
});
