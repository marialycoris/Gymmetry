import { useState } from 'react';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { money } from '../../lib/format';
import { AppShell, type NavItem } from '../../components/AppShell';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading, Notice, Stat } from '../../components/Widgets';
import { MembersTab } from './MembersTab';
import { PaymentsTab } from './PaymentsTab';
import { SessionsTab } from './SessionsTab';
import { ReportsTab } from './ReportsTab';
import { PulseTab } from './PulseTab';

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'payments', label: 'Payments' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'reports', label: 'Reports' },
  { id: 'pulse', label: 'Gymmetry Pulse' },
];

function Overview({ go }: { go: (id: string) => void }) {
  const reports = useAsync(() => api.getReports());
  const pulse = useAsync(() => api.getPulse());
  if (reports.loading || pulse.loading) return <Loading />;
  const r = reports.data;
  if (!r) return <Notice tone="error">{reports.error || 'Could not load the overview.'}</Notice>;

  const declined = r.sessionsByStatus.DECLINED;
  const followUps = (pulse.data ?? []).filter((p) => p.level === 'FOLLOW_UP');

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Revenue" value={money(r.revenueTotal)} />
        <Stat label="Active members" value={r.activeMembers} />
        <Stat label="Declined sessions" value={declined} hint="Waiting for reassignment" />
        <Stat label="Not held" value={r.sessionsByStatus.NOT_HELD} hint="Flagged at midnight" />
      </div>
      <Card title="Needs your attention">
        <ul className="space-y-4">
          <li className="flex items-center justify-between gap-4">
            <span>{declined === 0 ? 'No declined sessions to review.' : `${declined} declined session${declined > 1 ? 's' : ''} need a new trainer.`}</span>
            {declined > 0 && <Button size="sm" onClick={() => go('sessions')}>Review</Button>}
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>{followUps.length === 0 ? 'No members need follow-up.' : `${followUps.length} member${followUps.length > 1 ? 's' : ''} flagged for follow-up: ${followUps.map((f) => f.name).join(', ')}.`}</span>
            {followUps.length > 0 && <Button size="sm" variant="secondary" onClick={() => go('pulse')}>Open Pulse</Button>}
          </li>
        </ul>
      </Card>
    </>
  );
}

export function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  return (
    <AppShell nav={NAV} active={tab} onNavigate={setTab}>
      {tab === 'overview' && <Overview go={setTab} />}
      {tab === 'members' && <MembersTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'sessions' && <SessionsTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'pulse' && <PulseTab />}
    </AppShell>
  );
}