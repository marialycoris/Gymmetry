import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Notice } from '../components/Widgets';

// Shown instead of the dashboard until the user replaces their temporary password.
export function ChangePassword() {
  const { user, login, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await api.changePassword(user!.username, password);
      login({ ...user!, mustChangePassword: false });
    } catch (err: any) {
      setError(err.message || 'Could not change the password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gym-maroon p-6">
      <Card className="w-full max-w-md">
        <h1 className="font-display text-4xl font-extrabold uppercase mb-1">Set a new password</h1>
        <p className="text-gray-600 mb-6">Hi {user?.name}. Replace your temporary password before you continue.</p>
        {error && <Notice tone="error">{error}</Notice>}
        <form onSubmit={submit}>
          <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <div className="flex gap-2 mt-2">
            <Button type="submit" isLoading={busy}>Save password</Button>
            <Button type="button" variant="secondary" onClick={logout}>Log out</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}