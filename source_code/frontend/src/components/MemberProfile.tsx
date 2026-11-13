import { useState } from 'react';
import { api } from '../api/client';
import { GENDERS, type Member, type MemberUpdateInput } from '../lib/types';
import { fmtDate } from '../lib/format';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { LoadingOverlay } from './Spinner';
import { Notice } from './Widgets';
import { PasswordReset } from './PasswordReset';

const genderOptions = GENDERS.map((g) => ({ value: g, label: g[0] + g.slice(1).toLowerCase() }));

const toInput = (m: Member): MemberUpdateInput => ({
  firstName: m.firstName,
  lastName: m.lastName,
  dateOfBirth: m.dateOfBirth,
  gender: m.gender,
  address: m.address ?? '',
  contactNumber: m.contactNumber,
  emergencyContactNumber: m.emergencyContactNumber,
  medicalCondition: m.medicalCondition ?? '',
  username: m.username,
});

interface MemberProfileProps {
  member: Member;
  onSaved?: (member: Member) => void;
}

/** Read-only member details with an Edit toggle. Reusable anywhere a Member is shown. */
export function MemberProfile({ member, onSaved }: MemberProfileProps) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<MemberUpdateInput>(() => toInput(member));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: keyof MemberUpdateInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });
  const cancel = () => { setF(toInput(member)); setEditing(false); setErr(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const updated = await api.updateMember(member.id, f);
      setF(toInput(updated));
      setEditing(false);
      onSaved?.(updated);
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} className="relative">
        <LoadingOverlay show={busy} label="Saving changes…" />
      {err && <Notice tone="error">{err}</Notice>}
      <div className="grid grid-cols-2 gap-x-4">
        <Input label="First name" value={f.firstName} onChange={set('firstName')} disabled={!editing} required />
        <Input label="Last name" value={f.lastName} onChange={set('lastName')} disabled={!editing} required />
        <Input label="Date of birth" type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} disabled={!editing} required />
        <Select label="Sex at birth" value={f.gender} onChange={set('gender')} options={genderOptions} disabled={!editing} />
        <Input label="Contact number" type="tel" value={f.contactNumber} onChange={set('contactNumber')} disabled={!editing} required />
        <Input label="Emergency contact number" type="tel" value={f.emergencyContactNumber} onChange={set('emergencyContactNumber')} disabled={!editing} required />
      </div>
      <Input label="Address" value={f.address} onChange={set('address')} disabled={!editing} placeholder="Optional" />
      <Input label="Medical condition" value={f.medicalCondition} onChange={set('medicalCondition')} disabled={!editing} placeholder="Leave blank if none" />
      <Input label="Username" value={f.username} onChange={set('username')} disabled={!editing} required />
      <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
        <p className="text-xs text-gray-500">Expires {fmtDate(member.expiresAt)} · Last visit {fmtDate(member.lastAttendance)}</p>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button type="button" variant="secondary" onClick={cancel} disabled={busy}>Cancel</Button>
              <Button type="submit" isLoading={busy}>Save changes</Button>
            </>
          ) : (
            <Button type="button" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </div>
      </form>
      <PasswordReset name={member.name} roleLabel="member" onSubmit={(password) => api.setMemberPassword(member.id, password)} />
    </>
  );
}
