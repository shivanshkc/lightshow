import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useSceneStore } from '../../store/sceneStore';

export function ActionSection() {
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const duplicateSelected = useSceneStore((s) => s.duplicateSelected);
  const deleteSelected = useSceneStore((s) => s.deleteSelected);
  const updateTransform = useSceneStore((s) => s.updateTransform);

  const hasSelection = selectedObjectId !== null;

  return (
    <Panel title="Actions">
      <div className="mx-auto w-full max-w-[260px] space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            className="w-full justify-center"
            disabled={!hasSelection}
            onClick={() => duplicateSelected()}
          >
            Duplicate
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-center text-accent-error border border-border-default"
            disabled={!hasSelection}
            onClick={() => deleteSelected()}
          >
            Delete
          </Button>
        </div>

        <Button
          variant="secondary"
          className="w-full justify-center"
          disabled={!hasSelection}
          onClick={() =>
            updateTransform(selectedObjectId!, {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            })
          }
        >
          Reset Transform
        </Button>
      </div>
    </Panel>
  );
}


