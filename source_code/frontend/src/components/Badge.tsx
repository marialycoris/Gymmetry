import { BY_VALUE, normalize, pretty, TONES, type Tone } from './badgeUtils';

export function Badge({ value, label, tone }: { value: string; label?: string; tone?: Tone }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${TONES[tone ?? BY_VALUE[normalize(value).toUpperCase()] ?? 'gray']}`}>
      {label ?? pretty(value)}
    </span>
  );
}
