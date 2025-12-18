import { useKernelSceneSnapshot } from '@adapters';
import { TransformSection } from '../panels/TransformSection';
import { MaterialSection } from '../panels/MaterialSection';
import { ActionSection } from '../panels/ActionSection';

export function RightPanel() {
  const snap = useKernelSceneSnapshot();
  const selectedObject =
    snap.selectedObjectId === null
      ? null
      : snap.objects.find((o) => o.id === snap.selectedObjectId) ?? null;

  return (
    <aside className="w-72 bg-panel border-l border-border-subtle overflow-y-auto">
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

