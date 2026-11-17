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
  { id: 'sessions', label: 'My sessions' },
  { id: 'waitlist', label: 'Waitlist' },
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
        <Card title="My membership" icon={<IdCard className="h-5 w-5" />} headerTone="maroon" className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col">
          <ul className="flex flex-col gap-3 text-sm">
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

function BookModal({ memberId, onClose, onDone }: { memberId: number; onClose: () => void; onDone: (message: string) => void }) {
  const trainers = useAsync(() => api.getTrainers());
  const member = useAsync(() => api.getMember(memberId), [memberId]);
  const [trainerId, setTrainerId] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const slots = useAsync(() => (trainerId ? api.getSlots(Number(trainerId), date) : Promise.resolve([])), [trainerId, date]);
  const selectedSlot = (slots.data ?? []).find((s) => s.time === time);
  const isFull = !!selectedSlot && !selectedSlot.available;
  const alternatives = useAsync(
    () => (isFull && trainerId && time ? api.getAlternatives({ trainerId: Number(trainerId), date, time }) : Promise.resolve([])),
    [isFull, trainerId, date, time],
  );
  const canBook = member.data?.status === 'ACTIVE';
  const trainerOptions = (trainers.data ?? []).map((t) => ({
    value: t.id,
    label: `${t.name} - ${t.specialty}`,
    description: SPECIALIZATIONS.find((s) => s.title === t.specialty)?.description,
  }));

  const pickTrainer = (v: string) => { setTrainerId(v); setTime(''); setErr(''); };
  const pickAlternative = (a: { trainerId: number; time: string }) => {
    setErr('');
    if (a.trainerId !== Number(trainerId)) setTrainerId(String(a.trainerId));
    setTime(a.time);
  };

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      if (isFull) {
        const entry = await api.joinWaitlist({ memberId, trainerId: Number(trainerId), date, time });
        onDone(`You joined the waitlist for ${fmtDate(date)} at ${fmtTime(time)}. Position #${entry.position} — we will offer you the slot when it opens.`);
      } else {
        await api.bookSession({ memberId, trainerId: Number(trainerId), date, time });
        onDone('Request sent. You will see the trainer\'s answer in this list once they respond.');
      }
    } catch (x) { setErr(x instanceof Error ? x.message : 'Something went wrong.'); } finally { setBusy(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Book a session" hideFooter isLoading={busy} loadingLabel={isFull ? 'Joining waitlist...' : 'Sending request...'}>
      {trainers.loading || member.loading ? <Loading /> : (
        <>
          {!canBook && <Notice tone="warn">Only active memberships can book sessions. Renew at the front desk first.</Notice>}
          {err && <Notice tone="error">{err}</Notice>}
          <SearchableSelect label="Trainer" value={trainerId} onChange={pickTrainer} options={trainerOptions} placeholder="Search trainers..." />
          <Input label="Date" type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} className="max-w-xs" />
          {!trainerId ? <p className="text-gray-500">Choose a trainer to see open times.</p> : slots.loading ? <Loading /> : (
            <>
              <p className="mb-2 text-sm text-gray-500">Pick a time. Fully booked times can be joined through the FairSlot waitlist.</p>
              <div className="flex flex-wrap gap-2">
                {(slots.data ?? []).map((s) => (
                  <button key={s.time} aria-pressed={time === s.time} onClick={() => { setTime(s.time); setErr(''); }}
                    title={s.available ? 'Open slot' : 'Fully booked — join the waitlist'}
                    className={`px-4 py-2 rounded-lg border-2 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson ${!s.available ? 'border-dashed' : ''} ${time === s.time ? 'border-gym-crimson bg-gym-crimson text-white' : s.available ? 'border-gray-200 hover:border-gray-400' : 'border-gray-300 text-gray-500 hover:border-gym-crimson'}`}>
                    <span className="block">{fmtTime(s.time)}</span>
                    {!s.available && <span className="block text-[10px] font-bold uppercase tracking-wide">Full</span>}
                  </button>
                ))}
              </div>
            </>
          )}
          {isFull && (
            <>
              <Notice tone="warn">This time is fully booked. Join the waitlist to get the next offer, or choose a nearby option below.</Notice>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="font-semibold">Nearby options</p>
                {alternatives.loading ? <Loading label="Finding alternatives..." /> : (alternatives.data ?? []).length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">No nearby slots are open. Joining the waitlist is your best option.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(alternatives.data ?? []).map((a) => (
                      <Button key={`${a.trainerId}-${a.time}`} size="sm" variant="secondary" onClick={() => pickAlternative(a)}>
                        {a.trainerName} - {fmtTime(a.time)} ({a.kind === 'SAME_TRAINER' ? 'same trainer' : 'other trainer'})
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button disabled={!canBook || !trainerId || !time} isLoading={busy} onClick={submit}>
              {isFull ? 'Join waitlist' : 'Request session'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

function MySessions({ memberId }: { memberId: number }) {
  const { data, loading, error, reload } = useAsync(() => api.getSessions({ memberId }), [memberId]);
  const [booking, setBooking] = useState(false);
  const [notice, setNotice] = useState('');
  if (loading) return <Loading />;
  const list = [...(data ?? [])].sort(byDate).reverse();
  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}
      <Card
        title="My sessions"
        headerTone="maroon"
        action={<Button size="sm" onClick={() => { setNotice(''); setBooking(true); }}>Book a session</Button>}
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
          onDone={(message) => { setBooking(false); setNotice(message); reload(); }}
        />
      )}
    </>
  );
}

function MyWaitlist({ memberId, onFind }: { memberId: number; onFind: () => void }) {
  const { data, loading, error, reload } = useAsync(() => api.getWaitlist(memberId), [memberId]);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [err, setErr] = useState('');
  if (loading) return <Loading />;
  const list = [...(data ?? [])].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  const claim = async (id: number) => {
    setBusy(id); setErr(''); setNotice('');
    try {
      await api.claimWaitlist(id);
      setNotice('Your offer was claimed. The session is now in My sessions.');
      reload();
    } catch (x) { setErr(x instanceof Error ? x.message : 'Something went wrong.'); } finally { setBusy(null); }
  };

  const leave = async (id: number) => {
    setBusy(id); setErr(''); setNotice('');
    try {
      await api.cancelWaitlist(id);
      setNotice('You left the waitlist.');
      reload();
    } catch (x) { setErr(x instanceof Error ? x.message : 'Something went wrong.'); } finally { setBusy(null); }
  };

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      {err && <Notice tone="error">{err}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}
      <Card
        title="FairSlot waitlist"
        headerTone="maroon"
        action={<Button size="sm" onClick={onFind}>Find a slot</Button>}
      >
        <p className="mb-4 text-sm text-gray-500">
          When a slot is fully booked, join its waitlist from Book a session. Offers hold the slot for 24 hours — claim before it expires or it moves to the next member.
        </p>
        <Table
          headers={['When', 'Trainer', 'Status', 'Position', 'Offer expires', 'Action']}
          isEmpty={list.length === 0}
          emptyText="You are not on any waitlist yet."
          pageSize={5}
          itemLabel="entries"
        >
          {list.map((e) => (
            <tr key={e.id}>
              <td className={td}>{fmtDate(e.date)}<span className="block text-xs text-gray-500">{fmtTime(e.time)}</span></td>
              <td className={`${td} font-semibold`}>{e.trainerName}</td>
              <td className={td}><Badge value={e.status} /></td>
              <td className={td}>{e.status === 'WAITING' || e.status === 'OFFERED' ? `#${e.position}` : '—'}</td>
              <td className={td}>{e.status === 'OFFERED' && e.offerExpiresAt ? new Date(e.offerExpiresAt).toLocaleString() : '—'}</td>
              <td className={td}>
                <div className="flex items-center justify-center gap-2">
                  {e.status === 'OFFERED' && (
                    <Button size="sm" isLoading={busy === e.id} onClick={() => claim(e.id)}>Claim</Button>
                  )}
                  {(e.status === 'WAITING' || e.status === 'OFFERED') && (
                    <Button size="sm" variant="secondary" disabled={busy === e.id} onClick={() => leave(e.id)}>Leave</Button>
                  )}
                  {e.status !== 'WAITING' && e.status !== 'OFFERED' && <span className="text-gray-400">—</span>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
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
      <Card title="My payments" headerTone="maroon">
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
      {tab === 'sessions' && <MySessions memberId={memberId} />}
      {tab === 'waitlist' && <MyWaitlist memberId={memberId} onFind={() => setTab('sessions')} />}
      {tab === 'payments' && <MyPayments memberId={memberId} />}
    </AppShell>
  );
}