export const money = (n: number) => `₱${n.toLocaleString('en-PH')}`;

export const today = () => new Date().toLocaleDateString('en-CA'); // yyyy-mm-dd, local time

export const fmtDate = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** Days from today until the given date (negative if in the past). */
export const daysUntil = (iso: string) =>
  Math.round((new Date(`${iso}T00:00`).getTime() - new Date(`${today()}T00:00`).getTime()) / 864e5);

export const byDate = (a: { date: string; time: string }, b: { date: string; time: string }) =>
  (a.date + a.time).localeCompare(b.date + b.time);