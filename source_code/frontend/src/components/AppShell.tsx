import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity, BarChart3, CalendarCheck, CalendarDays, CalendarPlus, ChevronLeft,
  ChevronRight, Circle, ClipboardCheck, CreditCard, Dumbbell, IdCard, Inbox,
  LayoutDashboard, LogOut, Menu, Users, X, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

export interface NavItem { id: string; label: string }

interface AppShellProps {
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
}

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  members: Users,
  trainers: Dumbbell,
  payments: CreditCard,
  sessions: CalendarCheck,
  reports: BarChart3,
  pulse: Activity,
  membership: IdCard,
  book: CalendarPlus,
  requests: Inbox,
  schedule: CalendarDays,
  attendance: ClipboardCheck,
};

interface SidebarProps {
  nav: NavItem[];
  active: string;
  collapsed: boolean;
  mobile: boolean;
  userName?: string;
  userRole?: string;
  onNavigate: (id: string) => void;
  onClose: () => void;
  onLogout: () => void;
  onToggleCollapsed: () => void;
}

function Sidebar({ nav, active, collapsed, mobile, userName, userRole, onNavigate, onClose, onLogout, onToggleCollapsed }: SidebarProps) {
  const rail = !mobile && collapsed;
  return (
    <>
      <div className="px-5 pt-5 pb-3 md:pt-8 md:pb-6">
        <div className={`flex items-center gap-2 ${rail ? 'md:justify-center' : 'justify-between'}`}>
          <div className={`font-display text-3xl font-extrabold tracking-wide ${rail ? 'md:hidden' : ''}`}>GYMMETRY</div>
          {mobile ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          )}
        </div>
        <div className={`h-1 w-10 bg-white mt-1 ${rail ? 'md:hidden' : ''}`} />
      </div>

      <nav aria-label={mobile ? 'Mobile' : 'Main'} className="flex flex-col gap-1 px-3 pb-3 overflow-y-auto">
        {nav.map((n) => {
          const Icon = ICONS[n.id] ?? Circle;
          return (
            <button
              key={n.id}
              onClick={() => onNavigate(n.id)}
              aria-current={n.id === active ? 'page' : undefined}
              title={n.label}
              className={`flex items-center gap-3 text-left whitespace-nowrap px-3 py-2 rounded-lg font-semibold border-l-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${rail ? 'md:justify-center md:px-2' : ''} ${
                n.id === active ? 'bg-black/25 border-white' : 'border-transparent text-white/85 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className={rail ? 'md:hidden' : ''}>{n.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={`px-3 pb-3 mt-auto md:pb-6 ${rail ? 'md:px-3' : 'md:px-5'}`}>
        <div className={`mb-3 text-sm leading-tight ${rail ? 'md:hidden' : ''}`}>
          <span className="block font-bold">{userName}</span>
          <span className="block text-white/75 capitalize">{userRole?.toLowerCase()}</span>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={onLogout}
          title="Log out"
          aria-label="Log out"
          className={`w-full inline-flex items-center justify-center gap-2 ${rail ? 'md:px-0' : ''}`}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className={rail ? 'md:sr-only' : ''}>Log out</span>
        </Button>
      </div>
    </>
  );
}

export function AppShell({ nav, active, onNavigate, children }: AppShellProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = nav.find((n) => n.id === active)?.label;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  const go = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className={`hidden md:flex md:flex-col bg-linear-to-b from-gym-maroon to-gym-crimson text-white md:shrink-0 md:h-screen md:sticky md:top-0 transition-all duration-200 ${collapsed ? 'md:w-16' : 'md:w-60'}`}>
        <Sidebar
          nav={nav}
          active={active}
          collapsed={collapsed}
          mobile={false}
          userName={user?.name}
          userRole={user?.role}
          onNavigate={go}
          onClose={() => setMobileOpen(false)}
          onLogout={logout}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
        />
      </aside>

      <div
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
        <aside className={`relative flex h-full w-72 max-w-[85vw] flex-col bg-linear-to-b from-gym-maroon to-gym-crimson text-white shadow-2xl transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar
            nav={nav}
            active={active}
            collapsed={false}
            mobile
            userName={user?.name}
            userRole={user?.role}
            onNavigate={go}
            onClose={() => setMobileOpen(false)}
            onLogout={() => { setMobileOpen(false); logout(); }}
            onToggleCollapsed={() => {}}
          />
        </aside>
      </div>

      <main className="flex-1 min-w-0">
        <header className="flex items-center gap-3 px-6 md:px-10 pt-6 md:pt-8 pb-5 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gym-black hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-crimson"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold uppercase leading-none">{current}</h1>
        </header>
        <div className="px-6 md:px-10 py-8 space-y-6 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
