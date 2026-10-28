import { useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { byDate, fmtDate, fmtTime, today } from '../../lib/format';
import { AppShell, type NavItem } from '../../components/AppShell';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { Table, td } from '../../components/Table';
import { Loading, Notice, Stat } from '../../components/Widgets';
import type { Session } from '../../lib/types';

const NAV: NavItem[] = [
  { id: 'requests', label: 'Requests' },
  { id: 'schedule', label: 'My schedule' },
  { id: 'attendance', label: 'Attendance' },
];

const When = ({ s }: { s: Session }) => (
  <>{fmtDate(s.date)}<span className="block text-xs text-gray-500">{fmtTime(s.time)}</span></>
);

export function TrainerDashboard() {
  const { user } = useAuth();
  const trainerId = user!.personId;
  const [tab, setTab] = useState('requests');
  const sessions = useAsync(() => api.getSessions({ trainerId }), [trainerId]);
  const [err, setErr] = useState('');
  const [declining, setDeclining] = useState<Session | null>(null);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');

  const all = [...(sessions.data ?? [])].sort(byDate);
  const pending = all.filter((s) => s.status === 'PENDING');
  const upcoming = all.filter((s) => s.status === 'ACCEPTED');
  const record = all.filter((s) => ['COMPLETED', 'NOT_HELD', 'DECLINED'].includes(s.status)).reverse();

  const run = async (fn: () => Promise<unknown>) => {
    setErr('');
    try { await fn(); sessions.reload(); } catch (x: any) { setErr(x.message); }
  };
  const confirmDecline = async () => {
    if (!reason.trim()) return setReasonErr('Tell the member why you are declining.');
    try {
      await api.respondToSession(declining!.id, false, reason);
      setDeclining(null); sessions.reload();
    } catch (x: any) { setReasonErr(x.message); }
  };
  const openDecline = (s: Session) => { setDeclining(s); setReason(''); setReasonErr(''); };

  return (
    <AppShell nav={NAV} active={tab} onNavigate={setTab}>
      {(sessions.error || err) && <Notice tone="error">{sessions.error || err}</Notice>}
      {sessions.loading ? <Loading /> : (
        <>
          {tab === 'requests' && (
            <Card title={`Session requests (${pending.length})`}>
              <Table headers={['When', 'Member', '']} isEmpty={pending.length === 0} emptyText="No requests waiting for you.">
                {pending.map((s) => (
                  <tr key={s.id}>
                    <td className={td}><When s={s} /></td>
                    <td className={`${td} font-semibold`}>{s.memberName}</td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <Button size="sm" onClick={() => run(() => api.respondToSession(s.id, true))}>Accept</Button>{' '}
                      <Button size="sm" variant="secondary" onClick={() => openDecline(s)}>Decline</Button>
                    </td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}

          {tab === 'schedule' && (
            <>
              <Notice tone="warn">Mark each session as completed on the day. Sessions still unmarked at midnight are flagged “Not held” and count as an absence for you.</Notice>
              <Card title="Accepted sessions">
                <Table headers={['When', 'Member', '']} isEmpty={upcoming.length === 0} emptyText="Nothing scheduled. Accept a request to see it here.">
                  {upcoming.map((s) => (
                    <tr key={s.id}>
                      <td className={td}><When s={s} /></td>
                      <td className={`${td} font-semibold`}>{s.memberName}</td>
                      <td className={`${td} text-right`}>
                        <Button size="sm" disabled={s.date > today()} title={s.date > today() ? 'Available on the session day' : undefined}
                          onClick={() => run(() => api.completeSession(s.id))}>Mark completed</Button>
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
              <Card title="Session record">
                <Table headers={['When', 'Member', 'Status', 'Note']} isEmpty={record.length === 0} emptyText="Completed and declined sessions will show up here.">
                  {record.map((s) => (
                    <tr key={s.id}>
                      <td className={td}><When s={s} /></td>
                      <td className={`${td} font-semibold`}>{s.memberName}</td>
                      <td className={td}><Badge value={s.status} /></td>
                      <td className={td}>{s.declineReason}</td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </>
          )}
        </>
      )}

      <Modal isOpen={!!declining} onClose={() => setDeclining(null)} title="Decline session" hideFooter>
        {declining && (
          <>
            <p className="text-sm text-gray-600 mb-4">{declining.memberName}, {fmtDate(declining.date)} at {fmtTime(declining.time)}. An admin will offer them another trainer.</p>
            {reasonErr && <Notice tone="error">{reasonErr}</Notice>}
            <Input label="Reason for declining" value={reason} onChange={(e) => setReason(e.target.value)} required />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeclining(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDecline}>Decline session</Button>
            </div>
          </>
        )}
      </Modal>
    </AppShell>
  );
}