import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, X, type LucideIcon } from 'lucide-react';
import { ToastContext, type Toast, type ToastTone } from './toastState';

const TOAST_STYLES: Record<ToastTone, { border: string; icon: string; label: string; Icon: LucideIcon }> = {
  success: {
    border: 'border-emerald-500',
    icon: 'bg-emerald-100 text-emerald-700',
    label: 'Success',
    Icon: CircleCheck,
  },
  error: {
    border: 'border-gym-crimson',
    icon: 'bg-red-100 text-gym-crimson',
    label: 'Error',
    Icon: CircleAlert,
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { border, icon, label, Icon } = TOAST_STYLES[toast.tone];

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 bg-white p-4 shadow-2xl ring-1 ring-black/5 ${border}`}
    >
      <span className={`shrink-0 rounded-full p-1.5 ${icon}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gym-black">{label}</p>
        <p className="mt-0.5 text-sm leading-snug text-gray-700">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gym-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, tone, message }]);
    timers.current.set(id, setTimeout(() => dismiss(id), 4500));
  }, [dismiss]);

  const success = useCallback((message: string) => push('success', message), [push]);
  const error = useCallback((message: string) => push('error', message), [push]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ success, error, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-4 right-4 z-[60] ml-auto flex max-w-sm flex-col gap-3 sm:bottom-6 sm:right-6"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
