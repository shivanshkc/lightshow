import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KernelProvider } from '@adapters';
import type { Kernel } from '@kernel';
import { LIMITS } from '../../utils/limits';
import { AddObjectSection } from '../../components/panels/AddObjectSection';

function makeMockKernel(objectsCount: number): Kernel {
  const snapshot = {
    objects: Array.from({ length: objectsCount }, (_, i) => ({ id: `o-${i}` })),
    selectedObjectId: null,
    backgroundColor: [0, 0, 0],
    history: { canUndo: false, canRedo: false },
  } as any;

  return {
    dispatch: vi.fn(),
    queries: {
      // IMPORTANT: must return a stable reference for useSyncExternalStore.
      getSceneSnapshot: () => snapshot,
    },
    events: {
      subscribe: () => () => {},
    },
  };
}

describe('AddObjectSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders 6 buttons in required order', () => {
    const kernel = makeMockKernel(0);
    render(
      <KernelProvider kernel={kernel}>
        <AddObjectSection />
      </KernelProvider>
    );

    const buttons = screen.getAllByRole('button');
    const labels = buttons.map((b) => (b.textContent ?? '').trim());
    expect(labels).toEqual(['Sphere', 'Cuboid', 'Cylinder', 'Cone', 'Torus', 'Capsule']);
  });

  it('dispatches object.add with correct primitive on click', () => {
    const kernel = makeMockKernel(0);
    render(
      <KernelProvider kernel={kernel}>
        <AddObjectSection />
      </KernelProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cylinder' }));
    expect(kernel.dispatch).toHaveBeenCalledWith({ v: 1, type: 'object.add', primitive: 'cylinder' });

    fireEvent.click(screen.getByRole('button', { name: 'Cone' }));
    expect(kernel.dispatch).toHaveBeenCalledWith({ v: 1, type: 'object.add', primitive: 'cone' });

    fireEvent.click(screen.getByRole('button', { name: 'Torus' }));
    expect(kernel.dispatch).toHaveBeenCalledWith({ v: 1, type: 'object.add', primitive: 'torus' });

    fireEvent.click(screen.getByRole('button', { name: 'Capsule' }));
    expect(kernel.dispatch).toHaveBeenCalledWith({ v: 1, type: 'object.add', primitive: 'capsule' });
  });

  it('disables all buttons and shows warning at object limit', () => {
    const kernel = makeMockKernel(LIMITS.maxObjects);
    render(
      <KernelProvider kernel={kernel}>
        <AddObjectSection />
      </KernelProvider>
    );

    expect(screen.getByText(new RegExp(`Maximum object limit reached \\(${LIMITS.maxObjects}\\)`))).toBeDefined();

    for (const b of screen.getAllByRole('button')) {
      expect(b).toHaveProperty('disabled', true);
    }
  });
});


