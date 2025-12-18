import { useCallback } from 'react';
import type { MaterialType } from '@ports';
import type { SceneObjectSnapshot } from '@ports';
import { useKernel } from '@adapters';
import { MATERIAL_TYPES } from '../../core/types';
import { Panel } from '../ui/Panel';
import { Select } from '../ui/Select';
import { ColorPicker } from '../ui/ColorPicker';
import { Slider } from '../ui/Slider';

interface MaterialSectionProps {
  object: SceneObjectSnapshot;
}

export function MaterialSection({ object }: MaterialSectionProps) {
  const kernel = useKernel();

  const handleChange = useCallback(
    (updates: Partial<typeof object.material>) => {
      kernel.dispatch({ v: 1, type: 'material.update', objectId: object.id, material: updates as any });
    },
    [kernel, object.id]
  );

  return (
    <Panel title="Material">
      <div className="space-y-4">
        {/* Material Type Selector */}
        <Select
          label="Type"
          value={object.material.type}
          onChange={(type: MaterialType) => handleChange({ type })}
          options={MATERIAL_TYPES}
        />

        {/* Color (all materials) */}
        <ColorPicker
          label="Color"
          value={object.material.color}
          onChange={(color) => handleChange({ color })}
        />

        {/* Glass-specific: IOR */}
        {object.material.type === 'glass' && (
          <Slider
            label="Index of Refraction (IOR)"
            value={object.material.ior}
            onChange={(ior) => handleChange({ ior })}
            min={1.0}
            max={2.5}
            step={0.05}
          />
        )}

        {/* Light-specific: Intensity */}
        {object.material.type === 'light' && (
          <Slider
            label="Intensity"
            value={object.material.intensity}
            onChange={(intensity) => handleChange({ intensity })}
            min={0.1}
            max={20}
            step={0.1}
          />
        )}

        {/* Material type descriptions */}
        <div className="text-xs text-text-tertiary italic">
          {object.material.type === 'plastic' && 'Matte diffuse surface'}
          {object.material.type === 'metal' && 'Perfectly reflective mirror surface'}
          {object.material.type === 'glass' && 'Transparent with refraction'}
          {object.material.type === 'light' && 'Emits light, illuminates scene'}
        </div>
      </div>
    </Panel>
  );
}
