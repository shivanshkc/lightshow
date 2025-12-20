import { useKernelSceneSnapshot } from '@adapters';
import { TransformSection } from '../panels/TransformSection';
import { MaterialSection } from '../panels/MaterialSection';
import { ActionSection } from '../panels/ActionSection';
import { useUiShellStore } from './uiShellStore';
import { UI_LAYOUT } from './layoutConstants';
import { IconButton } from '../ui/IconButton';
import { X } from 'lucide-react';

export function RightPanel() {
  const snap = useKernelSceneSnapshot();
  const isOpen = useUiShellStore((s) => s.isRightPanelOpen);
  const isMobileSheetOpen = useUiShellStore((s) => s.isMobileSheetOpen);
  const mobileSheetSide = useUiShellStore((s) => s.mobileSheetSide);
  const closeMobileSheet = useUiShellStore((s) => s.closeMobileSheet);
  const isSheetOpen = isMobileSheetOpen && mobileSheetSide === 'right';
  const selectedObject =
    snap.selectedObjectId === null
      ? null
      : snap.objects.find((o) => o.id === snap.selectedObjectId) ?? null;

  return (
    <>
      {/* Desktop floating panel */}
      <aside
        data-panel="right"
        data-variant="desktop"
        data-open={isOpen ? 'true' : 'false'}
        className={`
          hidden lg:block
          fixed right-3 top-3 bottom-12 z-40
          w-[320px]
          bg-panel/95 border border-border-subtle
          shadow-[0_10px_30px_rgba(0,0,0,0.45)]
          rounded-xl
          overflow-y-auto
          transition-[transform,opacity] duration-200 ease-out
          ${isOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-[calc(100%+0.75rem)] pointer-events-none'}
        `}
        style={{ width: UI_LAYOUT.rightPanelWidthPx }}
      >
        {selectedObject ? (
          <>
            <TransformSection object={selectedObject} />
            <MaterialSection object={selectedObject} />
            <ActionSection />
          </>
        ) : (
          <div className="p-4 text-text-secondary text-sm">
            Select an object to view properties
          </div>
        )}
      </aside>

      {/* Mobile bottom sheet */}
      <aside
        data-panel="right"
        data-variant="mobile"
        data-open={isSheetOpen ? 'true' : 'false'}
        className={`
          lg:hidden
          fixed left-0 right-0 bottom-0 z-50
          bg-panel/95 border-t border-border-subtle
          shadow-[0_-10px_30px_rgba(0,0,0,0.45)]
          rounded-t-2xl
          overflow-hidden flex flex-col
          transition-[transform,opacity] duration-200 ease-out
          ${isSheetOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-6 pointer-events-none'}
        `}
        style={{ top: 80 }}
      >
        <div className="px-3 py-2 bg-panel-secondary flex items-center justify-between">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Properties
          </div>
          <IconButton
            aria-label="Close Properties Sheet"
            title="Close"
            variant="ghost"
            size="sm"
            icon={<X className="w-4 h-4" />}
            onClick={closeMobileSheet}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pb-6">
          {selectedObject ? (
            <>
              <TransformSection object={selectedObject} />
              <MaterialSection object={selectedObject} />
              <ActionSection />
            </>
          ) : (
            <div className="p-4 text-text-secondary text-sm">
              Select an object to view properties
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

