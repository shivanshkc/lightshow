import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { Kernel } from '@kernel';
import type { SceneSnapshot } from '@ports';
import { KernelShell } from '@kernel';
import { V1ZustandBackingStore } from '../v1/V1ZustandBackingStore';
import { DomKeyboardController } from '../input/DomKeyboardController';

type KernelContextValue = {
  kernel: Kernel;
};

const KernelContext = createContext<KernelContextValue | null>(null);

export function KernelProvider({
  children,
  kernel: providedKernel,
}: {
  children: React.ReactNode;
  /** Optional injection for tests / alternate startup wiring. */
  kernel?: Kernel;
}) {
  const kernel = useMemo(
    () => providedKernel ?? new KernelShell(new V1ZustandBackingStore()),
    [providedKernel]
  );

  // Global DOM keyboard listener (temporary wiring; will be generalized as InputController(s)).
  useEffect(() => {
    const keyboard = new DomKeyboardController(kernel);
    keyboard.attach();
    return () => keyboard.detach();
  }, [kernel]);

  return <KernelContext.Provider value={{ kernel }}>{children}</KernelContext.Provider>;
}

export function useKernel(): Kernel {
  const ctx = useContext(KernelContext);
  if (!ctx) throw new Error('useKernel must be used within <KernelProvider>');
  return ctx.kernel;
}

export function useKernelSceneSnapshot(): SceneSnapshot {
  const kernel = useKernel();
  return useSyncExternalStore(
    (onStoreChange) => kernel.events.subscribe(() => onStoreChange()),
    () => kernel.queries.getSceneSnapshot(),
    () => kernel.queries.getSceneSnapshot()
  );
}


