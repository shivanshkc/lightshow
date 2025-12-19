import { Circle, Box } from 'lucide-react';
import { useKernel, useKernelSceneSnapshot } from '@adapters';
import { Button } from '../ui/Button';
import { LIMITS } from '../../utils/limits';

export function AddObjectSection() {
  const kernel = useKernel();
  const snap = useKernelSceneSnapshot();
  const atLimit = snap.objects.length >= LIMITS.maxObjects;

  const handleAddSphere = () => {
    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'sphere' });
  };

  const handleAddCuboid = () => {
    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'cuboid' });
  };

  return (
    <div className="p-3 border-b border-border-subtle">
      <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Add Object
      </h2>
      {atLimit && (
        <div className="text-xs text-accent-error mb-2">
          Maximum object limit reached ({LIMITS.maxObjects})
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={handleAddSphere}
          className="flex-1"
          variant="secondary"
          disabled={atLimit}
        >
          <Circle className="w-4 h-4 mr-2" />
          Sphere
        </Button>
        <Button
          onClick={handleAddCuboid}
          className="flex-1"
          variant="secondary"
          disabled={atLimit}
        >
          <Box className="w-4 h-4 mr-2" />
          Cuboid
        </Button>
      </div>
    </div>
  );
}

