import { useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { byDate, daysUntil, fmtDate, fmtTime, money, today } from '../../lib/format';
import { AppShell, type NavItem } from '../../components/AppShell';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Badge, pretty } from '../../components/Badge';
import { Table, td } from '../../components/Table';
import { Loading, Notice, Stat } from '../../components/Widgets';

const NAV: NavItem[] = [
  { id: 'membership', label: 'My membership' },
  { id: 'book', label: 'Book a session' },
  { id: 'sessions', label: 'My sessions' },
  { id: 'payments', label: 'Payments' },
];

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

function Book({ memberId }: { memberId: number }) {
  const trainers = useAsync(() => api.getTrainers());
  const member = useAsync(() => api.getMember(memberId), [memberId]);
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const slots = useAsync(() => (trainerId ? api.getSlots(trainerId, date) : Promise.resolve([])), [trainerId, date]);

  if (trainers.loading || member.loading) return <Loading />;
  const canBook = member.data?.status === 'ACTIVE';

  const book = async () => {
    setBusy(true); setMsg(null);
    try {
      await api.bookSession({ memberId, trainerId: trainerId!, date, time });
      setMsg({ tone: 'success', text: 'Request sent. You will see the trainer’s answer under My sessions.' });
      setTime(''); slots.reload();
    } catch (x: any) { setMsg({ tone: 'error', text: x.message }); } finally { setBusy(false); }
  };

  return (
    <>
      {!canBook && <Notice tone="warn">Only active memberships can book sessions. Renew at the front desk first.</Notice>}
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Card title="1. Choose a trainer">
        <div className="grid sm:grid-cols-3 gap-3">
          {(trainers.data ?? []).map((t) => (
            <button key={t.id} aria-pressed={trainerId === t.id} onClick={() => { setTrainerId(t.id); setTime(''); }}
              className={`text-left rounded-lg border-2 p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson ${trainerId === t.id ? 'border-gym-crimson bg-red-50' : 'border-gray-200 hover:border-gray-400'}`}>
              <span className="block font-bold">{t.name}</span>
              <span className="text-sm text-gray-500">{t.specialty}</span>
            </button>
          ))}
        </div>
      </Card>
      <Card title="2. Pick a date and time">
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
      </Card>
      <Button disabled={!canBook || !trainerId || !time} isLoading={busy} onClick={book}>Request session</Button>
    </>
  );
}

function MySessions({ memberId }: { memberId: number }) {
  const { data, loading, error } = useAsync(() => api.getSessions({ memberId }), [memberId]);
  if (loading) return <Loading />;
  const list = [...(data ?? [])].sort(byDate).reverse();
  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <Card>
        <Table headers={['When', 'Trainer', 'Status', 'Note']} isEmpty={list.length === 0} emptyText="You have not booked a session yet.">
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
        <Table headers={['Date', 'Method', 'Amount']} isEmpty={list.length === 0} emptyText="No payments on record.">
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
  const [tab, setTab] = useState('membership');
  return (
    <AppShell nav={NAV} active={tab} onNavigate={setTab}>
      {tab === 'membership' && <Membership memberId={memberId} />}
      {tab === 'book' && <Book memberId={memberId} />}
      {tab === 'sessions' && <MySessions memberId={memberId} />}
      {tab === 'payments' && <MyPayments memberId={memberId} />}
    </AppShell>
  );
}