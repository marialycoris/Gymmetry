import { useState } from 'react';
import { PASSWORD_HINT, passwordError } from '../lib/password';
import { Button } from './Button';
import { Input } from './Input';
import { Notice } from './Widgets';

interface PasswordResetProps {
  name: string;
  roleLabel: 'member' | 'trainer';
  onSubmit: (password: string) => Promise<void>;
}

/** Admin-only: set a temporary password that forces a change on the next login. */
export function PasswordReset({ name, roleLabel, onSubmit }: PasswordResetProps) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setDone(false);
    const problem = passwordError(password);
    if (problem) { setErr(problem); return; }
    setBusy(true);
    try {
      await onSubmit(password);
      setPassword('');
      setDone(true);
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Could not set the password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h3 className="font-bold text-gym-black">Reset password</h3>
      <p className="text-xs text-gray-500 mb-3">
        Set a temporary password for {name}. The {roleLabel} must change it the next time they log in.
      </p>
      {err && <Notice tone="error">{err}</Notice>}
      {done && <Notice tone="success">Temporary password set. Ask the {roleLabel} to log in and change it.</Notice>}
      <form onSubmit={submit}>
        <Input label="Temporary password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <p className="text-xs text-gray-500 -mt-2 mb-4">{PASSWORD_HINT}</p>
        <div className="flex justify-end"><Button type="submit" variant="secondary" isLoading={busy}>Set password</Button></div>
      </form>
    </div>
  );
}
