import { AddObjectSection } from '../panels/AddObjectSection';
import { EnvironmentSection } from '../panels/EnvironmentSection';
import { ObjectList } from '../panels/ObjectList';

export function LeftPanel() {
  return (
    <aside className="w-60 bg-panel border-r border-border-subtle flex flex-col">
      <EnvironmentSection />
      <AddObjectSection />
      <div className="flex-1 overflow-hidden">
        <ObjectList />
      </div>
    </aside>
  );
}

