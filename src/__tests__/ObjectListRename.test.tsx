import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ObjectList } from '../components/panels/ObjectList';
import { useSceneStore } from '../store/sceneStore';
import { KernelProvider } from '@adapters';

describe('Object renaming', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
    useSceneStore.setState({ past: [], future: [] } as any);
  });

  it('click selects an object via kernel command path', () => {
    const id = useSceneStore.getState().addSphere()!;
    render(
      <KernelProvider>
        <ObjectList />
      </KernelProvider>
    );

    // Click the list row (text inside the row)
    fireEvent.click(screen.getByText(/Sphere 1/));
    expect(useSceneStore.getState().selectedObjectId).toBe(id);
  });

  it('double-click enables edit mode', () => {
    useSceneStore.getState().addSphere();
    render(
      <KernelProvider>
        <ObjectList />
      </KernelProvider>
    );

    fireEvent.doubleClick(screen.getByText(/Sphere 1/));
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('enter submits new name', () => {
    const id = useSceneStore.getState().addSphere()!;
    render(
      <KernelProvider>
        <ObjectList />
      </KernelProvider>
    );

    fireEvent.doubleClick(screen.getByText(/Sphere 1/));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Sphere' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(useSceneStore.getState().getObject(id)?.name).toBe('My Sphere');
  });
});


