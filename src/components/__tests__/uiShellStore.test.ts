import { describe, it, expect, beforeEach } from 'vitest';
import { useUiShellStore } from '../layout/uiShellStore';

describe('useUiShellStore', () => {
  beforeEach(() => {
    useUiShellStore.getState().reset();
  });

  it('defaults to desktop panels open and mobile sheet closed', () => {
    const s = useUiShellStore.getState();
    expect(s.isLeftPanelOpen).toBe(true);
    expect(s.isRightPanelOpen).toBe(true);
    expect(s.isMobileSheetOpen).toBe(false);
    expect(s.mobileSheetSide).toBe(null);
  });

  it('toggles desktop panel visibility', () => {
    const s0 = useUiShellStore.getState();
    s0.toggleLeftPanel();
    s0.toggleRightPanel();

    const s1 = useUiShellStore.getState();
    expect(s1.isLeftPanelOpen).toBe(false);
    expect(s1.isRightPanelOpen).toBe(false);
  });

  it('opens and closes mobile sheet', () => {
    useUiShellStore.getState().openMobileSheet('left');
    let s = useUiShellStore.getState();
    expect(s.isMobileSheetOpen).toBe(true);
    expect(s.mobileSheetSide).toBe('left');

    useUiShellStore.getState().closeMobileSheet();
    s = useUiShellStore.getState();
    expect(s.isMobileSheetOpen).toBe(false);
    expect(s.mobileSheetSide).toBe(null);
  });
});


