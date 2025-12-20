import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useKernel, useKernelSceneSnapshot } from '@adapters';

export function ActionSection() {
  const kernel = useKernel();
  const snap = useKernelSceneSnapshot();

  const hasSelection = snap.selectedObjectId !== null;

  return (
    <Panel title="Actions">
      <div className="mx-auto w-full max-w-[260px] space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            className="w-full justify-center"
            disabled={!hasSelection}
            onClick={() =>
              snap.selectedObjectId &&
              kernel.dispatch({
                v: 1,
                type: 'object.duplicate',
                objectId: snap.selectedObjectId,
              })
            }
          >
            Duplicate
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-center text-accent-error border border-border-default"
            disabled={!hasSelection}
            onClick={() =>
              snap.selectedObjectId &&
              kernel.dispatch({
                v: 1,
                type: 'object.remove',
                objectId: snap.selectedObjectId,
              })
            }
          >
            Delete
          </Button>
        </div>
      </div>
    </Panel>
  );
}


