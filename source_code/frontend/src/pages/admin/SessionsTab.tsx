import { useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAsync } from '../../hooks/useAsync';
import { STATUSES, type Session } from '../../lib/types';
import { byDate, fmtDate, fmtTime, today } from '../../lib/format';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { SearchableSelect } from '../../components/SearchableSelect';
import { Filter } from '../../components/Filter';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { pretty } from '../../components/badgeUtils';
import { Table, td } from '../../components/Table';
import { Loading, Notice } from '../../components/Widgets';

function BookForMemberModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const members = useAsync(() => api.getMembers());
  const trainers = useAsync(() => api.getTrainers());
  const [memberId, setMemberId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const slots = useAsync(() => (trainerId ? api.getSlots(Number(trainerId), date) : Promise.resolve([])), [trainerId, date]);
  const selectedMember = members.data?.find((m) => String(m.id) === memberId);
  const availableSlots = (slots.data ?? []).filter((s) => s.available);
  const canBook = selectedMember?.status === 'ACTIVE';

  const submit = async () => {
    const member = selectedMember;
    const trainer = trainers.data?.find((t) => String(t.id) === trainerId);
    const confirmed = await confirm({
      title: 'Book on behalf of member?',
      message: `Request ${member?.name ?? 'the selected member'} with ${trainer?.name ?? 'the selected trainer'} for ${fmtDate(date)} at ${fmtTime(time)}?`,
      confirmLabel: 'Book session',
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await api.bookSession({ memberId: Number(memberId), trainerId: Number(trainerId), date, time });
      toast.success(`Session requested for ${member?.name ?? 'the member'}.`);
      onDone();
    } catch (x) { toast.error(x instanceof Error ? x.message : 'Something went wrong.'); } finally { setBusy(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Book session for member" hideFooter isLoading={busy} loadingLabel="Booking session…">
      {members.loading || trainers.loading ? <Loading /> : (
        <>
          {!!memberId && !canBook && <Notice tone="warn">Only active members can book sessions. Renew the membership first.</Notice>}
          <SearchableSelect label="Member" value={memberId} onChange={setMemberId}
            options={(members.data ?? []).map((m) => ({ value: m.id, label: m.name, description: `${m.plan} · ${pretty(m.status)}` }))}
            placeholder="Search members..." />
          <SearchableSelect label="Trainer" value={trainerId} onChange={(v) => { setTrainerId(v); setTime(''); }}
            options={(trainers.data ?? []).map((t) => ({ value: t.id, label: t.name, description: t.specialty }))}
            placeholder="Search trainers..." />
          <Input label="Date" type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} className="max-w-xs" />
          {!trainerId ? <p className="mb-4 text-sm text-gray-500">Choose a trainer to see open times.</p> : slots.loading ? <Loading label="Finding slots..." /> : (
            <Select label="Time" value={time} onChange={(e) => setTime(e.target.value)}
              options={[{ value: '', label: 'Choose a time' }, ...availableSlots.map((s) => ({ value: s.time, label: `${fmtTime(s.time)} (${s.remaining}/${s.capacity} left)` }))]} />
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button disabled={!canBook || !trainerId || !time} isLoading={busy} onClick={submit}>Book session</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

export function SessionsTab() {
  const toast = useToast();
  const confirm = useConfirm();
  const sessions = useAsync(() => api.getSessions({}));
  const trainers = useAsync(() => api.getTrainers());
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState<Session | null>(null);
  const [trainerId, setTrainerId] = useState('');
  const [absentTarget, setAbsentTarget] = useState<Session | null>(null);
  const [absentReason, setAbsentReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (sessions.loading || trainers.loading) return <Loading />;
  const all = [...(sessions.data ?? [])].sort(byDate).reverse();
  const declined = all.filter((s) => s.status === 'DECLINED');
  const awaitingMember = all.filter((s) => s.status === 'REASSIGN_PENDING');
  const shown = all.filter((s) => !status || s.status === status);
  const others = (trainers.data ?? []).filter((t) => t.id !== target?.trainerId);

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      setTarget(null);
      setAbsentTarget(null);
      toast.success(message);
      sessions.reload();
    } catch (x) { toast.error(x instanceof Error ? x.message : 'Something went wrong.'); } finally { setBusy(false); }
  };
  const open = (s: Session) => { setTarget(s); setTrainerId(String(trainers.data?.find((t) => t.id !== s.trainerId)?.id ?? '')); };

  const reassign = async () => {
    if (!target) return;
    const newTrainer = trainers.data?.find((t) => t.id === Number(trainerId));
    const confirmed = await confirm({
      title: 'Reassign session?',
      message: `Reassign ${target.memberName}'s session to ${newTrainer?.name ?? 'the selected trainer'}?`,
      confirmLabel: 'Reassign',
    });
    if (!confirmed) return;
    await run(() => api.reassignSession(target.id, Number(trainerId)), 'Trainer proposed. Waiting for the member to accept or reject.');
  };

  const confirmTrainerAbsent = async () => {
    if (!absentTarget) return;
    const confirmed = await confirm({
      title: 'Mark trainer absent?',
      message: `Cancel ${absentTarget.memberName}'s session because the trainer is absent?`,
      confirmLabel: 'Mark trainer absent',
    });
    if (!confirmed) return;
    await run(() => api.markTrainerAbsent(absentTarget.id, absentReason), 'Trainer marked absent. Session cancelled.');
  };

  const cancelSession = async (s: Session) => {
    const confirmed = await confirm({
      title: 'Cancel session?',
      message: `Cancel ${s.memberName}'s session on ${fmtDate(s.date)} at ${fmtTime(s.time)}?`,
      confirmLabel: 'Cancel session',
    });
    if (!confirmed) return;
    await run(() => api.adminCancelSession(s.id), 'Session cancelled.');
  };

  const outcomeReason = (s: Session) => {
    if (s.cancellationReason) return pretty(s.cancellationReason);
    if (s.notHeldReason) return pretty(s.notHeldReason);
    if (s.overrideReason) return s.overrideReason;
    return s.declineReason ?? s.completionNote ?? '—';
  };

  return (
    <>
      {sessions.error && <Notice tone="error">{sessions.error}</Notice>}

      <Card title={`Awaiting member approval (${awaitingMember.length})`} headerTone="maroon">
        <Table headers={['When', 'Member', 'Proposed trainer', 'Status']} isEmpty={awaitingMember.length === 0} emptyText="No trainer changes awaiting member approval." pageSize={5} itemLabel="sessions">
          {awaitingMember.map((s) => (
            <tr key={s.id}>
              <td className={td}>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></td>
              <td className={`${td} font-semibold`}>{s.memberName}</td>
              <td className={td}>{s.trainerName}</td>
              <td className={td}><Badge value={s.status} /></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title={`Declined sessions (${declined.length})`} headerTone="maroon">
        <Table headers={['When', 'Member', 'Declined by', 'Reason', '']} isEmpty={declined.length === 0} emptyText="No declined sessions to review." pageSize={5} itemLabel="declined sessions">
          {declined.map((s) => (
            <tr key={s.id}>
              <td className={td}>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></td>
              <td className={`${td} font-semibold`}>{s.memberName}</td>
              <td className={td}>{s.trainerName}</td>
              <td className={`${td} max-w-xs`}>{s.declineReason}</td>
              <td className={td}><Button size="sm" onClick={() => open(s)}>Reassign</Button></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card
        title="All sessions"
        headerTone="maroon"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button size="sm" onClick={() => setBooking(true)}>Book for member</Button>
            <Filter variant="header" label="Filter by status" value={status} onChange={setStatus}
              options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: pretty(s) }))]} />
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Sessions the trainer has not marked by midnight are flagged “Not held” automatically. If a trainer’s mark is wrong, override it here.
        </p>
        <Table headers={['When', 'Member', 'Trainer', 'Status', 'Reason', 'Actions']} isEmpty={shown.length === 0} emptyText="No sessions with that status." pageSize={5} resetKey={status} itemLabel="sessions">
          {shown.map((s) => (
            <tr key={s.id}>
              <td className={td}>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></td>
              <td className={`${td} font-semibold`}>{s.memberName}</td>
              <td className={td}>{s.trainerName}</td>
              <td className={td}><Badge value={s.status} /></td>
              <td className={`${td} max-w-xs`}>{outcomeReason(s)}</td>
              <td className={td}>
                <div className="flex flex-wrap gap-2">
                  {s.status === 'COMPLETED' && <Button size="sm" variant="secondary" onClick={() => run(() => api.overrideAttendance(s.id, 'NOT_HELD'), 'Attendance changed to not held.')}>Change to not held</Button>}
                  {s.status === 'NOT_HELD' && <Button size="sm" variant="secondary" onClick={() => run(() => api.overrideAttendance(s.id, 'COMPLETED'), 'Attendance changed to completed.')}>Change to completed</Button>}
                  {s.status === 'ACCEPTED' && <Button size="sm" variant="danger" disabled={busy} onClick={() => { setAbsentTarget(s); setAbsentReason(''); }}>Trainer absent</Button>}
                  {['PENDING', 'REASSIGN_PENDING', 'ACCEPTED', 'DECLINED'].includes(s.status) && <Button size="sm" variant="secondary" disabled={busy} onClick={() => cancelSession(s)}>Cancel</Button>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={!!target} onClose={() => setTarget(null)} title="Reassign session" hideFooter isLoading={busy} loadingLabel="Reassigning…">
        {target && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {target.memberName}, {fmtDate(target.date)} at {fmtTime(target.time)}. {target.trainerName} declined: “{target.declineReason}”
              The member must accept the proposed trainer before the request is sent to them; rejecting cancels the session.
            </p>
            <Select label="New trainer" value={trainerId} onChange={(e) => setTrainerId(e.target.value)}
              options={others.map((t) => ({ value: t.id, label: `${t.name} (${t.specialty})` }))} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>Cancel</Button>
              <Button isLoading={busy} onClick={reassign}>Reassign</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={!!absentTarget} onClose={() => { if (!busy) setAbsentTarget(null); }} title="Mark trainer absent" hideFooter isLoading={busy} loadingLabel="Cancelling session…">
        {absentTarget && (
          <>
            <p className="text-sm text-gray-600 mb-4">{absentTarget.trainerName} was scheduled for {absentTarget.memberName} on {fmtDate(absentTarget.date)} at {fmtTime(absentTarget.time)}.</p>
            <Input label="Reason (optional)" value={absentReason} onChange={(e) => setAbsentReason(e.target.value)} placeholder="Why was the trainer absent?" />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAbsentTarget(null)} disabled={busy}>Cancel</Button>
              <Button variant="danger" onClick={confirmTrainerAbsent} isLoading={busy}>Mark trainer absent</Button>
            </div>
          </>
        )}
      </Modal>

      {booking && <BookForMemberModal onClose={() => setBooking(false)} onDone={() => { setBooking(false); sessions.reload(); }} />}
    </>
  );
}