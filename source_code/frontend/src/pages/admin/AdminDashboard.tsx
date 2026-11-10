import { useState } from 'react';
import { Activity, Banknote, CalendarCheck, Dumbbell, TrendingUp, TriangleAlert, Users, Wallet } from 'lucide-react';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { METHODS, PLANS, STATUSES, type PayMethod, type Plan, type PulseLevel, type SessionStatus } from '../../lib/types';
import { money } from '../../lib/format';
import { AppShell, type NavItem } from '../../components/AppShell';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { pretty } from '../../components/Badge';
import { BarChart, DonutChart, StackedBarChart } from '../../components/Charts';
import { Loading, Notice, Stat } from '../../components/Widgets';
import { MembersTab } from './MembersTab';
import { TrainersTab } from './TrainersTab';
import { PaymentsTab } from './PaymentsTab';
import { SessionsTab } from './SessionsTab';
import { PulseTab } from './PulseTab';

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'trainers', label: 'Trainers' },
  { id: 'payments', label: 'Payments' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'pulse', label: 'Gymmetry Pulse' },
];

const PULSE_GROUPS: { level: PulseLevel; label: string }[] = [
  { level: 'FOLLOW_UP', label: 'Follow up' },
  { level: 'WATCH', label: 'Watch' },
  { level: 'POSITIVE', label: 'On track' },
];

const METHOD_COLORS: Record<PayMethod, string> = { CASH: '#68020F', CARD: '#F21137', E_WALLET: '#FB7185' };
const PLAN_COLORS: Record<Plan, string> = { BASIC: '#FCA5A5', PREMIUM: '#F21137', VIP: '#68020F' };
const STATUS_COLORS: Record<SessionStatus, string> = {
  PENDING: '#FCA5A5', ACCEPTED: '#FB7185', DECLINED: '#F21137', COMPLETED: '#9F1239', NOT_HELD: '#68020F',
};
const PULSE_COLORS: Record<PulseLevel, string> = { FOLLOW_UP: '#68020F', WATCH: '#F21137', POSITIVE: '#FB7185' };

function Overview({ go }: { go: (id: string) => void }) {
  const reports = useAsync(() => api.getReports());
  const pulse = useAsync(() => api.getPulse());
  if (reports.loading || pulse.loading) return <Loading />;
  const r = reports.data;
  if (!r) return <Notice tone="error">{reports.error || 'Could not load the overview.'}</Notice>;

  const insights = pulse.data ?? [];
  const declined = r.sessionsByStatus.DECLINED;
  const followUps = insights.filter((p) => p.level === 'FOLLOW_UP');
  const pulseRecent = insights.reduce((s, i) => s + i.recentVisits, 0);
  const pulsePrevious = insights.reduce((s, i) => s + i.previousVisits, 0);
  const totalMembers = r.activeMembers + r.inactiveMembers;
  const seeMore = (id: string) => <Button size="sm" variant="ghost" onClick={() => go(id)}>See more</Button>;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={money(r.revenueTotal)} icon={<Banknote className="h-5 w-5" />} />
        <Stat label="Active members" value={r.activeMembers} icon={<Users className="h-5 w-5" />} />
        <Stat label="Declined sessions" value={declined} hint="Waiting for reassignment" icon={<CalendarCheck className="h-5 w-5" />} />
        <Stat label="Not held" value={r.sessionsByStatus.NOT_HELD} hint="Flagged at midnight" icon={<TriangleAlert className="h-5 w-5" />} />
      </div>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Revenue" icon={<Wallet className="h-5 w-5" />} headerTone="maroon" action={seeMore('payments')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          <DonutChart
            items={METHODS.map((m) => ({
              label: m === 'E_WALLET' ? 'E-wallet' : pretty(m),
              value: r.revenueByMethod[m],
              display: money(r.revenueByMethod[m]),
              color: METHOD_COLORS[m],
            }))}
            centerValue={money(r.revenueTotal)}
            centerLabel="total revenue"
          />
        </Card>
        <Card title="Members per plan" icon={<Users className="h-5 w-5" />} headerTone="maroon" action={seeMore('members')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          <DonutChart
            items={PLANS.map((p) => ({ label: pretty(p), value: r.membersByPlan[p], color: PLAN_COLORS[p] }))}
            centerValue={totalMembers}
            centerLabel="members"
          />
        </Card>
        <Card title="Sessions by status" icon={<CalendarCheck className="h-5 w-5" />} headerTone="maroon" action={seeMore('sessions')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          <BarChart items={STATUSES.map((s) => ({ label: pretty(s), value: r.sessionsByStatus[s], color: STATUS_COLORS[s] }))} />
        </Card>
        <Card title="Trainer attendance" icon={<Dumbbell className="h-5 w-5" />} headerTone="maroon" action={seeMore('trainers')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          <StackedBarChart
            items={r.trainerAttendance.map((t) => ({ label: t.name, values: [t.held, t.notHeld] }))}
            series={[{ label: 'Held', color: '#F21137' }, { label: 'Not held', color: '#68020F' }]}
          />
        </Card>
        <Card title="Gymmetry Pulse" icon={<Activity className="h-5 w-5" />} headerTone="maroon" action={seeMore('pulse')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          <DonutChart
            items={PULSE_GROUPS.map((g) => ({
              label: g.label,
              value: insights.filter((i) => i.level === g.level).length,
              color: PULSE_COLORS[g.level],
            }))}
            centerValue={insights.length}
            centerLabel="members"
          />
        </Card>
        <Card title="Attendance trend" icon={<TrendingUp className="h-5 w-5" />} headerTone="maroon" action={seeMore('pulse')} className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          <BarChart
            items={[
              { label: 'Last 30 days', value: pulseRecent, color: '#F21137' },
              { label: 'Previous 30 days', value: pulsePrevious, color: '#FB7185' },
            ]}
            height={150}
          />
          <p className="mt-4 text-center text-sm text-gray-500">
            {pulseRecent === pulsePrevious ? 'Participation is steady.' : pulseRecent > pulsePrevious ? `Up by ${pulseRecent - pulsePrevious} visits.` : `Down by ${pulsePrevious - pulseRecent} visits.`}
          </p>
        </Card>
      </div>

      <Card title="Needs your attention" icon={<TriangleAlert className="h-5 w-5" />} headerTone="maroon">
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
  const [memberFocus, setMemberFocus] = useState<number | null>(null);
  const navigate = (id: string) => {
    setMemberFocus(null);
    setTab(id);
  };
  const openMember = (memberId: number) => {
    setMemberFocus(memberId);
    setTab('members');
  };

  return (
    <AppShell nav={NAV} active={tab} onNavigate={navigate}>
      {tab === 'overview' && <Overview go={navigate} />}
      {tab === 'members' && <MembersTab focusMemberId={memberFocus} onFocusHandled={() => setMemberFocus(null)} />}
      {tab === 'trainers' && <TrainersTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'sessions' && <SessionsTab />}
      {tab === 'pulse' && <PulseTab onOpenMember={openMember} />}
    </AppShell>
  );
}