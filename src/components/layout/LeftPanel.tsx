import { AddObjectSection } from '../panels/AddObjectSection';
import { EnvironmentSection } from '../panels/EnvironmentSection';
import { ObjectList } from '../panels/ObjectList';
import { useUiShellStore } from './uiShellStore';
import { UI_LAYOUT } from './layoutConstants';
import { IconButton } from '../ui/IconButton';
import { X } from 'lucide-react';

export function LeftPanel() {
  const isOpen = useUiShellStore((s) => s.isLeftPanelOpen);
  const isMobileSheetOpen = useUiShellStore((s) => s.isMobileSheetOpen);
  const mobileSheetSide = useUiShellStore((s) => s.mobileSheetSide);
  const closeMobileSheet = useUiShellStore((s) => s.closeMobileSheet);
  const isSheetOpen = isMobileSheetOpen && mobileSheetSide === 'left';

  return (
    <>
      {/* Desktop floating panel */}
      <aside
        data-panel="left"
        data-variant="desktop"
        data-open={isOpen ? 'true' : 'false'}
        className={`
          hidden lg:flex
          fixed left-3 top-3 bottom-12 z-40
          w-[280px]
          bg-panel/95 border border-border-subtle
          shadow-[0_10px_30px_rgba(0,0,0,0.45)]
          rounded-xl
          flex-col overflow-hidden
          transition-[transform,opacity] duration-200 ease-out
          ${isOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-[calc(100%+0.75rem)] pointer-events-none'}
        `}
        style={{ width: UI_LAYOUT.leftPanelWidthPx }}
      >
        <EnvironmentSection />
        <AddObjectSection />
        <div className="flex-1 overflow-hidden">
          <ObjectList />
        </div>
      </aside>

      {/* Mobile bottom sheet */}
      <aside
        data-panel="left"
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
            Scene
          </div>
          <IconButton
            aria-label="Close Scene Sheet"
            title="Close"
            variant="ghost"
            size="sm"
            icon={<X className="w-4 h-4" />}
            onClick={closeMobileSheet}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pb-6">
          <EnvironmentSection />
          <AddObjectSection />
          <ObjectList />
        </div>
      </aside>
    </>
  );
}

