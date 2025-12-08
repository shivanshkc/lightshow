import { ReactNode } from 'react';

interface PanelProps {
  title: string;
  children: ReactNode;
}

export function Panel({ title, children }: PanelProps) {
  return (
    <div className="border-b border-border-subtle">
      <h3 className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider bg-panel-secondary">
        {title}
      </h3>
      <div className="p-3">{children}</div>
    </div>
  );
}

