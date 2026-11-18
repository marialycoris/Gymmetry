import { useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { PLANS, type Member, type Plan } from '../lib/types';
import { fmtDate } from '../lib/format';
import { Button } from './Button';
import { Select } from './Select';
import { Badge } from './Badge';
import { LoadingOverlay } from './Spinner';

const planOptions = PLANS.map((p) => ({ value: p, label: p[0] + p.slice(1).toLowerCase() }));

interface MemberPlanProps {
  member: Member;
  onDone: () => void;
}

/** Plan, renewal and account actions for a member. Reusable from any member view. */
export function MemberPlan({ member, onDone }: MemberPlanProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [plan, setPlan] = useState<Plan>(member.plan);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(message);
      onDone();
    } catch (x) {
      toast.error(x instanceof Error ? x.message : 'Could not update the plan.');
    } finally {
      setBusy(false);
    }
  };

  const savePlan = async () => {
    const confirmed = await confirm({
      title: 'Change membership plan?',
      message: `Change ${member.name}'s plan from ${member.plan} to ${plan}?`,
      confirmLabel: 'Save plan',
    });
    if (!confirmed) return;
    await run(() => api.updateMemberPlan(member.id, plan), 'Membership plan updated.');
  };

  const renew = async () => {
    const confirmed = await confirm({
      title: 'Renew membership?',
      message: `Renew ${member.name}'s membership for 30 days?`,
      confirmLabel: 'Renew',
    });
    if (!confirmed) return;
    await run(() => api.renewMember(member.id), 'Membership renewed for 30 days.');
  };

  const disableAccount = async () => {
    const confirmed = await confirm({
      title: 'Disable account?',
      message: `Disable ${member.name}'s account? They will no longer be able to log in or book sessions.`,
      confirmLabel: 'Disable',
      variant: 'danger',
    });
    if (!confirmed) return;
    await run(() => api.setMemberActive(member.id, false), 'Account disabled.');
  };

  return (
    <div className="relative">
      <LoadingOverlay show={busy} label="Updating plan…" />
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
      <Select label="Membership plan" value={plan} onChange={(e) => setPlan(e.target.value as Plan)} options={planOptions} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy || plan === member.plan} onClick={savePlan}>Save plan</Button>
        <Button disabled={busy} onClick={renew}>Renew for 30 days</Button>
        {member.status === 'DISABLED'
          ? <Button variant="secondary" disabled={busy} onClick={() => run(() => api.setMemberActive(member.id, true), 'Account reactivated.')}>Reactivate account</Button>
          : <Button variant="danger" disabled={busy} onClick={disableAccount}>Disable account</Button>}
      </div>
    </div>
  );
}
