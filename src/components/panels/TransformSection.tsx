import { useCallback } from 'react';
import type { SceneObjectSnapshot } from '@ports';
import { useKernel } from '@adapters';
import { Panel } from '../ui/Panel';
import { Vec3Input } from '../ui/Vec3Input';
import { NumberInput } from '../ui/NumberInput';

interface TransformSectionProps {
  object: SceneObjectSnapshot;
}

export function TransformSection({ object }: TransformSectionProps) {
  const kernel = useKernel();

  const handlePositionChange = useCallback(
    (position: [number, number, number]) => {
      kernel.dispatch({ v: 1, type: 'transform.update', objectId: object.id, transform: { position } });
    },
    [kernel, object.id]
  );

  const handleRotationChange = useCallback(
    (rotationDegrees: [number, number, number]) => {
      // Convert degrees to radians for storage
      kernel.dispatch({
        v: 1,
        type: 'transform.update',
        objectId: object.id,
        transform: {
          rotation: rotationDegrees.map((d) => (d * Math.PI) / 180) as [number, number, number],
        },
      });
    },
    [kernel, object.id]
  );

  const handleScaleChange = useCallback(
    (scale: [number, number, number]) => {
      // For spheres, enforce uniform scale
      if (object.type === 'sphere') {
        const uniform = scale[0];
        kernel.dispatch({
          v: 1,
          type: 'transform.update',
          objectId: object.id,
          transform: { scale: [uniform, uniform, uniform] },
        });
      } else {
        kernel.dispatch({ v: 1, type: 'transform.update', objectId: object.id, transform: { scale } });
      }
    },
    [kernel, object.id, object.type]
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
