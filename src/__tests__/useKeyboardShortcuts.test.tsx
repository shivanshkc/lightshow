import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSceneStore } from '../store/sceneStore';
import { KernelProvider } from '@adapters';

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

    render(
      <KernelProvider>
        <Harness />
      </KernelProvider>
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    });

    expect(useSceneStore.getState().objects.length).toBe(0);
  });

  it('Ctrl+D duplicates selected', () => {
    const id = useSceneStore.getState().addSphere()!;
    useSceneStore.getState().selectObject(id);

    render(
      <KernelProvider>
        <Harness />
      </KernelProvider>
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
    });

    expect(useSceneStore.getState().objects.length).toBe(2);
  });

  it('Ctrl+Z undoes last action', () => {
    useSceneStore.getState().addSphere();
    expect(useSceneStore.getState().objects.length).toBe(1);

    render(
      <KernelProvider>
        <Harness />
      </KernelProvider>
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    });

    expect(useSceneStore.getState().objects.length).toBe(0);
  });
});


