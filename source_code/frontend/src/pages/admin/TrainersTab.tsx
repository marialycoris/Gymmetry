import { useState } from 'react';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { GENDERS, type Gender, type Trainer, type TrainerRegistrationInput } from '../../lib/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { SpecializationSelect } from '../../components/SpecializationSelect';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { SearchBar } from '../../components/SearchBar';
import { CreateButton } from '../../components/CreateButton';
import { Table, td } from '../../components/Table';
import { Loading, Notice } from '../../components/Widgets';

const errorText = (x: unknown) => (x instanceof Error ? x.message : String(x));
const genderOptions = GENDERS.map((g) => ({ value: g, label: g[0] + g.slice(1).toLowerCase() }));

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState<TrainerRegistrationInput>({
    firstName: '', lastName: '', email: '', gender: 'MALE' as Gender,
    contactNumber: '', address: '', license: '', specialty: '', username: '', tempPassword: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.specialty.trim()) { setErr('Please choose a specialization.'); return; }
    setBusy(true); setErr('');
    try { await api.registerTrainer(f); onDone(); } catch (x) { setErr(errorText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit}>
      {err && <Notice tone="error">{err}</Notice>}
      <div className="grid grid-cols-2 gap-x-4">
        <Input label="First name" value={f.firstName} onChange={set('firstName')} required />
        <Input label="Last name" value={f.lastName} onChange={set('lastName')} required />
        <Input label="Email" type="email" value={f.email} onChange={set('email')} required />
        <Select label="Sex at birth" value={f.gender} onChange={set('gender')} options={genderOptions} />
        <Input label="Contact number" type="tel" value={f.contactNumber} onChange={set('contactNumber')} required />
        <Input label="Address" value={f.address} onChange={set('address')} required />
      </div>
      <Input label="License" value={f.license} onChange={set('license')} placeholder="Optional — enter license number if available" />
      <SpecializationSelect label="Specialization" value={f.specialty} onChange={(specialty) => setF({ ...f, specialty })} />
      <Input label="Username" value={f.username} onChange={set('username')} required />
      <Input label="Temporary password" type="text" value={f.tempPassword} onChange={set('tempPassword')} required minLength={8} />
      <p className="text-xs text-gray-500 -mt-2 mb-4">The trainer must change this the first time they log in.</p>
      <div className="flex justify-end"><Button type="submit" isLoading={busy}>Register trainer</Button></div>
    </form>
  );
}

function ManageTrainer({ t, onDone }: { t: Trainer; onDone: () => void }) {
  const [f, setF] = useState({ name: t.name, email: t.email, specialty: t.specialty });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr('');
    try { await fn(); onDone(); } catch (x) { setErr(errorText(x)); } finally { setBusy(false); }
  };
  const dirty = f.name !== t.name || f.email !== t.email || f.specialty !== t.specialty;

  return (
    <div>
      {err && <Notice tone="error">{err}</Notice>}
      <Input label="Full name" value={f.name} onChange={set('name')} required />
      <Input label="Email" type="email" value={f.email} onChange={set('email')} required />
      <Input label="Specialty" value={f.specialty} onChange={set('specialty')} required />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy || !dirty} onClick={() => run(() => api.updateTrainer(t.id, f))}>Save changes</Button>
        {t.status === 'DISABLED'
          ? <Button variant="secondary" disabled={busy} onClick={() => run(() => api.setTrainerActive(t.id, true))}>Reactivate trainer</Button>
          : <Button variant="danger" disabled={busy} onClick={() => run(() => api.setTrainerActive(t.id, false))}>Disable trainer</Button>}
      </div>
    </div>
  );
}

export function TrainersTab() {
  const { data, loading, error, reload } = useAsync(() => api.getTrainers(true));
  const [q, setQ] = useState('');
  const [registering, setRegistering] = useState(false);
  const [managing, setManaging] = useState<Trainer | null>(null);

  if (loading) return <Loading />;
  const search = q.toLowerCase();
  const rows = (data ?? []).filter((t) =>
    t.name.toLowerCase().includes(search)
    || t.specialty.toLowerCase().includes(search)
    || t.username.toLowerCase().includes(search));
  const done = () => { setRegistering(false); setManaging(null); reload(); };

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <Notice>Disabling a trainer suspends their login and removes them from booking, but keeps their session history.</Notice>
      <Card
        title="Trainer Information"
        headerTone="maroon"
        action={
          <div className="flex items-center gap-1">
            <CreateButton onClick={() => setRegistering(true)} />
            <SearchBar variant="header" value={q} onChange={setQ} placeholder="Search by name, username, or specialty…" label="Search trainers" />
          </div>
        }
      >
        <Table headers={['Trainer', 'Specialty', 'Status', '']} isEmpty={rows.length === 0} emptyText="No trainers match that search." pageSize={5} resetKey={q} itemLabel="trainers">
          {rows.map((t) => (
            <tr key={t.id}>
              <td className={`${td} font-semibold`}>
                {t.name}
                <span className="block text-xs font-normal text-gray-500">@{t.username} · {t.email}</span>
              </td>
              <td className={td}>{t.specialty}</td>
              <td className={td}><Badge value={t.status} /></td>
              <td className={td}><Button size="sm" variant="secondary" onClick={() => setManaging(t)}>Manage</Button></td>
            </tr>
          ))}
        </Table>
      </Card>
      <Modal isOpen={registering} onClose={() => setRegistering(false)} title="Register trainer" hideFooter><RegisterForm onDone={done} /></Modal>
      <Modal isOpen={!!managing} onClose={() => setManaging(null)} title={managing?.name ?? ''} hideFooter>
        {managing && <ManageTrainer t={managing} onDone={done} />}
      </Modal>
    </>
  );
}
