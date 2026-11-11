import { useState } from 'react';
import { CalendarDays, ClipboardCheck, Inbox, TriangleAlert } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { usePersistentTab } from '../../hooks/usePersistentTab';
import { byDate, fmtDate, fmtTime, today } from '../../lib/format';
import { AppShell, type NavItem } from '../../components/AppShell';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { Table, td } from '../../components/Table';
import { BarChart, DonutChart } from '../../components/Charts';
import { Loading, Notice, Stat } from '../../components/Widgets';
import type { Session } from '../../lib/types';

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Requests' },
  { id: 'schedule', label: 'My schedule' },
  { id: 'attendance', label: 'Attendance' },
];

const When = ({ s }: { s: Session }) => (
  <>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></>
);

const shortDate = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

const sessionsPerDay = (sessions: Session[]) => {
  const counts = new Map<string, number>();
  for (const s of sessions) counts.set(s.date, (counts.get(s.date) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 6)
    .map(([date, value]) => ({ label: shortDate(date), value, color: '#F21137' }));
};

function Overview({ go, pending, upcoming, record }: { go: (id: string) => void; pending: Session[]; upcoming: Session[]; record: Session[] }) {
  const seeMore = (id: string) => <Button size="sm" variant="ghost" onClick={() => go(id)}>See more</Button>;
  const held = record.filter((s) => s.status === 'COMPLETED').length;
  const notHeld = record.filter((s) => s.status === 'NOT_HELD').length;
  const declined = record.filter((s) => s.status === 'DECLINED').length;
  const dueToday = upcoming.filter((s) => s.date === today()).length;
  const next = upcoming[0];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Requests waiting" value={pending.length} hint="Waiting for your response" icon={<Inbox className="h-5 w-5" />} />
        <Stat label="Scheduled" value={upcoming.length} hint="Accepted sessions ahead" icon={<CalendarDays className="h-5 w-5" />} />
        <Stat label="Sessions held" value={held} icon={<ClipboardCheck className="h-5 w-5" />} />
        <Stat label="Absences" value={notHeld} hint="Flagged at midnight" icon={<TriangleAlert className="h-5 w-5" />} />
      </div>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Session requests" icon={<Inbox className="h-5 w-5" />} headerTone="maroon" action={seeMore('requests')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col">
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No requests waiting for you.</p>
          ) : (
            <>
              <ul className="space-y-4">
                {pending.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => go('requests')}
                      title={`Respond to ${s.memberName}'s request in Requests`}
                      className="font-semibold text-left rounded hover:text-gym-crimson hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson"
                    >
                      {s.memberName}
                    </button>
                    <span className="block text-xs text-gray-500">{fmtDate(s.date)} at {fmtTime(s.time)}</span>
                  </li>
                ))}
              </ul>
              {pending.length > 3 && <p className="mt-4 text-xs text-gray-500">+{pending.length - 3} more waiting.</p>}
            </>
          )}
        </Card>
        <Card title="Upcoming schedule" icon={<CalendarDays className="h-5 w-5" />} headerTone="maroon" action={seeMore('schedule')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Nothing scheduled. Accept a request to see it here.</p>
          ) : (
            <>
              <BarChart items={sessionsPerDay(upcoming)} />
              <p className="mt-4 text-center text-sm text-gray-500">
                {upcoming.length} session{upcoming.length > 1 ? 's' : ''} ahead · next: {next.memberName}, {fmtDate(next.date)} at {fmtTime(next.time)}.
              </p>
            </>
          )}
        </Card>
        <Card title="Attendance record" icon={<ClipboardCheck className="h-5 w-5" />} headerTone="maroon" action={seeMore('attendance')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          {record.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Completed and declined sessions will show up here.</p>
          ) : (
            <>
              <DonutChart
                items={[
                  { label: 'Held', value: held, color: '#F21137' },
                  { label: 'Not held', value: notHeld, color: '#68020F' },
                  { label: 'Declined', value: declined, color: '#FB7185' },
                ]}
                centerValue={record.length}
                centerLabel="sessions"
              />
              {held + notHeld > 0 && (
                <p className="mt-4 text-center text-sm text-gray-500">Attendance rate: {Math.round((held / (held + notHeld)) * 100)}%.</p>
              )}
            </>
          )}
        </Card>
      </div>

      <Card title="Needs your attention" icon={<TriangleAlert className="h-5 w-5" />} headerTone="maroon">
        <ul className="space-y-4">
          <li className="flex items-center justify-between gap-4">
            <span>{pending.length === 0 ? 'No requests waiting for a response.' : `${pending.length} request${pending.length > 1 ? 's' : ''} waiting for a response.`}</span>
            {pending.length > 0 && <Button size="sm" variant="secondary" onClick={() => go('requests')}>View</Button>}
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>{dueToday === 0 ? 'No sessions due today.' : `${dueToday} session${dueToday > 1 ? 's' : ''} today — mark them completed when done.`}</span>
            {dueToday > 0 && <Button size="sm" variant="secondary" onClick={() => go('schedule')}>View</Button>}
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>{notHeld === 0 ? 'No absences on your record.' : `${notHeld} session${notHeld > 1 ? 's' : ''} flagged “Not held” as absences.`}</span>
            {notHeld > 0 && <Button size="sm" variant="secondary" onClick={() => go('attendance')}>View</Button>}
          </li>
        </ul>
      </Card>
    </>
  );
}

export function TrainerDashboard() {
  const { user } = useAuth();
  const trainerId = user!.personId;
  const [tab, setTab] = usePersistentTab('gymmetry_trainer_tab', 'overview', NAV.map((n) => n.id));
  const sessions = useAsync(() => api.getSessions({ trainerId }), [trainerId]);
  const [err, setErr] = useState('');
  const [declining, setDeclining] = useState<Session | null>(null);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [completing, setCompleting] = useState<Session | null>(null);
  const [note, setNote] = useState('');
  const [completeErr, setCompleteErr] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const all = [...(sessions.data ?? [])].sort(byDate);
  const pending = all.filter((s) => s.status === 'PENDING');
  const upcoming = all.filter((s) => s.status === 'ACCEPTED');
  const record = all.filter((s) => ['COMPLETED', 'NOT_HELD', 'DECLINED'].includes(s.status)).reverse();

  const run = async (fn: () => Promise<unknown>, id: string) => {
    setBusyId(id);
    setErr('');
    try { await fn(); sessions.reload(); } catch (x: any) { setErr(x.message); } finally { setBusyId(null); }
  };
  const confirmDecline = async () => {
    if (!reason.trim()) return setReasonErr('Tell the member why you are declining.');
    setBusyId('decline');
    try {
      await api.respondToSession(declining!.id, false, reason);
      setDeclining(null); sessions.reload();
    } catch (x: any) { setReasonErr(x.message); } finally { setBusyId(null); }
  };
  const openDecline = (s: Session) => { setDeclining(s); setReason(''); setReasonErr(''); };
  const openComplete = (s: Session) => { setCompleting(s); setNote(''); setCompleteErr(''); };
  const confirmComplete = async () => {
    if (!completing) return;
    setBusyId('complete');
    setCompleteErr('');
    try {
      await api.completeSession(completing.id, note);
      setCompleting(null); sessions.reload();
    } catch (x) { setCompleteErr(x instanceof Error ? x.message : String(x)); } finally { setBusyId(null); }
  };

  return (
    <AppShell nav={NAV} active={tab} onNavigate={setTab}>
      {(sessions.error || err) && <Notice tone="error">{sessions.error || err}</Notice>}
      {sessions.loading ? <Loading /> : (
        <>
          {tab === 'overview' && <Overview go={setTab} pending={pending} upcoming={upcoming} record={record} />}
          {tab === 'requests' && (
            <Card title={`Session requests (${pending.length})`} headerTone="maroon">
              <Table headers={['When', 'Member', '']} isEmpty={pending.length === 0} emptyText="No requests waiting for you.">
                {pending.map((s) => (
                  <tr key={s.id}>
                    <td className={td}><When s={s} /></td>
                    <td className={`${td} font-semibold`}>{s.memberName}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      <Button
                        size="sm"
                        isLoading={busyId === `accept-${s.id}`}
                        disabled={busyId !== null && busyId !== `accept-${s.id}`}
                        onClick={() => run(() => api.respondToSession(s.id, true), `accept-${s.id}`)}
                      >Accept</Button>{' '}
                      <Button size="sm" variant="secondary" disabled={busyId !== null} onClick={() => openDecline(s)}>Decline</Button>
                    </td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}

          {tab === 'schedule' && (
            <>
              <Notice tone="warn">Mark each session as completed on the day. Sessions still unmarked at midnight are flagged “Not held” and count as an absence for you.</Notice>
              <Card title="Accepted sessions" headerTone="maroon">
                <Table headers={['When', 'Member', '']} isEmpty={upcoming.length === 0} emptyText="Nothing scheduled. Accept a request to see it here.">
                  {upcoming.map((s) => (
                    <tr key={s.id}>
                      <td className={td}><When s={s} /></td>
                      <td className={`${td} font-semibold`}>{s.memberName}</td>
                      <td className={td}>
                        <Button
                          size="sm"
                          disabled={s.date > today() || busyId !== null}
                          title={s.date > today() ? 'Available on the session day' : undefined}
                          onClick={() => openComplete(s)}
                        >Mark completed</Button>
                      </td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </>
          )}

          {tab === 'attendance' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Sessions held" value={all.filter((s) => s.status === 'COMPLETED').length} />
                <Stat label="Not held (absences)" value={all.filter((s) => s.status === 'NOT_HELD').length} />
              </div>
              <Card title="Session record" headerTone="maroon">
                <Table headers={['When', 'Member', 'Status', 'Note']} isEmpty={record.length === 0} emptyText="Completed and declined sessions will show up here." pageSize={5} itemLabel="sessions">
                  {record.map((s) => (
                    <tr key={s.id}>
                      <td className={td}><When s={s} /></td>
                      <td className={`${td} font-semibold`}>{s.memberName}</td>
                      <td className={td}><Badge value={s.status} /></td>
                      <td className={td}>{s.declineReason ?? s.completionNote}</td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </>
          )}
        </>
      )}

      <Modal
        isOpen={!!declining}
        onClose={() => { if (busyId !== 'decline') setDeclining(null); }}
        title="Decline session"
        hideFooter
        isLoading={busyId === 'decline'}
        loadingLabel="Declining session…"
      >
        {declining && (
          <>
            <p className="text-sm text-gray-600 mb-4">{declining.memberName}, {fmtDate(declining.date)} at {fmtTime(declining.time)}. An admin will offer them another trainer.</p>
            {reasonErr && <Notice tone="error">{reasonErr}</Notice>}
            <Input label="Reason for declining" value={reason} onChange={(e) => setReason(e.target.value)} required />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeclining(null)} disabled={busyId === 'decline'}>Cancel</Button>
              <Button variant="danger" onClick={confirmDecline} isLoading={busyId === 'decline'}>Decline session</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={!!completing}
        onClose={() => { if (busyId !== 'complete') setCompleting(null); }}
        title="Mark completed"
        hideFooter
        isLoading={busyId === 'complete'}
        loadingLabel="Marking completed…"
      >
        {completing && (
          <>
            <p className="text-sm text-gray-600 mb-4">{completing.memberName}, {fmtDate(completing.date)} at {fmtTime(completing.time)}.</p>
            {completeErr && <Notice tone="error">{completeErr}</Notice>}
            <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did the session go?" />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCompleting(null)} disabled={busyId === 'complete'}>Cancel</Button>
              <Button onClick={confirmComplete} isLoading={busyId === 'complete'}>Mark completed</Button>
            </div>
          </>
        )}
      </Modal>
    </AppShell>
  );
}