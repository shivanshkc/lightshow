import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { KernelProvider } from '@adapters';
import { LeftPanel } from '../../components/layout/LeftPanel';
import { RightPanel } from '../../components/layout/RightPanel';
import { useUiShellStore } from '../../components/layout/uiShellStore';

function wrap(ui: React.ReactNode) {
  return <KernelProvider>{ui}</KernelProvider>;
}

describe('Floating panels (desktop overlays)', () => {
  beforeEach(() => {
    useUiShellStore.getState().reset();
  });

  it('LeftPanel reflects open/closed state in data attribute', () => {
    const { container, rerender } = render(wrap(<LeftPanel />));
    const aside = container.querySelector('aside[data-panel="left"][data-variant="desktop"]');
    expect(aside?.getAttribute('data-open')).toBe('true');

    act(() => {
      useUiShellStore.getState().setLeftPanelOpen(false);
    });
    rerender(wrap(<LeftPanel />));
    expect(
      container
        .querySelector('aside[data-panel="left"][data-variant="desktop"]')
        ?.getAttribute('data-open')
    ).toBe('false');
  });

  it('RightPanel reflects open/closed state in data attribute', () => {
    const { container, rerender } = render(wrap(<RightPanel />));
    const aside = container.querySelector('aside[data-panel="right"][data-variant="desktop"]');
    expect(aside?.getAttribute('data-open')).toBe('true');

    act(() => {
      useUiShellStore.getState().setRightPanelOpen(false);
    });
    rerender(wrap(<RightPanel />));
    expect(
      container
        .querySelector('aside[data-panel="right"][data-variant="desktop"]')
        ?.getAttribute('data-open')
    ).toBe('false');
  });
});


