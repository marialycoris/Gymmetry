import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import type { PulseLevel } from '../../lib/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Loading, Notice } from '../../components/Widgets';

const GROUPS: { level: PulseLevel; title: string; label: string }[] = [
  { level: 'FOLLOW_UP', title: 'Follow up now', label: 'Follow up' },
  { level: 'WATCH', title: 'Keep an eye on', label: 'Watch' },
  { level: 'POSITIVE', title: 'Doing well', label: 'On track' },
];

// Gymmetry Pulse: one insight per member, built from attendance, bookings and membership status.
export function PulseTab() {
  const { data, loading, error } = useAsync(() => api.getPulse());
  if (loading) return <Loading />;
  if (error) return <Notice tone="error">{error}</Notice>;
  const list = data ?? [];

  return (
    <>
      <p className="text-gray-600 max-w-2xl">
        Pulse compares each active member’s recent attendance, bookings and membership dates to spot drops in participation early, so staff can reach out before a member lapses.
      </p>
      {GROUPS.map((g) => {
        const items = list.filter((i) => i.level === g.level);
        return (
          <Card key={g.level} title={`${g.title} (${items.length})`}>
            {items.length === 0 ? <p className="text-gray-500">No members in this group.</p> : (
              <ul className="divide-y divide-gray-100 -my-3">
                {items.map((i) => (
                  <li key={i.memberId} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{i.name}</p>
                      <p className="text-sm">{i.signal}</p>
                      <p className="text-sm text-gray-500">{i.detail}</p>
                    </div>
                    <Badge value={i.level} label={g.label} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </>
  );
}