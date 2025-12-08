import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the Canvas component to avoid WebGPU dependencies in App tests
vi.mock('../components/Canvas', () => ({
  Canvas: ({ className }: { className?: string }) => (
    <div data-testid="canvas-mock" className={className}>
      Canvas Mock
    </div>
  ),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('canvas-mock')).toBeDefined();
  });

  it('applies full-screen styling', () => {
    const { container } = render(<App />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('w-full');
    expect(rootDiv.className).toContain('h-full');
  });
});
