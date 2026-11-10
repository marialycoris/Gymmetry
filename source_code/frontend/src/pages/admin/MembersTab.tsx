import { useState } from 'react';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { GENDERS, PLANS, type Gender, type Member, type MemberRegistrationInput, type MemberStatus, type Plan } from '../../lib/types';
import { daysUntil, fmtDate } from '../../lib/format';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { MemberProfile } from '../../components/MemberProfile';
import { MemberPlan } from '../../components/MemberPlan';
import { Badge, pretty } from '../../components/Badge';
import { SearchBar } from '../../components/SearchBar';
import { Filter } from '../../components/Filter';
import { CreateButton } from '../../components/CreateButton';
import { Table, td } from '../../components/Table';
import { LoadingOverlay } from '../../components/Spinner';
import { Loading, Notice } from '../../components/Widgets';

const planOptions = PLANS.map((p) => ({ value: p, label: p[0] + p.slice(1).toLowerCase() }));
const genderOptions = GENDERS.map((g) => ({ value: g, label: g[0] + g.slice(1).toLowerCase() }));
const memberStatuses: MemberStatus[] = ['ACTIVE', 'EXPIRED', 'DISABLED'];
const statusOptions = [{ value: '', label: 'All statuses' }, ...memberStatuses.map((s) => ({ value: s, label: pretty(s) }))];

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState<MemberRegistrationInput>({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE' as Gender,
    address: '', contactNumber: '', emergencyContactNumber: '', medicalCondition: '',
    username: '', tempPassword: '', plan: 'BASIC' as Plan,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await api.registerMember(f); onDone(); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="relative">
      <LoadingOverlay show={busy} label="Registering member…" />
      {err && <Notice tone="error">{err}</Notice>}
      <div className="grid grid-cols-2 gap-x-4">
        <Input label="First name" value={f.firstName} onChange={set('firstName')} required />
        <Input label="Last name" value={f.lastName} onChange={set('lastName')} required />
        <Input label="Date of birth" type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} required />
        <Select label="Sex at birth" value={f.gender} onChange={set('gender')} options={genderOptions} />
        <Input label="Contact number" type="tel" value={f.contactNumber} onChange={set('contactNumber')} required />
        <Input label="Emergency contact number" type="tel" value={f.emergencyContactNumber} onChange={set('emergencyContactNumber')} required />
      </div>
      <Input label="Address" value={f.address} onChange={set('address')} placeholder="Optional" />
      <Input label="Medical condition" value={f.medicalCondition} onChange={set('medicalCondition')} placeholder="Diabetes, Hypertension, etc. (leave blank if none)" />
      <Input label="Username" value={f.username} onChange={set('username')} required />
      <Input label="Temporary password" type="text" value={f.tempPassword} onChange={set('tempPassword')} required minLength={8} />
      <p className="text-xs text-gray-500 -mt-2 mb-4">The member must change this the first time they log in.</p>
      <Select label="Plan" value={f.plan} onChange={set('plan')} options={planOptions} />
      <div className="flex justify-end"><Button type="submit" isLoading={busy}>Register member</Button></div>
    </form>
  );
}

interface MembersTabProps {
  focusMemberId?: number | null;
  onFocusHandled?: () => void;
}

export function MembersTab({ focusMemberId, onFocusHandled }: MembersTabProps = {}) {
  const { data, loading, error, reload } = useAsync(() => api.getMembers());
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [registering, setRegistering] = useState(false);
  const [profile, setProfile] = useState<Member | null>(null);
  const [planMember, setPlanMember] = useState<Member | null>(null);

  if (loading) return <Loading />;
  const search = q.toLowerCase();
  const rows = (data ?? []).filter((m) =>
    m.name.toLowerCase().includes(search) && (!status || m.status === status));
  const focused = focusMemberId == null ? null : (data ?? []).find((m) => m.id === focusMemberId) ?? null;
  const selected = profile ?? focused;
  const closeProfile = () => { setProfile(null); onFocusHandled?.(); };
  const done = () => { setRegistering(false); setProfile(null); setPlanMember(null); onFocusHandled?.(); reload(); };

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <Notice>Accounts with no activity for six months are disabled automatically. Renew or reactivate them here.</Notice>
      <Card
        title="Member Information"
        headerTone="maroon"
        action={
          <div className="flex items-center gap-1">
            <CreateButton onClick={() => setRegistering(true)} />
            <SearchBar variant="header" value={q} onChange={setQ} placeholder="Search by name…" label="Search members by name" />
            <Filter variant="header" label="Filter members by status" value={status} onChange={setStatus} options={statusOptions} />
          </div>
        }
      >
        <Table headers={['Member', 'Plan', 'Status', 'Expires', 'Last visit', '']} isEmpty={rows.length === 0} emptyText="No members match those filters." pageSize={5} resetKey={`${q}|${status}`} itemLabel="members">
          {rows.map((m) => {
            const left = daysUntil(m.expiresAt);
            return (
              <tr key={m.id}>
                <td className={`${td} font-semibold`}>{m.name}<span className="block text-xs font-normal text-gray-500">@{m.username}</span></td>
                <td className={td}><Badge value={m.plan} /></td>
                <td className={td}><Badge value={m.status} /></td>
                <td className={td}>{fmtDate(m.expiresAt)}<span className="block text-xs text-gray-500">{left >= 0 ? `in ${left} days` : `${-left} days ago`}</span></td>
                <td className={td}>{fmtDate(m.lastAttendance)}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setProfile(m)}>Profile</Button>
                    <Button size="sm" onClick={() => setPlanMember(m)}>Plan</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Modal isOpen={registering} onClose={() => setRegistering(false)} title="Register member" hideFooter><RegisterForm onDone={done} /></Modal>
      <Modal isOpen={!!selected} onClose={closeProfile} title={selected ? `${selected.name} — Profile` : 'Profile'} hideFooter>
        {selected && <MemberProfile key={selected.id} member={selected} onSaved={(m) => { setProfile(m); reload(); }} />}
      </Modal>
      <Modal isOpen={!!planMember} onClose={() => setPlanMember(null)} title={planMember ? `${planMember.name} — Plan` : 'Plan'} hideFooter>
        {planMember && <MemberPlan member={planMember} onDone={done} />}
      </Modal>
    </>
  );
}