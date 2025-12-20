import { AddObjectSection } from '../panels/AddObjectSection';
import { EnvironmentSection } from '../panels/EnvironmentSection';
import { ObjectList } from '../panels/ObjectList';
import { useUiShellStore } from './uiShellStore';

export function LeftPanel() {
  const isOpen = useUiShellStore((s) => s.isLeftPanelOpen);

  return (
    <aside
      data-open={isOpen ? 'true' : 'false'}
      className={`
        fixed left-3 top-3 bottom-12 z-40
        w-[280px]
        bg-panel/95 border border-border-subtle
        shadow-[0_10px_30px_rgba(0,0,0,0.45)]
        rounded-xl
        flex flex-col overflow-hidden
        transition-[transform,opacity] duration-200 ease-out
        ${isOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-3 pointer-events-none'}
      `}
    >
      <EnvironmentSection />
      <AddObjectSection />
      <div className="flex-1 overflow-hidden">
        <ObjectList />
      </div>
    </aside>
  );
}

