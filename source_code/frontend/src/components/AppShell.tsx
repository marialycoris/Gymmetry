import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import Particles from './Particles';

export interface NavItem { id: string; label: string }

interface AppShellProps {
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
}

export function AppShell({ nav, active, onNavigate, children }: AppShellProps) {
  const { user, logout } = useAuth();
  const current = nav.find((n) => n.id === active)?.label;

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-linear-to-r md:bg-linear-to-b from-gym-maroon to-gym-crimson text-white md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0">
        <div className="px-5 pt-5 pb-3 md:pt-8 md:pb-6">
          <div className="font-display text-3xl font-extrabold tracking-wide">GYMMETRY</div>
          <div className="h-1 w-10 bg-white mt-1" />
        </div>
        <nav aria-label="Main" className="flex md:flex-col gap-1 px-3 pb-3 overflow-x-auto">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => onNavigate(n.id)}
              aria-current={n.id === active ? 'page' : undefined}
              className={`text-left whitespace-nowrap px-3 py-2 rounded-lg font-semibold border-l-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                n.id === active ? 'bg-black/25 border-white' : 'border-transparent text-white/85 hover:text-white hover:bg-white/10'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="flex items-end justify-between gap-4 px-6 md:px-10 pt-8 pb-5 border-b border-gray-200">
          <h1 className="font-display text-5xl md:text-6xl font-extrabold uppercase leading-none">{current}</h1>
          <div className="flex items-center gap-3 text-sm shrink-0">
            <span className="hidden sm:block text-right leading-tight">
              <span className="block font-bold">{user?.name}</span>
              <span className="block text-gray-500 capitalize">{user?.role.toLowerCase()}</span>
            </span>
            <Button variant="danger" size="sm" onClick={logout}>Log out</Button>
          </div>
        </header>
        <div className="px-6 md:px-10 py-8 space-y-6 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}