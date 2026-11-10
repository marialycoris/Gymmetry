import { useState } from 'react';
import { api } from '../api/client';
import { PLANS, type Member, type Plan } from '../lib/types';
import { fmtDate } from '../lib/format';
import { Button } from './Button';
import { Select } from './Select';
import { Badge } from './Badge';
import { Notice } from './Widgets';

const planOptions = PLANS.map((p) => ({ value: p, label: p[0] + p.slice(1).toLowerCase() }));

interface MemberPlanProps {
  member: Member;
  onDone: () => void;
}

/** Plan, renewal and account actions for a member. Reusable from any member view. */
export function MemberPlan({ member, onDone }: MemberPlanProps) {
  const [plan, setPlan] = useState<Plan>(member.plan);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr('');
    try {
      await fn();
      onDone();
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Could not update the plan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Current plan</p>
          <Badge value={member.plan} />
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>Expires {fmtDate(member.expiresAt)}</p>
          <p className="mt-1">Status <Badge value={member.status} /></p>
        </div>
      </div>
      {err && <Notice tone="error">{err}</Notice>}
      <Select label="Membership plan" value={plan} onChange={(e) => setPlan(e.target.value as Plan)} options={planOptions} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy || plan === member.plan} onClick={() => run(() => api.updateMemberPlan(member.id, plan))}>Save plan</Button>
        <Button disabled={busy} onClick={() => run(() => api.renewMember(member.id))}>Renew for 30 days</Button>
        {member.status === 'DISABLED'
          ? <Button variant="secondary" disabled={busy} onClick={() => run(() => api.setMemberActive(member.id, true))}>Reactivate account</Button>
          : <Button variant="danger" disabled={busy} onClick={() => run(() => api.setMemberActive(member.id, false))}>Disable account</Button>}
      </div>
    </div>
  );
}
