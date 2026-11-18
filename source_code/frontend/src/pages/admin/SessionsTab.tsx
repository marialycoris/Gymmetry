import { useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAsync } from '../../hooks/useAsync';
import { STATUSES, type Session } from '../../lib/types';
import { byDate, fmtDate, fmtTime } from '../../lib/format';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Select } from '../../components/Select';
import { Filter } from '../../components/Filter';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { pretty } from '../../components/badgeUtils';
import { Table, td } from '../../components/Table';
import { Loading, Notice } from '../../components/Widgets';

export function SessionsTab() {
  const toast = useToast();
  const confirm = useConfirm();
  const sessions = useAsync(() => api.getSessions({}));
  const trainers = useAsync(() => api.getTrainers());
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState<Session | null>(null);
  const [trainerId, setTrainerId] = useState('');
  const [busy, setBusy] = useState(false);

  if (sessions.loading || trainers.loading) return <Loading />;
  const all = [...(sessions.data ?? [])].sort(byDate).reverse();
  const declined = all.filter((s) => s.status === 'DECLINED');
  const shown = all.filter((s) => !status || s.status === status);
  const others = (trainers.data ?? []).filter((t) => t.id !== target?.trainerId);

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      setTarget(null);
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
    await run(() => api.reassignSession(target.id, Number(trainerId)), 'Session reassigned.');
  };

  return (
    <>
      {sessions.error && <Notice tone="error">{sessions.error}</Notice>}

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
          <Filter variant="header" label="Filter by status" value={status} onChange={setStatus}
            options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: pretty(s) }))]} />
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Sessions the trainer has not marked by midnight are flagged “Not held” automatically. If a trainer’s mark is wrong, override it here.
        </p>
        <Table headers={['When', 'Member', 'Trainer', 'Status', 'Attendance']} isEmpty={shown.length === 0} emptyText="No sessions with that status." pageSize={5} resetKey={status} itemLabel="sessions">
          {shown.map((s) => (
            <tr key={s.id}>
              <td className={td}>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></td>
              <td className={`${td} font-semibold`}>{s.memberName}</td>
              <td className={td}>{s.trainerName}</td>
              <td className={td}><Badge value={s.status} /></td>
              <td className={td}>
                {s.status === 'COMPLETED' && <Button size="sm" variant="secondary" onClick={() => run(() => api.overrideAttendance(s.id, 'NOT_HELD'), 'Attendance changed to not held.')}>Change to not held</Button>}
                {s.status === 'NOT_HELD' && <Button size="sm" variant="secondary" onClick={() => run(() => api.overrideAttendance(s.id, 'COMPLETED'), 'Attendance changed to completed.')}>Change to completed</Button>}
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
    </>
  );
}