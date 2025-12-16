import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ObjectList } from '../components/panels/ObjectList';
import { useSceneStore } from '../store/sceneStore';

describe('Object renaming', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
    useSceneStore.setState({ past: [], future: [] } as any);
  });

  it('double-click enables edit mode', () => {
    useSceneStore.getState().addSphere();
    render(<ObjectList />);

    fireEvent.doubleClick(screen.getByText(/Sphere 1/));
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('enter submits new name', () => {
    const id = useSceneStore.getState().addSphere();
    render(<ObjectList />);

    fireEvent.doubleClick(screen.getByText(/Sphere 1/));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Sphere' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(useSceneStore.getState().getObject(id)?.name).toBe('My Sphere');
  });
});


