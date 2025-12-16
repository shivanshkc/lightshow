import { useSceneStore } from '../../store/sceneStore';
import { TransformSection } from '../panels/TransformSection';
import { MaterialSection } from '../panels/MaterialSection';
import { ActionSection } from '../panels/ActionSection';

export function RightPanel() {
  const selectedObject = useSceneStore((state) => state.getSelectedObject());

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

