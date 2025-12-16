import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useSceneStore } from '../../store/sceneStore';

export function ActionSection() {
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const duplicateObject = useSceneStore((s) => s.duplicateObject);
  const removeObject = useSceneStore((s) => s.removeObject);
  const updateTransform = useSceneStore((s) => s.updateTransform);

  if (!selectedObjectId) return null;

  return (
    <Panel title="Actions">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={() => duplicateObject(selectedObjectId)}
        >
          Duplicate
        </Button>
        <Button
          variant="secondary"
          className="text-accent-error border border-border-default"
          onClick={() => removeObject(selectedObjectId)}
        >
          Delete
        </Button>
        <Button
          variant="secondary"
          className="col-span-2"
          onClick={() =>
            updateTransform(selectedObjectId, {
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


