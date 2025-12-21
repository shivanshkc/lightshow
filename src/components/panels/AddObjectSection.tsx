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

  const handleAddCylinder = () => {
    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'cylinder' });
  };

  const handleAddCone = () => {
    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'cone' });
  };

  const handleAddTorus = () => {
    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'torus' });
  };

  const handleAddCapsule = () => {
    kernel.dispatch({ v: 1, type: 'object.add', primitive: 'capsule' });
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
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleAddSphere}
          variant="secondary"
          disabled={atLimit}
        >
          <Circle className="w-4 h-4 mr-2" />
          Sphere
        </Button>
        <Button
          onClick={handleAddCuboid}
          variant="secondary"
          disabled={atLimit}
        >
          <Box className="w-4 h-4 mr-2" />
          Cuboid
        </Button>

        <Button onClick={handleAddCylinder} variant="secondary" disabled={atLimit}>
          {/* No dedicated icon selected yet; use Circle fallback per PRP */}
          <Circle className="w-4 h-4 mr-2" />
          Cylinder
        </Button>
        <Button onClick={handleAddCone} variant="secondary" disabled={atLimit}>
          {/* No dedicated icon selected yet; use Circle fallback per PRP */}
          <Circle className="w-4 h-4 mr-2" />
          Cone
        </Button>
        <Button onClick={handleAddTorus} variant="secondary" disabled={atLimit}>
          {/* No dedicated icon selected yet; use Circle fallback per PRP */}
          <Circle className="w-4 h-4 mr-2" />
          Torus
        </Button>
        <Button onClick={handleAddCapsule} variant="secondary" disabled={atLimit}>
          {/* No dedicated icon selected yet; use Circle fallback per PRP */}
          <Circle className="w-4 h-4 mr-2" />
          Capsule
        </Button>
      </div>
    </div>
  );
}

