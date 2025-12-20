import { useKernelSceneSnapshot } from '@adapters';
import { TransformSection } from '../panels/TransformSection';
import { MaterialSection } from '../panels/MaterialSection';
import { ActionSection } from '../panels/ActionSection';
import { useUiShellStore } from './uiShellStore';

export function RightPanel() {
  const snap = useKernelSceneSnapshot();
  const isOpen = useUiShellStore((s) => s.isRightPanelOpen);
  const selectedObject =
    snap.selectedObjectId === null
      ? null
      : snap.objects.find((o) => o.id === snap.selectedObjectId) ?? null;

  return (
    <aside
      data-open={isOpen ? 'true' : 'false'}
      className={`
        fixed right-3 top-3 bottom-12 z-40
        w-[320px]
        bg-panel/95 border border-border-subtle
        shadow-[0_10px_30px_rgba(0,0,0,0.45)]
        rounded-xl
        overflow-y-auto
        transition-[transform,opacity] duration-200 ease-out
        ${isOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-3 pointer-events-none'}
      `}
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
  );
}

