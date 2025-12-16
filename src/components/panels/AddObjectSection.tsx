import { Circle, Box } from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { Button } from '../ui/Button';
import { LIMITS } from '../../utils/limits';

export function AddObjectSection() {
  const { addSphere, addCuboid, selectObject, objects } = useSceneStore();
  const atLimit = objects.length >= LIMITS.maxObjects;

  const handleAddSphere = () => {
    const id = addSphere();
    if (id) selectObject(id);
  };

  const handleAddCuboid = () => {
    const id = addCuboid();
    if (id) selectObject(id);
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

