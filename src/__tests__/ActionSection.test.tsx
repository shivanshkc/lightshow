import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionSection } from '../components/panels/ActionSection';
import { useSceneStore } from '../store/sceneStore';
import { KernelProvider } from '@adapters';

describe('ActionSection', () => {
  beforeEach(() => {
    useSceneStore.getState().clear();
    useSceneStore.setState({ past: [], future: [] } as any);
  });

  it('disables buttons when no selection', () => {
    render(
      <KernelProvider>
        <ActionSection />
      </KernelProvider>
    );
    expect((screen.getByText('Delete').closest('button') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText('Duplicate').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });
});


