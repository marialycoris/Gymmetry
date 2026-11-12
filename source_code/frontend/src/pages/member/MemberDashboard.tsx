import { useState } from 'react';
import { CalendarDays, ClipboardCheck, IdCard, Inbox, TriangleAlert } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { usePersistentTab } from '../../hooks/usePersistentTab';
import { byDate, daysUntil, fmtDate, fmtTime, money, today } from '../../lib/format';
import { SPECIALIZATIONS } from '../../lib/specializations';
import { AppShell, type NavItem } from '../../components/AppShell';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Badge, pretty } from '../../components/Badge';
import { Table, td } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { SearchableSelect } from '../../components/SearchableSelect';
import { DonutChart } from '../../components/Charts';
import { Loading, Notice, Stat } from '../../components/Widgets';

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'membership', label: 'My membership' },
  { id: 'sessions', label: 'My sessions' },
  { id: 'payments', label: 'Payments' },
];

function Overview({ go, memberId }: { go: (id: string) => void; memberId: number }) {
  const member = useAsync(() => api.getMember(memberId), [memberId]);
  const sessions = useAsync(() => api.getSessions({ memberId }), [memberId]);
  if (member.loading || sessions.loading) return <Loading />;
  const m = member.data;
  if (!m) return <Notice tone="error">{member.error || 'Could not load the overview.'}</Notice>;

  const seeMore = (id: string) => <Button size="sm" variant="ghost" onClick={() => go(id)}>See more</Button>;
  const left = daysUntil(m.expiresAt);
  const all = [...(sessions.data ?? [])].sort(byDate);
  const pending = all.filter((s) => s.status === 'PENDING');
  const upcoming = all.filter((s) => s.status === 'ACCEPTED');
  const record = all.filter((s) => ['COMPLETED', 'NOT_HELD', 'DECLINED'].includes(s.status));
  const held = record.filter((s) => s.status === 'COMPLETED').length;
  const notHeld = record.filter((s) => s.status === 'NOT_HELD').length;
  const declined = record.filter((s) => s.status === 'DECLINED').length;
  const membershipAlert = m.status !== 'ACTIVE' || left <= 7;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Days left" value={Math.max(left, 0)} hint={`${pretty(m.plan)} · expires ${fmtDate(m.expiresAt)}`} icon={<IdCard className="h-5 w-5" />} />
        <Stat label="Upcoming sessions" value={upcoming.length} hint="Accepted by your trainer" icon={<CalendarDays className="h-5 w-5" />} />
        <Stat label="Requests waiting" value={pending.length} hint="Waiting for a trainer’s answer" icon={<Inbox className="h-5 w-5" />} />
        <Stat label="Sessions attended" value={held} hint={`Last visit ${fmtDate(m.lastAttendance)}`} icon={<ClipboardCheck className="h-5 w-5" />} />
      </div>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Upcoming sessions" icon={<CalendarDays className="h-5 w-5" />} headerTone="maroon" action={seeMore('sessions')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col">
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Nothing scheduled. Book a session to see it here.</p>
          ) : (
            <>
              <ul className="space-y-4">
                {upcoming.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => go('sessions')}
                      title={`See your sessions with ${s.trainerName} under My sessions`}
                      className="font-semibold text-left rounded hover:text-gym-crimson hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson"
                    >
                      {s.trainerName}
                    </button>
                    <span className="block text-xs text-gray-500">{fmtDate(s.date)} at {fmtTime(s.time)}</span>
                  </li>
                ))}
              </ul>
              {upcoming.length > 3 && <p className="mt-4 text-xs text-gray-500">+{upcoming.length - 3} more ahead.</p>}
            </>
          )}
        </Card>
        <Card title="Session history" icon={<ClipboardCheck className="h-5 w-5" />} headerTone="maroon" action={seeMore('sessions')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
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
                <p className="mt-4 text-center text-sm text-gray-500">Held rate: {Math.round((held / (held + notHeld)) * 100)}%.</p>
              )}
            </>
          )}
        </Card>
        <Card title="My membership" icon={<IdCard className="h-5 w-5" />} headerTone="maroon" action={seeMore('membership')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-2"><span className="text-gray-500">Plan</span><span className="font-semibold">{pretty(m.plan)}</span></li>
            <li className="flex items-center justify-between gap-2"><span className="text-gray-500">Status</span><Badge value={m.status} /></li>
            <li className="flex items-center justify-between gap-2"><span className="text-gray-500">Days left</span><span className="font-semibold">{Math.max(left, 0)}</span></li>
            <li className="flex items-center justify-between gap-2"><span className="text-gray-500">Member since</span><span className="font-semibold">{fmtDate(m.joinedAt)}</span></li>
          </ul>
        </Card>
      </div>

      <Card title="Needs your attention" icon={<TriangleAlert className="h-5 w-5" />} headerTone="maroon">
        <ul className="space-y-4">
          <li className="flex items-center justify-between gap-4">
            <span>
              {!membershipAlert ? 'Your membership is in good standing.'
                : m.status === 'DISABLED' ? 'Your account was disabled after six months without activity. Visit the front desk to reactivate it.'
                : m.status === 'EXPIRED' ? `Your membership expired on ${fmtDate(m.expiresAt)}. Renew at the front desk to book sessions again.`
                : `Your membership ends in ${left} day${left === 1 ? '' : 's'}. Renew at the front desk to keep training.`}
            </span>
            {membershipAlert && <Button size="sm" variant="secondary" onClick={() => go('membership')}>View</Button>}
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>{pending.length === 0 ? 'No requests waiting for a trainer’s answer.' : `${pending.length} request${pending.length > 1 ? 's' : ''} waiting for a trainer’s answer.`}</span>
            {pending.length > 0 && <Button size="sm" variant="secondary" onClick={() => go('sessions')}>View</Button>}
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>{declined === 0 ? 'No declined sessions.' : `${declined} session${declined > 1 ? 's' : ''} declined — the gym will find you another trainer.`}</span>
            {declined > 0 && <Button size="sm" variant="secondary" onClick={() => go('sessions')}>View</Button>}
          </li>
        </ul>
      </Card>
    </>
  );
}

function Membership({ memberId }: { memberId: number }) {
  const member = useAsync(() => api.getMember(memberId), [memberId]);
  const sessions = useAsync(() => api.getSessions({ memberId }), [memberId]);
  if (member.loading || sessions.loading) return <Loading />;
  const m = member.data;
  if (!m) return <Notice tone="error">{member.error || 'Could not load your membership.'}</Notice>;
  const left = daysUntil(m.expiresAt);
  const attended = (sessions.data ?? []).filter((s) => s.status === 'COMPLETED').length;

  return (
    <>
      {m.status === 'DISABLED' && <Notice tone="error">Your account was disabled after six months without activity. Visit the front desk to reactivate it.</Notice>}
      {m.status === 'EXPIRED' && <Notice tone="warn">Your membership expired on {fmtDate(m.expiresAt)}. Renew at the front desk to book sessions again.</Notice>}
      {m.status === 'ACTIVE' && left <= 7 && <Notice tone="warn">Your membership ends in {left} day{left === 1 ? '' : 's'}. Renew at the front desk to keep training.</Notice>}
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Plan" value={pretty(m.plan)} />
        <Stat label="Days left" value={Math.max(left, 0)} hint={`Expires ${fmtDate(m.expiresAt)}`} />
        <Stat label="Sessions attended" value={attended} hint={`Last visit ${fmtDate(m.lastAttendance)}`} />
      </div>
      <Card title="Account"><p>Status: <Badge value={m.status} /> &nbsp; Member since {fmtDate(m.joinedAt)}</p></Card>
    </>
  );
}

function BookModal({ memberId, onClose, onBooked }: { memberId: number; onClose: () => void; onBooked: () => void }) {
  const trainers = useAsync(() => api.getTrainers());
  const member = useAsync(() => api.getMember(memberId), [memberId]);
  const [trainerId, setTrainerId] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const slots = useAsync(() => (trainerId ? api.getSlots(Number(trainerId), date) : Promise.resolve([])), [trainerId, date]);
  const canBook = member.data?.status === 'ACTIVE';
  const trainerOptions = (trainers.data ?? []).map((t) => ({
    value: t.id,
    label: `${t.name} · ${t.specialty}`,
    description: SPECIALIZATIONS.find((s) => s.title === t.specialty)?.description,
  }));

  const pickTrainer = (v: string) => { setTrainerId(v); setTime(''); };

  const book = async () => {
    setBusy(true); setErr('');
    try {
      await api.bookSession({ memberId, trainerId: Number(trainerId), date, time });
      onBooked();
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Book a session" hideFooter isLoading={busy} loadingLabel="Sending request…">
      {trainers.loading || member.loading ? <Loading /> : (
        <>
          {!canBook && <Notice tone="warn">Only active memberships can book sessions. Renew at the front desk first.</Notice>}
          {err && <Notice tone="error">{err}</Notice>}
          <SearchableSelect label="Trainer" value={trainerId} onChange={pickTrainer} options={trainerOptions} placeholder="Search trainers…" />
          <Input label="Date" type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} className="max-w-xs" />
          {!trainerId ? <p className="text-gray-500">Choose a trainer to see open times.</p> : slots.loading ? <Loading /> : (
            <div className="flex flex-wrap gap-2">
              {(slots.data ?? []).map((s) => (
                <button key={s.time} disabled={!s.available} aria-pressed={time === s.time} onClick={() => setTime(s.time)}
                  className={`px-4 py-2 rounded-lg border-2 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson disabled:text-gray-400 disabled:line-through disabled:bg-gray-50 ${time === s.time ? 'border-gym-crimson bg-gym-crimson text-white' : 'border-gray-200 hover:border-gray-400'}`}>
                  {fmtTime(s.time)}
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button disabled={!canBook || !trainerId || !time} isLoading={busy} onClick={book}>Request session</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

function MySessions({ memberId }: { memberId: number }) {
  const { data, loading, error, reload } = useAsync(() => api.getSessions({ memberId }), [memberId]);
  const [booking, setBooking] = useState(false);
  const [justBooked, setJustBooked] = useState(false);
  if (loading) return <Loading />;
  const list = [...(data ?? [])].sort(byDate).reverse();
  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      {justBooked && <Notice tone="success">Request sent. You will see the trainer’s answer in this list once they respond.</Notice>}
      <Card
        title="My sessions"
        headerTone="maroon"
        action={<Button size="sm" onClick={() => { setJustBooked(false); setBooking(true); }}>Book a session</Button>}
      >
        <Table headers={['When', 'Trainer', 'Status', 'Note']} isEmpty={list.length === 0} emptyText="You have not booked a session yet." pageSize={5} itemLabel="sessions">
          {list.map((s) => (
            <tr key={s.id}>
              <td className={td}>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></td>
              <td className={`${td} font-semibold`}>{s.trainerName}</td>
              <td className={td}><Badge value={s.status} /></td>
              <td className={td}>{s.status === 'DECLINED' ? `Declined: ${s.declineReason}. The gym will find you another trainer.` : ''}</td>
            </tr>
          ))}
        </Table>
      </Card>
      {booking && (
        <BookModal
          memberId={memberId}
          onClose={() => setBooking(false)}
          onBooked={() => { setBooking(false); setJustBooked(true); reload(); }}
        />
      )}
    </>
  );
}

function MyPayments({ memberId }: { memberId: number }) {
  const { data, loading, error } = useAsync(() => api.getPayments(memberId), [memberId]);
  if (loading) return <Loading />;
  const list = data ?? [];
  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <Card>
        <Table headers={['Date', 'Method', 'Amount']} isEmpty={list.length === 0} emptyText="No payments on record." pageSize={5} itemLabel="payments">
          {list.map((p) => (
            <tr key={p.id}>
              <td className={td}>{fmtDate(p.paidAt)}</td>
              <td className={td}>{p.method === 'E_WALLET' ? 'E-wallet' : pretty(p.method)}</td>
              <td className={td}>{money(p.amount)}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

export function MemberDashboard() {
  const { user } = useAuth();
  const memberId = user!.personId;
  const [tab, setTab] = usePersistentTab('gymmetry_member_tab', 'overview', NAV.map((n) => n.id));
  return (
    <AppShell nav={NAV} active={tab} onNavigate={setTab}>
      {tab === 'overview' && <Overview go={setTab} memberId={memberId} />}
      {tab === 'membership' && <Membership memberId={memberId} />}
      {tab === 'sessions' && <MySessions memberId={memberId} />}
      {tab === 'payments' && <MyPayments memberId={memberId} />}
    </AppShell>
  );
}