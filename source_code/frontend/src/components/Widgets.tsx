import type { ReactNode } from 'react';

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="font-display text-5xl font-extrabold leading-none mt-2">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
    </div>
  );
}

export function BarList({ items }: { items: { label: string; value: number; display?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">{i.label}</span>
            <span className="text-gray-600">{i.display ?? i.value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gym-crimson rounded-full" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const Loading = () => <p role="status" className="text-gray-500 py-8">Loading…</p>;

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error' | 'success'; children: ReactNode }) {
  const styles = {
    info: 'bg-sky-50 border-sky-500 text-sky-900',
    warn: 'bg-amber-50 border-amber-500 text-amber-900',
    error: 'bg-red-50 border-gym-crimson text-red-800',
    success: 'bg-emerald-50 border-emerald-500 text-emerald-900',
  };
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`border-l-4 rounded p-4 mb-4 text-sm ${styles[tone]}`}>{children}</div>;
}