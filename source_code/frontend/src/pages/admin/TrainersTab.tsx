import { useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAsync } from '../../hooks/useAsync';
import { GENDERS, type Gender, type Trainer, type TrainerRegistrationInput } from '../../lib/types';
import { PASSWORD_HINT, passwordError } from '../../lib/password';
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
import { LoadingOverlay } from '../../components/Spinner';
import { Loading, Notice } from '../../components/Widgets';
import { PasswordReset } from '../../components/PasswordReset';

const errorText = (x: unknown) => (x instanceof Error ? x.message : String(x));
const genderOptions = GENDERS.map((g) => ({ value: g, label: g[0] + g.slice(1).toLowerCase() }));

function RegisterForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
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
    const problem = passwordError(f.tempPassword);
    if (problem) { setErr(problem); return; }
    const confirmed = await confirm({
      title: 'Register trainer?',
      message: `Register ${f.firstName} ${f.lastName} as a new trainer?`,
      confirmLabel: 'Register trainer',
    });
    if (!confirmed) return;
    setBusy(true); setErr('');
    try {
      await api.registerTrainer(f);
      toast.success('Trainer registered.');
      onDone();
    } catch (x) { toast.error(errorText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="relative">
      <LoadingOverlay show={busy} label="Registering trainer…" />
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
      <Input label="Temporary password" type="password" value={f.tempPassword} onChange={set('tempPassword')} required minLength={8} />
      <p className="text-xs text-gray-500 -mt-2 mb-4">{PASSWORD_HINT} The trainer must change it on first login.</p>
      <div className="flex justify-end"><Button type="submit" isLoading={busy}>Register trainer</Button></div>
    </form>
  );
}

function ManageTrainer({ t, onDone }: { t: Trainer; onDone: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [f, setF] = useState({ name: t.name, email: t.email, specialty: t.specialty });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(message);
      onDone();
    } catch (x) { toast.error(errorText(x)); } finally { setBusy(false); }
  };
  const dirty = f.name !== t.name || f.email !== t.email || f.specialty !== t.specialty;

  const saveChanges = async () => {
    const confirmed = await confirm({
      title: 'Save trainer changes?',
      message: `Save the changes to ${t.name}'s details?`,
      confirmLabel: 'Save changes',
    });
    if (!confirmed) return;
    await run(() => api.updateTrainer(t.id, f), 'Trainer details saved.');
  };

  const setActive = async (active: boolean) => {
    const confirmed = await confirm(active ? {
      title: 'Reactivate trainer?',
      message: `Reactivate ${t.name}'s account? They will be able to log in and receive bookings again.`,
      confirmLabel: 'Reactivate',
      variant: 'primary',
    } : {
      title: 'Disable trainer?',
      message: `Disable ${t.name}'s account? They will no longer be able to log in or receive bookings.`,
      confirmLabel: 'Disable',
      variant: 'danger',
    });
    if (!confirmed) return;
    await run(() => api.setTrainerActive(t.id, active), active ? 'Trainer reactivated.' : 'Trainer disabled.');
  };

  return (
    <div className="relative">
      <LoadingOverlay show={busy} label="Saving changes…" />
      <Input label="Full name" value={f.name} onChange={set('name')} required />
      <Input label="Email" type="email" value={f.email} onChange={set('email')} required />
      <Input label="Specialty" value={f.specialty} onChange={set('specialty')} required />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy || !dirty} onClick={saveChanges}>Save changes</Button>
        {t.status === 'DISABLED'
          ? <Button variant="secondary" disabled={busy} onClick={() => setActive(true)}>Reactivate trainer</Button>
          : <Button variant="danger" disabled={busy} onClick={() => setActive(false)}>Disable trainer</Button>}
      </div>
      <PasswordReset name={t.name} roleLabel="trainer" onSubmit={(password) => api.setTrainerPassword(t.id, password)} />
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
        <Table
          headers={['Trainer', 'Specialty', 'Status', '']}
          isEmpty={rows.length === 0}
          emptyText={q
            ? 'No trainers match that search.'
            : 'No trainers recorded yet. Use the + button above to register your first trainer.'}
          pageSize={5}
          resetKey={q}
          itemLabel="trainers"
        >
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
