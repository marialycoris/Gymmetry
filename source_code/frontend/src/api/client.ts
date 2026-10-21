import type { User } from '../context/AuthContext';
import type { Member, Trainer, Session, Slot, Payment, Plan, PayMethod, SessionStatus, PulseInsight, Reports } from '../lib/types';
import { mock } from './mock';

const API_URL = 'http://localhost:8080/api';

// TODO: set to false once the backend is connected. While true, every call below
// returns demo data from ./mock.ts. Demo logins: admin, trainer, member, newbie (any password).
export const USE_MOCK = true;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error((await res.text()) || `Request failed (${res.status})`);
  return res.status === 204 ? (undefined as T) : res.json();
}
const send = (method: string, data?: unknown): RequestInit => ({ method, body: data === undefined ? undefined : JSON.stringify(data) });
const qs = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();
  return q ? `?${q}` : '';
};
// Uses the demo data when USE_MOCK is on, otherwise runs the real request.
function call<T>(demo: () => T, real: () => Promise<T>): Promise<T> {
  if (!USE_MOCK) return real();
  return new Promise((resolve, reject) => setTimeout(() => { try { resolve(demo()); } catch (e) { reject(e); } }, 250));
}

export const api = {
  // ---------- Auth ----------
  // POST /auth/login -> { username, role, personId, name, mustChangePassword }
  login: (username: string, password: string) =>
    call(() => mock.login(username, password), () => http<User>('/auth/login', send('POST', { username, password }))),
  // POST /auth/change-password (BCrypt-hash on the server; clears mustChangePassword)
  changePassword: (username: string, newPassword: string) =>
    call(() => mock.changePassword(), () => http<void>('/auth/change-password', send('POST', { username, newPassword }))),

  // ---------- Members & memberships ----------
  // GET /members
  getMembers: () => call(() => mock.getMembers(), () => http<Member[]>('/members')),
  // GET /members/:id
  getMember: (id: number) => call(() => mock.getMember(id), () => http<Member>(`/members/${id}`)),
  // POST /members  (creates the account with a temporary password; first login forces a change)
  registerMember: (input: { name: string; username: string; tempPassword: string; plan: Plan }) =>
    call(() => mock.registerMember(input), () => http<Member>('/members', send('POST', input))),
  // PUT /members/:id/plan
  updateMemberPlan: (id: number, plan: Plan) =>
    call(() => mock.updateMemberPlan(id, plan), () => http<void>(`/members/${id}/plan`, send('PUT', { plan }))),
  // POST /members/:id/renew  (extends expiry and reactivates)
  renewMember: (id: number) =>
    call(() => mock.renewMember(id), () => http<void>(`/members/${id}/renew`, send('POST'))),
  // PUT /members/:id/status  { active }  (manual disable / reactivate)
  setMemberActive: (id: number, active: boolean) =>
    call(() => mock.setMemberActive(id, active), () => http<void>(`/members/${id}/status`, send('PUT', { active }))),

  // ---------- Payments ----------
  // GET /payments?memberId=
  getPayments: (memberId?: number) =>
    call(() => mock.getPayments(memberId), () => http<Payment[]>(`/payments${qs({ memberId })}`)),
  // POST /payments
  recordPayment: (input: { memberId: number; amount: number; method: PayMethod }) =>
    call(() => mock.recordPayment(input), () => http<Payment>('/payments', send('POST', input))),

  // ---------- Trainers & sessions ----------
  // GET /trainers
  getTrainers: () => call(() => mock.getTrainers(), () => http<Trainer[]>('/trainers')),
  // GET /trainers/:id/slots?date=yyyy-mm-dd  (server marks taken slots as available:false)
  getSlots: (trainerId: number, date: string) =>
    call(() => mock.getSlots(trainerId, date), () => http<Slot[]>(`/trainers/${trainerId}/slots${qs({ date })}`)),
  // POST /sessions  (server rejects conflicting bookings with a readable message)
  bookSession: (input: { memberId: number; trainerId: number; date: string; time: string }) =>
    call(() => mock.bookSession(input), () => http<Session>('/sessions', send('POST', input))),
  // GET /sessions?memberId=&trainerId=&status=
  getSessions: (f: { memberId?: number; trainerId?: number; status?: SessionStatus }) =>
    call(() => mock.getSessions(f), () => http<Session[]>(`/sessions${qs(f)}`)),
  // PUT /sessions/:id/response  { accept, reason }  (reason required when accept is false)
  respondToSession: (id: number, accept: boolean, reason?: string) =>
    call(() => mock.respondToSession(id, accept, reason), () => http<void>(`/sessions/${id}/response`, send('PUT', { accept, reason }))),
  // PUT /sessions/:id/reassign  { trainerId }  (admin, declined sessions only)
  reassignSession: (id: number, trainerId: number) =>
    call(() => mock.reassignSession(id, trainerId), () => http<void>(`/sessions/${id}/reassign`, send('PUT', { trainerId }))),
  // PUT /sessions/:id/complete  (trainer; also records member attendance)
  completeSession: (id: number) =>
    call(() => mock.completeSession(id), () => http<void>(`/sessions/${id}/complete`, send('PUT'))),
  // PUT /sessions/:id/attendance  { status }  (admin override)
  overrideAttendance: (id: number, status: 'COMPLETED' | 'NOT_HELD') =>
    call(() => mock.overrideAttendance(id, status), () => http<void>(`/sessions/${id}/attendance`, send('PUT', { status }))),

  // ---------- Reports & Pulse ----------
  // GET /reports/summary
  getReports: () => call(() => mock.getReports(), () => http<Reports>('/reports/summary')),
  // GET /pulse/members  (attendance + booking + membership signals, one insight per member)
  getPulse: () => call(() => mock.getPulse(), () => http<PulseInsight[]>('/pulse/members')),
};