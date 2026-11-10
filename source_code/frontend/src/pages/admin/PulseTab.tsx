import type { ReactNode } from 'react';
import { Activity, CalendarCheck, ChartPie, TrendingUp, TriangleAlert } from 'lucide-react';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import type { PulseLevel } from '../../lib/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { BarList, Loading, Notice } from '../../components/Widgets';

const GROUPS: { level: PulseLevel; title: string; label: string; icon: ReactNode }[] = [
  { level: 'FOLLOW_UP', title: 'Follow up now', label: 'Follow up', icon: <TriangleAlert className="h-5 w-5" /> },
  { level: 'WATCH', title: 'Keep an eye on', label: 'Watch', icon: <Activity className="h-5 w-5" /> },
  { level: 'POSITIVE', title: 'Doing well', label: 'On track', icon: <CalendarCheck className="h-5 w-5" /> },
];

interface PulseTabProps {
  onOpenMember?: (memberId: number) => void;
}

// Gymmetry Pulse: attendance trends, bookings and membership dates, one insight per member.
export function PulseTab({ onOpenMember }: PulseTabProps = {}) {
  const { data, loading, error } = useAsync(() => api.getPulse());
  if (loading) return <Loading />;
  if (error) return <Notice tone="error">{error}</Notice>;
  const list = data ?? [];

  const count = (level: PulseLevel) => list.filter((i) => i.level === level).length;
  const flagged = list.length - count('POSITIVE');
  const recent = list.reduce((s, i) => s + i.recentVisits, 0);
  const previous = list.reduce((s, i) => s + i.previousVisits, 0);

  return (
    <>
      <p className="text-gray-600 text-justify">
        Pulse compares each active member’s attendance in the last 30 days with their previous 30 days, alongside upcoming bookings and membership expiry, to spot declining participation early and suggest a follow-up.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Engagement overview" icon={<ChartPie className="h-5 w-5" />} headerTone="maroon">
          <BarList items={[
            { label: 'Follow up now', value: count('FOLLOW_UP') },
            { label: 'Keep an eye on', value: count('WATCH') },
            { label: 'Doing well', value: count('POSITIVE') },
          ]} />
          <p className="text-sm text-gray-500 mt-4">{flagged} member{flagged === 1 ? '' : 's'} flagged for follow-up.</p>
        </Card>
        <Card title="Attendance trend (all members)" icon={<TrendingUp className="h-5 w-5" />} headerTone="maroon">
          <BarList items={[
            { label: 'Last 30 days', value: recent },
            { label: 'Previous 30 days', value: previous },
          ]} />
          <p className="text-sm text-gray-500 mt-4">
            {recent === previous ? 'Participation is steady.' : recent > previous ? `Participation is up by ${recent - previous} visits.` : `Participation is down by ${previous - recent} visits.`}
          </p>
        </Card>
      </div>
      {GROUPS.map((g) => {
        const items = list.filter((i) => i.level === g.level);
        return (
          <Card key={g.level} title={`${g.title} (${items.length})`} icon={g.icon} headerTone="maroon">
            {items.length === 0 ? <p className="text-gray-500">No members in this group.</p> : (
              <ul className="divide-y divide-gray-100 -my-3">
                {items.map((i) => (
                  <li key={i.memberId} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenMember?.(i.memberId)}
                        title={`Open ${i.name}'s profile in Members`}
                        className="font-bold text-left rounded hover:text-gym-crimson hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson"
                      >
                        {i.name}
                      </button>
                      <p className="text-sm">{i.signal}</p>
                      <p className="text-sm text-gray-500">{i.detail}</p>
                      <p className="text-sm mt-1"><span className="font-semibold text-gym-crimson">Suggested:</span> {i.suggestion}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {i.recentVisits} visit{i.recentVisits === 1 ? '' : 's'} in last 30 days · {i.previousVisits} previous
                        {i.upcomingBookings > 0 && ` · ${i.upcomingBookings} upcoming`}
                      </p>
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
