import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransformSection } from '../../components/panels/TransformSection';
import { useSceneStore } from '../../store/sceneStore';
import { KernelProvider } from '@adapters';

// Create a mock scene object
const createMockObject = (type: 'sphere' | 'cuboid') => ({
  id: 'test-1',
  name: 'Test Object',
  type,
  transform: {
    position: [1, 2, 3],
    rotation: [0, Math.PI / 4, 0], // 45 degrees around Y
    scale: [1, 1, 1],
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

  it('renders position label', () => {
    render(
      <KernelProvider>
        <TransformSection object={createMockObject('sphere') as any} />
      </KernelProvider>
    );
    expect(screen.getByText('Position')).toBeDefined();
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
    // Position Y value (2.00) - unique to this test
    expect(screen.getByDisplayValue('2.00')).toBeDefined();
    // Position Z value (3.00)
    expect(screen.getByDisplayValue('3.00')).toBeDefined();
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
    // 45 degrees for Y rotation
    expect(screen.getByDisplayValue('45.0')).toBeDefined();
  });
});

