import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useSceneStore } from '../../store/sceneStore';

export function ActionSection() {
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const duplicateSelected = useSceneStore((s) => s.duplicateSelected);
  const deleteSelected = useSceneStore((s) => s.deleteSelected);
  const updateTransform = useSceneStore((s) => s.updateTransform);

  const undo = useSceneStore((s: any) => s.undo);
  const redo = useSceneStore((s: any) => s.redo);
  const canUndo = useSceneStore((s: any) => s.canUndo);
  const canRedo = useSceneStore((s: any) => s.canRedo);

  const hasSelection = selectedObjectId !== null;

  return (
    <Panel title="Actions">
      <div className="space-y-3">
        <Button
          variant="secondary"
          disabled={!hasSelection}
          onClick={() => duplicateSelected()}
        >
          Duplicate
        </Button>
        <Button
          variant="secondary"
          className="text-accent-error border border-border-default"
          disabled={!hasSelection}
          onClick={() => deleteSelected()}
        >
          Delete
        </Button>
        <Button
          variant="secondary"
          className="col-span-2"
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

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle">
          <Button variant="ghost" disabled={!canUndo()} onClick={() => undo()}>
            Undo
          </Button>
          <Button variant="ghost" disabled={!canRedo()} onClick={() => redo()}>
            Redo
          </Button>
        </div>
      </div>
    </Panel>
  );
}


