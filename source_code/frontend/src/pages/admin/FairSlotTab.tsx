import { useState } from 'react';
import { Clock, Inbox, TrendingUp, Users } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { useAsync } from '../../hooks/useAsync';
import { fmtDate, fmtTime } from '../../lib/format';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Table, td } from '../../components/Table';
import { Loading, Notice, Stat } from '../../components/Widgets';

export function FairSlotTab() {
  const toast = useToast();
  const insights = useAsync(() => api.getFairSlotInsights());
  const queue = useAsync(() => api.getWaitlist());
  const [busy, setBusy] = useState<number | null>(null);

  if (insights.loading || queue.loading) return <Loading />;
  const i = insights.data;
  if (!i) return <Notice tone="error">{insights.error || 'Could not load FairSlot insights.'}</Notice>;

  const active = (queue.data ?? [])
    .filter((e) => e.status === 'WAITING' || e.status === 'OFFERED')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const run = async (id: number, action: () => Promise<void>, message: string) => {
    setBusy(id);
    try {
      await action();
      toast.success(message);
      queue.reload();
      insights.reload();
    } catch (x) { toast.error(x instanceof Error ? x.message : 'Something went wrong.'); } finally { setBusy(null); }
  };

  return (
    <>
      {queue.error && <Notice tone="error">{queue.error}</Notice>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active entries" value={i.activeEntries} hint="Waiting or holding an offer" icon={<Inbox className="h-5 w-5" />} />
        <Stat label="Waiting" value={i.waitingEntries} hint="Queued for the next opening" icon={<Clock className="h-5 w-5" />} />
        <Stat label="Offers out" value={i.offeredEntries} hint="Hold for 24 hours, then expire" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Highest demand times" icon={<TrendingUp className="h-5 w-5" />} headerTone="maroon">
          <Table
            headers={['Slot', 'Waiting', 'Total requests']}
            isEmpty={i.topSlots.length === 0}
            emptyText="No waitlist demand yet."
          >
            {i.topSlots.map((s) => (
              <tr key={`${s.date}-${s.time}`}>
                <td className={td}>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></td>
                <td className={`${td} font-semibold`}>{s.waiting}</td>
                <td className={td}>{s.total}</td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="Trainers with demand" icon={<Users className="h-5 w-5" />} headerTone="maroon">
          <Table
            headers={['Trainer', 'Waiting', 'Total requests']}
            isEmpty={i.topTrainers.length === 0}
            emptyText="No trainer demand yet."
          >
            {i.topTrainers.map((t) => (
              <tr key={t.trainerId}>
                <td className={`${td} font-semibold`}>{t.name}</td>
                <td className={td}>{t.waiting}</td>
                <td className={td}>{t.total}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <Card title="Active waitlist" icon={<Inbox className="h-5 w-5" />} headerTone="maroon">
        <p className="mb-4 text-sm text-gray-500">
          Offers automatically expire after 24 hours and pass to the next member. Claim an offer for a member or remove an entry that is no longer needed.
        </p>
        <Table
          headers={['Member', 'Trainer', 'Slot', 'Status', 'Position', 'Offer expires', 'Action']}
          isEmpty={active.length === 0}
          emptyText="No one is waiting right now."
          pageSize={6}
          itemLabel="entries"
        >
          {active.map((e) => (
            <tr key={e.id}>
              <td className={`${td} font-semibold`}>{e.memberName}</td>
              <td className={td}>{e.trainerName}</td>
              <td className={td}>{fmtDate(e.date)}<span className="block text-xs text-gray-500">{fmtTime(e.time)}</span></td>
              <td className={td}><Badge value={e.status} /></td>
              <td className={td}>#{e.position}</td>
              <td className={td}>{e.offerExpiresAt ? new Date(e.offerExpiresAt).toLocaleString() : '—'}</td>
              <td className={td}>
                <div className="flex items-center justify-center gap-2">
                  {e.status === 'OFFERED' && (
                    <Button size="sm" isLoading={busy === e.id}
                      onClick={() => run(e.id, () => api.claimWaitlist(e.id), `Booked ${e.memberName}'s offer.`)}>
                      Claim
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" disabled={busy === e.id}
                    onClick={() => run(e.id, () => api.cancelWaitlist(e.id), `Removed ${e.memberName} from the waitlist.`)}>
                    Remove
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
