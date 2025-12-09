import { useCallback } from 'react';
import { SceneObject } from '../../core/types';
import { useSceneStore } from '../../store/sceneStore';
import { Panel } from '../ui/Panel';
import { Vec3Input } from '../ui/Vec3Input';
import { NumberInput } from '../ui/NumberInput';

interface TransformSectionProps {
  object: SceneObject;
}

export function TransformSection({ object }: TransformSectionProps) {
  const updateTransform = useSceneStore((state) => state.updateTransform);

  const handlePositionChange = useCallback(
    (position: [number, number, number]) => {
      updateTransform(object.id, { position });
    },
    [object.id, updateTransform]
  );

  const handleRotationChange = useCallback(
    (rotationDegrees: [number, number, number]) => {
      // Convert degrees to radians for storage
      updateTransform(object.id, {
        rotation: rotationDegrees.map((d) => (d * Math.PI) / 180) as [
          number,
          number,
          number,
        ],
      });
    },
    [object.id, updateTransform]
  );

  const handleScaleChange = useCallback(
    (scale: [number, number, number]) => {
      // For spheres, enforce uniform scale
      if (object.type === 'sphere') {
        const uniform = scale[0];
        updateTransform(object.id, { scale: [uniform, uniform, uniform] });
      } else {
        updateTransform(object.id, { scale });
      }
    },
    [object.id, object.type, updateTransform]
  );

  // Convert radians to degrees for display
  const rotationDegrees: [number, number, number] = [
    (object.transform.rotation[0] * 180) / Math.PI,
    (object.transform.rotation[1] * 180) / Math.PI,
    (object.transform.rotation[2] * 180) / Math.PI,
  ];

  return (
    <Panel title="Transform">
      <div className="space-y-4">
        <Vec3Input
          label="Position"
          value={object.transform.position}
          onChange={handlePositionChange}
          step={0.1}
        />

        <Vec3Input
          label="Rotation (°)"
          value={rotationDegrees}
          onChange={handleRotationChange}
          step={1}
          precision={1}
        />

        {object.type === 'sphere' ? (
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Radius</label>
            <NumberInput
              value={object.transform.scale[0]}
              onChange={(v) => handleScaleChange([v, v, v])}
              min={0.1}
              step={0.1}
            />
          </div>
        ) : (
          <Vec3Input
            label="Scale"
            value={object.transform.scale}
            onChange={handleScaleChange}
            min={0.1}
            step={0.1}
          />
        )}
      </div>
    </Panel>
  );
}
