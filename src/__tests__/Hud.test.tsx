import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KernelProvider } from '@adapters';
import { Hud } from '../components/layout/Hud';
import { useGizmoStore } from '../store/gizmoStore';

function TestWrapper() {
  return (
    <KernelProvider>
      <Hud />
    </KernelProvider>
  );
}

describe('Hud', () => {
  beforeEach(() => {
    useGizmoStore.setState({ mode: 'translate' } as any);
  });

  it('renders the core HUD controls', () => {
    render(<TestWrapper />);
    expect(screen.getByLabelText('Toggle Scene Panel')).toBeDefined();
    expect(screen.getByLabelText('Undo')).toBeDefined();
    expect(screen.getByLabelText('Redo')).toBeDefined();
    expect(screen.getByLabelText('Reset Camera')).toBeDefined();
    expect(screen.getByLabelText('Focus Selection')).toBeDefined();
    expect(screen.getByLabelText('Toggle Properties Panel')).toBeDefined();
  });

  it('changes gizmo mode when clicking W/E/R segments', () => {
    render(<TestWrapper />);
    fireEvent.click(screen.getByRole('button', { name: 'Rotate (E)' }));
    expect(useGizmoStore.getState().mode).toBe('rotate');
  });

  it('dispatches keyboard event for camera reset', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    render(<TestWrapper />);
    fireEvent.click(screen.getByLabelText('Reset Camera'));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});


