import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ConfirmModal } from './ConfirmModal';
import { ConfirmContext, type ConfirmOptions } from '../context/confirmState';

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolver.current = resolve;
    setPending(options);
  }), []);

  const settle = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setPending(null);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const previous = document.body.dataset.confirmOpen;
    document.body.dataset.confirmOpen = 'true';
    return () => {
      if (previous === undefined) delete document.body.dataset.confirmOpen;
      else document.body.dataset.confirmOpen = previous;
    };
  }, [pending]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        isOpen={!!pending}
        onClose={() => settle(false)}
        onConfirm={() => settle(true)}
        title={pending?.title ?? ''}
        message={pending?.message ?? ''}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        variant={pending?.variant}
      />
    </ConfirmContext.Provider>
  );
}
