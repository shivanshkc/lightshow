import { create } from 'zustand';

export type UiSheetSide = 'left' | 'right';

export interface UiShellState {
  /** Desktop: floating left panel visibility */
  isLeftPanelOpen: boolean;
  /** Desktop: floating right panel visibility */
  isRightPanelOpen: boolean;

  /** Mobile: bottom sheet open/closed (exclusive by UX, enforced by UI) */
  isMobileSheetOpen: boolean;
  /** Mobile: which sheet is open when isMobileSheetOpen is true */
  mobileSheetSide: UiSheetSide | null;

  /** Actions */
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;

  openMobileSheet: (side: UiSheetSide) => void;
  closeMobileSheet: () => void;

  /** Test/support */
  reset: () => void;
}

const DEFAULT_STATE: Pick<
  UiShellState,
  'isLeftPanelOpen' | 'isRightPanelOpen' | 'isMobileSheetOpen' | 'mobileSheetSide'
> = {
  // Desktop requirement: both floating panels open by default.
  isLeftPanelOpen: true,
  isRightPanelOpen: true,

  // Mobile requirement: sheets are closed by default.
  isMobileSheetOpen: false,
  mobileSheetSide: null,
};

export const useUiShellStore = create<UiShellState>((set, get) => ({
  ...DEFAULT_STATE,

  setLeftPanelOpen: (open) => set({ isLeftPanelOpen: open }),
  setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),
  toggleLeftPanel: () => set({ isLeftPanelOpen: !get().isLeftPanelOpen }),
  toggleRightPanel: () => set({ isRightPanelOpen: !get().isRightPanelOpen }),

  openMobileSheet: (side) => set({ isMobileSheetOpen: true, mobileSheetSide: side }),
  closeMobileSheet: () => set({ isMobileSheetOpen: false, mobileSheetSide: null }),

  reset: () => set({ ...DEFAULT_STATE }),
}));


