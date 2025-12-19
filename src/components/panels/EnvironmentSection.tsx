import { useKernel, useKernelSceneSnapshot } from '@adapters';
import { Button } from '../ui/Button';
import { ColorPicker } from '../ui/ColorPicker';

const PRESETS: Array<{
  id: 'day' | 'dusk' | 'night';
  label: string;
}> = [
  { id: 'day', label: 'Day' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'night', label: 'Night' },
];

export function EnvironmentSection() {
  const kernel = useKernel();
  const snap = useKernelSceneSnapshot();

  return (
    <div className="p-3 border-b border-border-subtle">
      <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Environment
      </h2>

      <div className="flex gap-2 mb-3">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => kernel.dispatch({ v: 1, type: 'environment.background.preset', preset: p.id })}
            title={`Set background preset: ${p.label}`}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <ColorPicker
        label="Background Color"
        value={snap.backgroundColor}
        onChange={(color) => kernel.dispatch({ v: 1, type: 'environment.background.set', color })}
      />
    </div>
  );
}


