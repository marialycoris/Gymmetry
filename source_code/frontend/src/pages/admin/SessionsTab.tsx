import { useState } from 'react';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { STATUSES, type Session } from '../../lib/types';
import { byDate, fmtDate, fmtTime } from '../../lib/format';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { Badge, pretty } from '../../components/Badge';
import { Table, td } from '../../components/Table';
import { Loading, Notice } from '../../components/Widgets';

export function SessionsTab() {
  const sessions = useAsync(() => api.getSessions({}));
  const trainers = useAsync(() => api.getTrainers());
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState<Session | null>(null);
  const [trainerId, setTrainerId] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (sessions.loading || trainers.loading) return <Loading />;
  const all = [...(sessions.data ?? [])].sort(byDate).reverse();
  const declined = all.filter((s) => s.status === 'DECLINED');
  const shown = all.filter((s) => !status || s.status === status);
  const others = (trainers.data ?? []).filter((t) => t.id !== target?.trainerId);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr('');
    try { await fn(); setTarget(null); sessions.reload(); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  const open = (s: Session) => { setErr(''); setTarget(s); setTrainerId(String(trainers.data?.find((t) => t.id !== s.trainerId)?.id ?? '')); };

  return (
    <>
      {sessions.error && <Notice tone="error">{sessions.error}</Notice>}
      {err && !target && <Notice tone="error">{err}</Notice>}

      <Card title={`Declined sessions (${declined.length})`}>
        <Table headers={['When', 'Member', 'Declined by', 'Reason', '']} isEmpty={declined.length === 0} emptyText="No declined sessions to review.">
          {declined.map((s) => (
            <tr key={s.id}>
              <td className={td}>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></td>
              <td className={`${td} font-semibold`}>{s.memberName}</td>
              <td className={td}>{s.trainerName}</td>
              <td className={`${td} max-w-xs`}>{s.declineReason}</td>
              <td className={`${td} text-right`}><Button size="sm" onClick={() => open(s)}>Reassign</Button></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="All sessions">
        <p className="text-sm text-gray-600 mb-4">
          Sessions the trainer has not marked by midnight are flagged “Not held” automatically. If a trainer’s mark is wrong, override it here.
        </p>
        <Select label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}
          options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: pretty(s) }))]} />
        <Table headers={['When', 'Member', 'Trainer', 'Status', 'Attendance']} isEmpty={shown.length === 0} emptyText="No sessions with that status.">
          {shown.map((s) => (
            <tr key={s.id}>
              <td className={td}>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></td>
              <td className={`${td} font-semibold`}>{s.memberName}</td>
              <td className={td}>{s.trainerName}</td>
              <td className={td}><Badge value={s.status} /></td>
              <td className={td}>
                {s.status === 'COMPLETED' && <Button size="sm" variant="secondary" onClick={() => run(() => api.overrideAttendance(s.id, 'NOT_HELD'))}>Change to not held</Button>}
                {s.status === 'NOT_HELD' && <Button size="sm" variant="secondary" onClick={() => run(() => api.overrideAttendance(s.id, 'COMPLETED'))}>Change to completed</Button>}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={!!target} onClose={() => setTarget(null)} title="Reassign session" hideFooter>
        {target && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {target.memberName}, {fmtDate(target.date)} at {fmtTime(target.time)}. {target.trainerName} declined: “{target.declineReason}”
            </p>
            {err && <Notice tone="error">{err}</Notice>}
            <Select label="New trainer" value={trainerId} onChange={(e) => setTrainerId(e.target.value)}
              options={others.map((t) => ({ value: t.id, label: `${t.name} (${t.specialty})` }))} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button>
              <Button isLoading={busy} onClick={() => run(() => api.reassignSession(target.id, Number(trainerId)))}>Reassign</Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}