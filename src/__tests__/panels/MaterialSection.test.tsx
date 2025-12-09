import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MaterialSection } from '../../components/panels/MaterialSection';
import { SceneObject, MaterialType } from '../../core/types';
import { useSceneStore } from '../../store/sceneStore';

// Create a mock scene object with a given material type
const createMockObject = (materialType: MaterialType): SceneObject => ({
  id: 'test-1',
  name: 'Test Object',
  type: 'sphere',
  transform: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  material: {
    type: materialType,
    color: [0.8, 0.8, 0.8],
    roughness: 0.5,
    metalness: 0,
    ior: 1.5,
    intensity: 5,
  },
  visible: true,
});

describe('MaterialSection', () => {
  beforeEach(() => {
    // Reset the store before each test
    useSceneStore.setState({ objects: [], selectedObjectId: null });
  });

  it('renders type selector label', () => {
    render(<MaterialSection object={createMockObject('plastic')} />);
    expect(screen.getByText('Type')).toBeDefined();
  });

  it('renders color picker label', () => {
    render(<MaterialSection object={createMockObject('plastic')} />);
    expect(screen.getByText('Color')).toBeDefined();
  });

  it('shows all material type options', () => {
    render(<MaterialSection object={createMockObject('plastic')} />);
    expect(screen.getByText('Plastic')).toBeDefined();
    expect(screen.getByText('Metal')).toBeDefined();
    expect(screen.getByText('Glass')).toBeDefined();
    expect(screen.getByText('Light')).toBeDefined();
  });

  it('shows IOR slider for glass material', () => {
    render(<MaterialSection object={createMockObject('glass')} />);
    expect(screen.getByText('Index of Refraction (IOR)')).toBeDefined();
  });

  it('hides IOR slider for non-glass materials', () => {
    render(<MaterialSection object={createMockObject('plastic')} />);
    expect(screen.queryByText('Index of Refraction (IOR)')).toBeNull();
  });

  it('shows Intensity slider for light material', () => {
    render(<MaterialSection object={createMockObject('light')} />);
    expect(screen.getByText('Intensity')).toBeDefined();
  });

  it('hides Intensity slider for non-light materials', () => {
    render(<MaterialSection object={createMockObject('metal')} />);
    expect(screen.queryByText('Intensity')).toBeNull();
  });

  it('shows plastic description', () => {
    render(<MaterialSection object={createMockObject('plastic')} />);
    expect(screen.getByText('Matte diffuse surface')).toBeDefined();
  });

  it('shows metal description', () => {
    render(<MaterialSection object={createMockObject('metal')} />);
    expect(screen.getByText('Perfectly reflective mirror surface')).toBeDefined();
  });

  it('shows glass description', () => {
    render(<MaterialSection object={createMockObject('glass')} />);
    expect(screen.getByText('Transparent with refraction')).toBeDefined();
  });

  it('shows light description', () => {
    render(<MaterialSection object={createMockObject('light')} />);
    expect(screen.getByText('Emits light, illuminates scene')).toBeDefined();
  });

  it('hides extra controls for plastic', () => {
    render(<MaterialSection object={createMockObject('plastic')} />);
    expect(screen.queryByText('Index of Refraction (IOR)')).toBeNull();
    expect(screen.queryByText('Intensity')).toBeNull();
  });

  it('hides extra controls for metal', () => {
    render(<MaterialSection object={createMockObject('metal')} />);
    expect(screen.queryByText('Index of Refraction (IOR)')).toBeNull();
    expect(screen.queryByText('Intensity')).toBeNull();
  });
});

