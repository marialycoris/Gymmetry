import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { METHODS, PLANS, STATUSES } from '../../lib/types';
import { money } from '../../lib/format';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { pretty } from '../../components/Badge';
import { Table, td } from '../../components/Table';
import { BarList, Loading, Notice, Stat } from '../../components/Widgets';

export function ReportsTab() {
  const { data: r, loading, error } = useAsync(() => api.getReports());
  if (loading) return <Loading />;
  if (error || !r) return <Notice tone="error">{error || 'Could not load reports.'}</Notice>;

  return (
    <>
      <div className="flex justify-end print:hidden"><Button variant="secondary" size="sm" onClick={() => window.print()}>Print report</Button></div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Total revenue" value={money(r.revenueTotal)} />
        <Stat label="Active members" value={r.activeMembers} />
        <Stat label="Inactive members" value={r.inactiveMembers} hint="Expired or disabled" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Revenue by payment method">
          <BarList items={METHODS.map((m) => ({ label: m === 'E_WALLET' ? 'E-wallet' : pretty(m), value: r.revenueByMethod[m], display: money(r.revenueByMethod[m]) }))} />
        </Card>
        <Card title="Members per plan">
          <BarList items={PLANS.map((p) => ({ label: pretty(p), value: r.membersByPlan[p] }))} />
        </Card>
        <Card title="Sessions by status">
          <BarList items={STATUSES.map((s) => ({ label: pretty(s), value: r.sessionsByStatus[s] }))} />
        </Card>
        <Card title="Trainer attendance">
          <Table headers={['Trainer', 'Held', 'Not held']}>
            {r.trainerAttendance.map((t) => (
              <tr key={t.trainerId}>
                <td className={`${td} font-semibold`}>{t.name}</td>
                <td className={td}>{t.held}</td>
                <td className={td}>{t.notHeld}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}