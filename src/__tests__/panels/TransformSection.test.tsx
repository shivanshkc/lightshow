import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TransformSection } from '../../components/panels/TransformSection';
import { useSceneStore } from '../../store/sceneStore';
import { KernelProvider } from '@adapters';
import type { Kernel } from '@kernel';

// Create a mock scene object
const createMockObject = (type: 'sphere' | 'cuboid') => ({
  id: 'test-1',
  name: 'Test Object',
  type,
  transform: {
    position: [11, 22, 33],
    rotation: [(10 * Math.PI) / 180, (20 * Math.PI) / 180, (30 * Math.PI) / 180],
    scale: [4, 5, 6],
  },
  material: {
    type: 'plastic',
    color: [0.8, 0.8, 0.8],
    ior: 1.5,
    intensity: 1,
  },
  visible: true,
});

describe('TransformSection', () => {
  beforeEach(() => {
    // Reset the store before each test
    useSceneStore.setState({ objects: [], selectedObjectId: null });
  });

  function makeMockKernel(): Kernel {
    return {
      dispatch: vi.fn(),
      queries: {
        getSceneSnapshot: () =>
          ({
            objects: [],
            selectedObjectId: null,
            backgroundColor: [0, 0, 0],
            history: { canUndo: false, canRedo: false },
          }) as any,
      },
      events: {
        subscribe: () => () => {},
      },
    };
  }

  it('renders position label', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('sphere') as any} />
      </KernelProvider>
    );
    expect(screen.getByText('Position')).toBeDefined();
  });

  it('renders reset transform icon button in the header', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('sphere') as any} />
      </KernelProvider>
    );
    expect(screen.getByLabelText('Reset Transform')).toBeDefined();
  });

  it('renders rotation label', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('sphere') as any} />
      </KernelProvider>
    );
    expect(screen.getByText('Rotation (°)')).toBeDefined();
  });

  it('displays position values', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('sphere') as any} />
      </KernelProvider>
    );
    // Position Y value (22.00)
    expect(screen.getByDisplayValue('22.00')).toBeDefined();
    // Position Z value (33.00)
    expect(screen.getByDisplayValue('33.00')).toBeDefined();
  });

  it('shows Radius for spheres', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('sphere') as any} />
      </KernelProvider>
    );
    expect(screen.getByText('Radius')).toBeDefined();
  });

  it('shows Scale label for cuboids', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('cuboid') as any} />
      </KernelProvider>
    );
    expect(screen.getByText('Scale')).toBeDefined();
  });

  it('does not show Scale for spheres', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('sphere') as any} />
      </KernelProvider>
    );
    expect(screen.queryByText('Scale')).toBeNull();
  });

  it('does not show Radius for cuboids', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('cuboid') as any} />
      </KernelProvider>
    );
    expect(screen.queryByText('Radius')).toBeNull();
  });

  it('displays rotation in degrees', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('sphere') as any} />
      </KernelProvider>
    );
    // 20 degrees for Y rotation
    expect(screen.getByDisplayValue('20.0')).toBeDefined();
  });

  it('dispatches transform.update on position input blur (commit behavior)', () => {
    const kernel = makeMockKernel();
    render(
      <KernelProvider kernel={kernel}>
        <TransformSection object={createMockObject('cuboid') as any} />
      </KernelProvider>
    );

    const positionBlock = screen.getByText('Position').parentElement!;
    const [xInput] = within(positionBlock).getAllByRole('textbox');

    fireEvent.change(xInput, { target: { value: '5' } });
    fireEvent.blur(xInput);

    expect(kernel.dispatch).toHaveBeenCalledWith({
      v: 1,
      type: 'transform.update',
      objectId: 'test-1',
      transform: { position: [5, 22, 33] },
    });
  });

  it('dispatches transform.update with degrees→radians conversion for rotation', () => {
    const kernel = makeMockKernel();
    render(
      <KernelProvider kernel={kernel}>
        <TransformSection object={createMockObject('cuboid') as any} />
      </KernelProvider>
    );

    const rotationBlock = screen.getByText('Rotation (°)').parentElement!;
    const [, yInput] = within(rotationBlock).getAllByRole('textbox');

    fireEvent.change(yInput, { target: { value: '90' } });
    fireEvent.blur(yInput);

    const cmd = (kernel.dispatch as any).mock.calls.at(-1)[0];
    expect(cmd.v).toBe(1);
    expect(cmd.type).toBe('transform.update');
    expect(cmd.objectId).toBe('test-1');
    expect(Array.isArray(cmd.transform.rotation)).toBe(true);

    const rot = cmd.transform.rotation as number[];
    expect(rot[0]).toBeCloseTo((10 * Math.PI) / 180, 6);
    expect(rot[1]).toBeCloseTo(Math.PI / 2, 6);
    expect(rot[2]).toBeCloseTo((30 * Math.PI) / 180, 6);
  });

  it('enforces uniform scale for spheres (radius input)', () => {
    const kernel = makeMockKernel();
    render(
      <KernelProvider kernel={kernel}>
        <TransformSection object={createMockObject('sphere') as any} />
      </KernelProvider>
    );

    // Sphere uses a single "Radius" NumberInput.
    const radiusBlock = screen.getByText('Radius').parentElement!;
    const input = within(radiusBlock).getByRole('textbox');

    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.blur(input);

    expect(kernel.dispatch).toHaveBeenCalledWith({
      v: 1,
      type: 'transform.update',
      objectId: 'test-1',
      transform: { scale: [2, 2, 2] },
    });
  });
});

