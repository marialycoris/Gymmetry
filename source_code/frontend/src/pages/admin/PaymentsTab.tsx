import { useState } from 'react';
import { Banknote, CreditCard, TrendingUp, Users, Wallet } from 'lucide-react';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { METHODS, PLAN_PRICE, type PayMethod } from '../../lib/types';
import { fmtDate, money, today } from '../../lib/format';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { SearchableSelect } from '../../components/SearchableSelect';
import { Filter } from '../../components/Filter';
import { SearchBar } from '../../components/SearchBar';
import { Table, td } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { CreateButton } from '../../components/CreateButton';
import { BarChart, DonutChart } from '../../components/Charts';
import { BarList, Loading, Notice, Stat } from '../../components/Widgets';
import { pretty } from '../../components/Badge';

const METHOD_COLORS: Record<PayMethod, string> = { CASH: '#68020F', CARD: '#F21137', E_WALLET: '#FB7185' };

const emptyChart = <p className="py-6 text-center text-sm text-gray-500">No payments recorded yet.</p>;

export function PaymentsTab() {
  const members = useAsync(() => api.getMembers());
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const payments = useAsync(() => api.getPayments(filter ? Number(filter) : undefined), [filter]);

  const [recording, setRecording] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('CASH');
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (members.loading || payments.loading) return <Loading />;
  const list = payments.data ?? [];
  const rows = list.filter((p) => p.memberName.toLowerCase().includes(q.toLowerCase()));
  const memberOptions = (members.data ?? []).map((m) => ({ value: m.id, label: m.name }));

  // ---- Analytics (reflect the current member filter) ----
  const total = list.reduce((s, p) => s + p.amount, 0);
  const thisMonth = list.filter((p) => p.paidAt.slice(0, 7) === today().slice(0, 7)).reduce((s, p) => s + p.amount, 0);
  const byMethod = METHODS.map((m) => {
    const value = list.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0);
    return { label: m === 'E_WALLET' ? 'E-wallet' : pretty(m), value, display: money(value), color: METHOD_COLORS[m] };
  });
  const monthly = new Map<string, number>();
  for (const p of list) monthly.set(p.paidAt.slice(0, 7), (monthly.get(p.paidAt.slice(0, 7)) ?? 0) + p.amount);
  const byMonth = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, value]) => ({
      label: new Date(`${key}-01T00:00`).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }),
      value,
      display: money(value),
      color: '#F21137',
    }));
  const payerTotals = new Map<string, number>();
  for (const p of list) payerTotals.set(p.memberName, (payerTotals.get(p.memberName) ?? 0) + p.amount);
  const topPayers = [...payerTotals.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([label, value]) => ({ label, value, display: money(value) }));

  const pickMember = (id: string) => {
    setMemberId(id);
    const m = members.data?.find((x) => x.id === Number(id));
    if (m) setAmount(String(PLAN_PRICE[m.plan])); // prefill from the member's plan
  };

  const openRecord = () => { setMsg(null); setRecording(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return setMsg({ tone: 'error', text: 'Select a member first.' });
    setBusy(true); setMsg(null);
    try {
      await api.recordPayment({ memberId: Number(memberId), amount: Number(amount), method });
      setMsg({ tone: 'success', text: 'Payment recorded.' });
      setAmount(''); setMemberId('');
      setRecording(false);
      payments.reload();
    } catch (x: any) { setMsg({ tone: 'error', text: x.message }); } finally { setBusy(false); }
  };

  return (
    <>
      {msg?.tone === 'success' && <Notice tone="success">{msg.text}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={filter ? 'Total paid by this member' : 'Total revenue'} value={money(total)} icon={<Banknote className="h-5 w-5" />} />
        <Stat label="Payments recorded" value={list.length} icon={<CreditCard className="h-5 w-5" />} />
        <Stat label="Average payment" value={money(list.length ? total / list.length : 0)} icon={<Wallet className="h-5 w-5" />} />
        <Stat label="Paid this month" value={money(thisMonth)} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Revenue by method" icon={<CreditCard className="h-5 w-5" />} headerTone="maroon" className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          {list.length === 0 ? emptyChart : (
            <DonutChart items={byMethod} centerValue={money(total)} centerLabel="total" />
          )}
        </Card>
        <Card title="Revenue by month" icon={<TrendingUp className="h-5 w-5" />} headerTone="maroon" className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          {byMonth.length === 0 ? emptyChart : <BarChart items={byMonth} />}
        </Card>
        <Card title="Top payers" icon={<Users className="h-5 w-5" />} headerTone="maroon" className="h-full flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
          {topPayers.length === 0 ? emptyChart : <BarList items={topPayers} />}
        </Card>
      </div>

      <Card
        title="Payment history"
        headerTone="maroon"
        action={
          <div className="flex items-center gap-1">
            <CreateButton onClick={openRecord} label="Record payment" />
            <SearchBar variant="header" value={q} onChange={setQ} placeholder="Search by member name…" label="Search payments by member name" />
            <Filter variant="header" label="Show payments for" value={filter} onChange={setFilter}
              options={[{ value: '', label: 'All members' }, ...(members.data ?? []).map((m) => ({ value: m.id, label: m.name }))]} />
          </div>
        }
      >
        <Table headers={['Date', 'Member', 'Method', 'Amount']} isEmpty={rows.length === 0} emptyText="No payments recorded yet." pageSize={5} resetKey={`${filter}|${q}`} itemLabel="payments">
          {rows.map((p) => (
            <tr key={p.id}>
              <td className={td}>{fmtDate(p.paidAt)}</td>
              <td className={`${td} font-semibold`}>{p.memberName}</td>
              <td className={td}>{p.method === 'E_WALLET' ? 'E-wallet' : pretty(p.method)}</td>
              <td className={td}>{money(p.amount)}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={recording} onClose={() => setRecording(false)} title="Record payment" hideFooter isLoading={busy} loadingLabel="Recording payment…">
        {msg?.tone === 'error' && <Notice tone="error">{msg.text}</Notice>}
        <form onSubmit={submit}>
          <SearchableSelect label="Member" value={memberId} onChange={pickMember} options={memberOptions} placeholder="Search members…" />
          <Input label="Amount (₱)" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}
            options={METHODS.map((m) => ({ value: m, label: m === 'E_WALLET' ? 'E-wallet' : pretty(m) }))} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setRecording(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" isLoading={busy}>Record payment</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
