import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KernelProvider } from '@adapters';
import { MobileHud } from '../components/layout/MobileHud';
import { useGizmoStore } from '../store/gizmoStore';
import { useUiShellStore } from '../components/layout/uiShellStore';

function renderMobileHud() {
  return render(
    <KernelProvider>
      <MobileHud />
    </KernelProvider>
  );
}

function stubMatchMedia(matches: boolean) {
  const mql = {
    matches,
    media: '',
    onchange: null as any,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((_q: string) => mql));
  return mql;
}

describe('MobileHud', () => {
  beforeEach(() => {
    useGizmoStore.setState({ mode: 'translate' } as any);
    useUiShellStore.getState().reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a cycle button on phone-sized screens and cycles gizmo mode', async () => {
    stubMatchMedia(false); // < md
    renderMobileHud();

    const cycle = await screen.findByLabelText('Cycle Gizmo Mode (W/E/R)');
    expect(cycle).toBeDefined();

    fireEvent.click(cycle);
    expect(useGizmoStore.getState().mode).toBe('rotate');
    fireEvent.click(cycle);
    expect(useGizmoStore.getState().mode).toBe('scale');
    fireEvent.click(cycle);
    expect(useGizmoStore.getState().mode).toBe('translate');
  });

  it('renders segmented W/E/R on tablet-sized screens and can set mode directly', async () => {
    stubMatchMedia(true); // >= md
    renderMobileHud();

    // The segmented control buttons use aria-labels.
    const rotate = await screen.findByRole('button', { name: 'Rotate (E)' });
    expect(rotate).toBeDefined();

    fireEvent.click(rotate);

    await waitFor(() => {
      expect(useGizmoStore.getState().mode).toBe('rotate');
    });
  });
});


