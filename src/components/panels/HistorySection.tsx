import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useSceneStore } from '../../store/sceneStore';

export function HistorySection() {
  const undo = useSceneStore((s: any) => s.undo);
  const redo = useSceneStore((s: any) => s.redo);
  const canUndo = useSceneStore((s: any) => s.canUndo);
  const canRedo = useSceneStore((s: any) => s.canRedo);

  return (
    <Panel title="History">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled={!canUndo()} onClick={() => undo()}>
          Undo
        </Button>
        <Button variant="secondary" disabled={!canRedo()} onClick={() => redo()}>
          Redo
        </Button>
      </div>
      <div className="mt-2 text-xs text-text-muted">
        Undo/Redo are scene-wide (not per-object).
      </div>
    </Panel>
  );
}


