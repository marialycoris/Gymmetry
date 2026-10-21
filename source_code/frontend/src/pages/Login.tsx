import { useState } from 'react';
import { api, USE_MOCK } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Notice } from '../components/Widgets';
import Threads  from '../components/Threads';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      login(await api.login(username, password)); // saves to AuthContext
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.15fr_1fr]">
      <section className="relative overflow-hidden bg-linear-to-r md:bg-linear-to-b from-gym-maroon to-gym-crimson text-white p-8 lg:p-16 flex flex-col justify-between gap-12">
  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
    <Threads
      color="#000000"
      accentColor="#F21137"
      lineCount={90}
      thickness={0.6}
      amplitude={1.7}
      speed={0.6}
      angle={25}
      brightness={1.4}
      enableMouseInteraction
    />
  </div>

  <h1 className="relative font-display font-extrabold uppercase leading-[0.85] text-[clamp(4.5rem,13vw,10rem)]">
    Power<br />and<br />Strength<br />Starts<br />Here
  </h1>
</section>

      <section className="flex items-center justify-center p-8">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
                  <div>
          <div className="font-display text-3xl font-extrabold tracking-wide">GYMMETRY</div>
          <div className="h-1 w-10 bg-gym-crimson mt-1" />
        </div>
          <h2 className="font-display text-4xl font-extrabold uppercase mb-6">Log in</h2>
          {error && <Notice tone="error">{error}</Notice>}
          <Input label="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Input label="Password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>Log in</Button>
          {USE_MOCK && (
            <p className="text-xs text-gray-500 mt-6">
              Demo mode: sign in as <b>admin</b>, <b>trainer</b>, <b>member</b> or <b>newbie</b> (first login) with any password.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}