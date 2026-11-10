const TONES = {
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-sky-100 text-sky-800',
  gray: 'bg-gray-100 text-gray-700',
  maroon: 'bg-gym-maroon text-white',
};
export type Tone = keyof typeof TONES;

const BY_VALUE: Record<string, Tone> = {
  ACTIVE: 'green', EXPIRED: 'amber', DISABLED: 'gray',
  PENDING: 'amber', ACCEPTED: 'blue', DECLINED: 'red', COMPLETED: 'green', NOT_HELD: 'red',
  BASIC: 'gray', PREMIUM: 'blue', VIP: 'maroon',
  FOLLOW_UP: 'red', WATCH: 'amber', POSITIVE: 'green',
};

const normalize = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'name' in v) return String((v as { name: unknown }).name ?? '');
  return v == null ? '' : String(v);
};

export const pretty = (v: unknown) => {
  const s = normalize(v).replace(/_/g, ' ').toLowerCase();
  return s ? s[0].toUpperCase() + s.slice(1) : '';
};

export function Badge({ value, label, tone }: { value: string; label?: string; tone?: Tone }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${TONES[tone ?? BY_VALUE[normalize(value).toUpperCase()] ?? 'gray']}`}>
      {label ?? pretty(value)}
    </span>
  );
}