import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSceneStore } from '../store/sceneStore';

function Harness() {
  useKeyboardShortcuts();
  return null;
}

describe('Keyboard shortcuts', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
    useSceneStore.setState({ past: [], future: [] } as any);
  });

  it('Delete removes selected object', () => {
    const id = useSceneStore.getState().addSphere()!;
    useSceneStore.getState().selectObject(id);

    render(<Harness />);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));

    expect(useSceneStore.getState().objects.length).toBe(0);
  });

  it('Ctrl+D duplicates selected', () => {
    const id = useSceneStore.getState().addSphere()!;
    useSceneStore.getState().selectObject(id);

    render(<Harness />);
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'd', ctrlKey: true })
    );

    expect(useSceneStore.getState().objects.length).toBe(2);
  });

  it('Ctrl+Z undoes last action', () => {
    useSceneStore.getState().addSphere();
    expect(useSceneStore.getState().objects.length).toBe(1);

    render(<Harness />);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));

    expect(useSceneStore.getState().objects.length).toBe(0);
  });
});


