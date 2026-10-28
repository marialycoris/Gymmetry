import { useState } from 'react';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { METHODS, PLAN_PRICE, type PayMethod } from '../../lib/types';
import { fmtDate, money } from '../../lib/format';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Table, td } from '../../components/Table';
import { Loading, Notice, Stat } from '../../components/Widgets';
import { pretty } from '../../components/Badge';

export function PaymentsTab() {
  const members = useAsync(() => api.getMembers());
  const [filter, setFilter] = useState('');
  const payments = useAsync(() => api.getPayments(filter ? Number(filter) : undefined), [filter]);

  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('CASH');
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (members.loading || payments.loading) return <Loading />;
  const list = payments.data ?? [];
  const memberOptions = [{ value: '', label: 'Select a member' }, ...(members.data ?? []).map((m) => ({ value: m.id, label: m.name }))];

  const pickMember = (id: string) => {
    setMemberId(id);
    const m = members.data?.find((x) => x.id === Number(id));
    if (m) setAmount(String(PLAN_PRICE[m.plan])); // prefill from the member's plan
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return setMsg({ tone: 'error', text: 'Select a member first.' });
    setBusy(true); setMsg(null);
    try {
      await api.recordPayment({ memberId: Number(memberId), amount: Number(amount), method });
      setMsg({ tone: 'success', text: 'Payment recorded.' });
      setAmount(''); setMemberId('');
      payments.reload();
    } catch (x: any) { setMsg({ tone: 'error', text: x.message }); } finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-[22rem_1fr] gap-6 items-start">
      <Card title="Record payment">
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <form onSubmit={submit}>
          <Select label="Member" value={memberId} onChange={(e) => pickMember(e.target.value)} options={memberOptions} />
          <Input label="Amount (₱)" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}
            options={METHODS.map((m) => ({ value: m, label: m === 'E_WALLET' ? 'E-wallet' : pretty(m) }))} />
          <Button type="submit" className="w-full" isLoading={busy}>Record payment</Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Stat label={filter ? 'Total paid by this member' : 'Total revenue'} value={money(list.reduce((s, p) => s + p.amount, 0))} />
        <Card title="Payment history">
          <Select label="Show payments for" value={filter} onChange={(e) => setFilter(e.target.value)}
            options={[{ value: '', label: 'All members' }, ...(members.data ?? []).map((m) => ({ value: m.id, label: m.name }))]} />
          <Table headers={['Date', 'Member', 'Method', 'Amount']} isEmpty={list.length === 0} emptyText="No payments recorded yet.">
            {list.map((p) => (
              <tr key={p.id}>
                <td className={td}>{fmtDate(p.paidAt)}</td>
                <td className={`${td} font-semibold`}>{p.memberName}</td>
                <td className={td}>{p.method === 'E_WALLET' ? 'E-wallet' : pretty(p.method)}</td>
                <td className={td}>{money(p.amount)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}