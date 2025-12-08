import { Circle, Box } from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { Button } from '../ui/Button';

export function AddObjectSection() {
  const { addSphere, addCuboid, selectObject } = useSceneStore();

  const handleAddSphere = () => {
    const id = addSphere();
    selectObject(id);
  };

  const handleAddCuboid = () => {
    const id = addCuboid();
    selectObject(id);
  };

  return (
    <div className="p-3 border-b border-border-subtle">
      <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Add Object
      </h2>
      <div className="flex gap-2">
        <Button onClick={handleAddSphere} className="flex-1" variant="secondary">
          <Circle className="w-4 h-4 mr-2" />
          Sphere
        </Button>
        <Button onClick={handleAddCuboid} className="flex-1" variant="secondary">
          <Box className="w-4 h-4 mr-2" />
          Cuboid
        </Button>
      </div>
    </div>
  );
}

