import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransformSection } from '../../components/panels/TransformSection';
import { SceneObject } from '../../core/types';
import { useSceneStore } from '../../store/sceneStore';

// Create a mock scene object
const createMockObject = (type: 'sphere' | 'cuboid'): SceneObject => ({
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
    render(<TransformSection object={createMockObject('sphere')} />);
    expect(screen.getByText('Position')).toBeDefined();
  });

  it('renders rotation label', () => {
    render(<TransformSection object={createMockObject('sphere')} />);
    expect(screen.getByText('Rotation (°)')).toBeDefined();
  });

  it('displays position values', () => {
    render(<TransformSection object={createMockObject('sphere')} />);
    // Position Y value (2.00) - unique to this test
    expect(screen.getByDisplayValue('2.00')).toBeDefined();
    // Position Z value (3.00)
    expect(screen.getByDisplayValue('3.00')).toBeDefined();
  });

  it('shows Radius for spheres', () => {
    render(<TransformSection object={createMockObject('sphere')} />);
    expect(screen.getByText('Radius')).toBeDefined();
  });

  it('shows Scale label for cuboids', () => {
    render(<TransformSection object={createMockObject('cuboid')} />);
    expect(screen.getByText('Scale')).toBeDefined();
  });

  it('does not show Scale for spheres', () => {
    render(<TransformSection object={createMockObject('sphere')} />);
    expect(screen.queryByText('Scale')).toBeNull();
  });

  it('does not show Radius for cuboids', () => {
    render(<TransformSection object={createMockObject('cuboid')} />);
    expect(screen.queryByText('Radius')).toBeNull();
  });

  it('displays rotation in degrees', () => {
    render(<TransformSection object={createMockObject('sphere')} />);
    // 45 degrees for Y rotation
    expect(screen.getByDisplayValue('45.0')).toBeDefined();
  });
});

