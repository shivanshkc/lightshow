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
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  HelpCircle: () => <span data-testid="help-icon">Help</span>,
  Circle: () => <span data-testid="circle-icon">Circle</span>,
  Box: () => <span data-testid="box-icon">Box</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eyeoff-icon">EyeOff</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
}));

describe('App', () => {
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

  it('renders header with Lightshow title', () => {
    render(<App />);
    expect(screen.getByText('Lightshow')).toBeDefined();
  });

  it('renders Add Object section', () => {
    render(<App />);
    expect(screen.getByText('Add Object')).toBeDefined();
  });

  it('renders Scene Objects section', () => {
    render(<App />);
    expect(screen.getByText('Scene Objects')).toBeDefined();
  });

  it('shows empty state when no objects', () => {
    render(<App />);
    expect(screen.getByText('No objects in scene')).toBeDefined();
  });

  it('shows properties placeholder when nothing selected', () => {
    render(<App />);
    expect(screen.getByText('Select an object to view properties')).toBeDefined();
  });
});
