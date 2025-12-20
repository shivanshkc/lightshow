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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Circle: () => <span data-testid="circle-icon">Circle</span>,
  Box: () => <span data-testid="box-icon">Box</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eyeoff-icon">EyeOff</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
  RotateCcw: () => <span data-testid="undo-icon">Undo</span>,
  RotateCw: () => <span data-testid="redo-icon">Redo</span>,
  PanelLeft: () => <span data-testid="panel-left-icon">PanelLeft</span>,
  PanelRight: () => <span data-testid="panel-right-icon">PanelRight</span>,
  Home: () => <span data-testid="home-icon">Home</span>,
  Focus: () => <span data-testid="focus-icon">Focus</span>,
}));

describe('App', () => {
  it('registers a beforeunload warning', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<App />);

    expect(addSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('canvas-mock')).toBeDefined();
  });

  it('applies full-screen styling', () => {
    const { container } = render(<App />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('w-screen');
    expect(rootDiv.className).toContain('h-screen');
  });

  it('renders Add Object section', () => {
    render(<App />);
    expect(screen.getByText('Add Object')).toBeDefined();
  });

  it('renders Scene Objects section', () => {
    render(<App />);
    // Header includes object count suffix: "Scene Objects (N)"
    expect(screen.getByText(/Scene Objects/i)).toBeDefined();
  });

  it('shows initial scene objects', () => {
    render(<App />);
    // Initial scene includes Cornell Box fixtures
    expect(screen.getByText('Cornell Floor')).toBeDefined();
    expect(screen.getByText('Ceiling Light')).toBeDefined();
  });

  it('shows properties prompt when nothing selected', () => {
    render(<App />);
    expect(screen.getByText('Select an object to view properties')).toBeDefined();
  });
});
