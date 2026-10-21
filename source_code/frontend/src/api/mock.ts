// In-memory demo data so the UI works before the backend is connected.
// Delete this file (and set USE_MOCK = false in client.ts) once your API is live.
import type { Member, Trainer, Session, Payment, Plan, PayMethod, SessionStatus, PulseInsight, Reports } from '../lib/types';
import { METHODS, PLANS, STATUSES } from '../lib/types';
import type { User } from '../context/AuthContext';

const iso = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };
const since = (date: string) => Math.round((new Date(iso()).getTime() - new Date(date).getTime()) / 864e5);
const SLOTS = ['06:00', '08:00', '10:00', '16:00', '18:00', '20:00'];
let seq = 100;

const members: Member[] = [
  { id: 1, name: 'Maria Santos', username: 'member', plan: 'PREMIUM', status: 'ACTIVE', joinedAt: iso(-200), expiresAt: iso(24), lastAttendance: iso(-4) },
  { id: 2, name: 'Jon Reyes', username: 'jon', plan: 'BASIC', status: 'ACTIVE', joinedAt: iso(-120), expiresAt: iso(5), lastAttendance: iso(-19) },
  { id: 3, name: 'Ana Cruz', username: 'ana', plan: 'VIP', status: 'EXPIRED', joinedAt: iso(-300), expiresAt: iso(-12), lastAttendance: iso(-40) },
  { id: 4, name: 'Paolo Lim', username: 'paolo', plan: 'BASIC', status: 'DISABLED', joinedAt: iso(-400), expiresAt: iso(-210), lastAttendance: iso(-200) },
  { id: 5, name: 'Liza Tan', username: 'newbie', plan: 'PREMIUM', status: 'ACTIVE', joinedAt: iso(-60), expiresAt: iso(60), lastAttendance: iso(-2) },
];
const trainers: Trainer[] = [
  { id: 1, name: 'Coach Rico', specialty: 'Strength' },
  { id: 2, name: 'Coach Bea', specialty: 'Cardio and HIIT' },
  { id: 3, name: 'Coach Dan', specialty: 'Mobility' },
];
const nameOf = (id: number) => members.find((m) => m.id === id)!.name;
const trainerName = (id: number) => trainers.find((t) => t.id === id)!.name;
const mk = (id: number, memberId: number, trainerId: number, date: number, time: string, status: SessionStatus, declineReason?: string): Session =>
  ({ id, memberId, memberName: nameOf(memberId), trainerId, trainerName: trainerName(trainerId), date: iso(date), time, status, declineReason });

let sessions: Session[] = [
  mk(1, 1, 1, 1, '10:00', 'PENDING'),
  mk(2, 5, 2, 2, '16:00', 'PENDING'),
  mk(3, 2, 3, 1, '08:00', 'DECLINED', 'Fully booked that morning'),
  mk(4, 1, 1, 0, '18:00', 'ACCEPTED'),
  mk(5, 1, 2, -4, '18:00', 'COMPLETED'),
  mk(6, 5, 1, -2, '06:00', 'NOT_HELD'),
  mk(7, 5, 1, 3, '20:00', 'ACCEPTED'),
  mk(8, 2, 2, -19, '10:00', 'COMPLETED'),
];
const payments: Payment[] = [
  { id: 1, memberId: 1, memberName: 'Maria Santos', amount: 1500, method: 'E_WALLET', paidAt: iso(-6) },
  { id: 2, memberId: 2, memberName: 'Jon Reyes', amount: 800, method: 'CASH', paidAt: iso(-25) },
  { id: 3, memberId: 5, memberName: 'Liza Tan', amount: 1500, method: 'CARD', paidAt: iso(-30) },
  { id: 4, memberId: 3, memberName: 'Ana Cruz', amount: 2500, method: 'CARD', paidAt: iso(-42) },
];

const USERS: Record<string, User> = {
  admin: { username: 'admin', role: 'ADMIN', personId: 0, name: 'Gym Admin' },
  trainer: { username: 'trainer', role: 'TRAINER', personId: 1, name: 'Coach Rico' },
  member: { username: 'member', role: 'MEMBER', personId: 1, name: 'Maria Santos' },
  newbie: { username: 'newbie', role: 'MEMBER', personId: 5, name: 'Liza Tan', mustChangePassword: true },
};
const isOpen = (s: Session) => s.status !== 'DECLINED';
const member = (id: number) => { const m = members.find((x) => x.id === id); if (!m) throw new Error('Member not found.'); return m; };
const session = (id: number) => { const s = sessions.find((x) => x.id === id); if (!s) throw new Error('Session not found.'); return s; };
const slotTaken = (trainerId: number, date: string, time: string) =>
  sessions.some((s) => s.trainerId === trainerId && s.date === date && s.time === time && isOpen(s));

export const mock = {
  login(username: string, password: string): User {
    const u = USERS[username.toLowerCase()];
    if (!u || !password) throw new Error('Invalid username or password.');
    return { ...u };
  },
  changePassword(): void {},

  getMembers: () => members.map((m) => ({ ...m })),
  getMember: (id: number) => ({ ...member(id) }),
  registerMember(i: { name: string; username: string; tempPassword: string; plan: Plan }) {
    if (members.some((m) => m.username === i.username)) throw new Error('That username is already taken.');
    if (i.tempPassword.length < 8) throw new Error('Temporary password must be at least 8 characters.');
    const m: Member = { id: ++seq, name: i.name, username: i.username, plan: i.plan, status: 'ACTIVE', joinedAt: iso(), expiresAt: iso(30), lastAttendance: null };
    members.push(m);
    return { ...m };
  },
  updateMemberPlan(id: number, plan: Plan): void { member(id).plan = plan; },
  renewMember(id: number): void {
    const m = member(id);
    const base = since(m.expiresAt) < 0 ? m.expiresAt : iso();
    const d = new Date(`${base}T00:00`); d.setDate(d.getDate() + 30);
    m.expiresAt = d.toLocaleDateString('en-CA'); m.status = 'ACTIVE';
  },
  setMemberActive(id: number, active: boolean): void {
    const m = member(id);
    m.status = active ? (since(m.expiresAt) > 0 ? 'EXPIRED' : 'ACTIVE') : 'DISABLED';
  },

  getPayments: (memberId?: number) => payments.filter((p) => !memberId || p.memberId === memberId).sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
  recordPayment(i: { memberId: number; amount: number; method: PayMethod }) {
    if (!(i.amount > 0)) throw new Error('Enter an amount greater than zero.');
    const p: Payment = { id: ++seq, memberId: i.memberId, memberName: nameOf(i.memberId), amount: i.amount, method: i.method, paidAt: iso() };
    payments.push(p);
    return p;
  },

  getTrainers: () => [...trainers],
  getSlots: (trainerId: number, date: string) => SLOTS.map((time) => ({ time, available: !slotTaken(trainerId, date, time) })),
  bookSession(i: { memberId: number; trainerId: number; date: string; time: string }) {
    if (member(i.memberId).status !== 'ACTIVE') throw new Error('Only active members can book sessions.');
    if (slotTaken(i.trainerId, i.date, i.time)) throw new Error('That slot was just taken. Pick another time.');
    if (sessions.some((s) => s.memberId === i.memberId && s.date === i.date && s.time === i.time && isOpen(s)))
      throw new Error('You already have a session at this time.');
    const s = mk(++seq, i.memberId, i.trainerId, 0, i.time, 'PENDING'); s.date = i.date;
    sessions.push(s);
    return s;
  },
  getSessions: (f: { memberId?: number; trainerId?: number; status?: SessionStatus }) =>
    sessions.filter((s) => (!f.memberId || s.memberId === f.memberId) && (!f.trainerId || s.trainerId === f.trainerId) && (!f.status || s.status === f.status)).map((s) => ({ ...s })),
  respondToSession(id: number, accept: boolean, reason?: string): void {
    if (!accept && !reason?.trim()) throw new Error('A reason is required when declining.');
    const s = session(id);
    s.status = accept ? 'ACCEPTED' : 'DECLINED';
    s.declineReason = accept ? undefined : reason!.trim();
  },
  reassignSession(id: number, trainerId: number): void {
    const s = session(id);
    if (slotTaken(trainerId, s.date, s.time)) throw new Error(`${trainerName(trainerId)} is already booked at that time.`);
    Object.assign(s, { trainerId, trainerName: trainerName(trainerId), status: 'PENDING', declineReason: undefined });
  },
  completeSession(id: number): void {
    const s = session(id); s.status = 'COMPLETED'; member(s.memberId).lastAttendance = s.date;
  },
  overrideAttendance(id: number, status: 'COMPLETED' | 'NOT_HELD'): void {
    const s = session(id); s.status = status;
    if (status === 'COMPLETED') member(s.memberId).lastAttendance = s.date;
  },

  getReports(): Reports {
    const sum = (m?: PayMethod) => payments.filter((p) => !m || p.method === m).reduce((t, p) => t + p.amount, 0);
    const tally = <K extends string>(keys: K[], pick: (k: K) => number) => Object.fromEntries(keys.map((k) => [k, pick(k)])) as Record<K, number>;
    return {
      revenueTotal: sum(),
      revenueByMethod: tally(METHODS, sum),
      activeMembers: members.filter((m) => m.status === 'ACTIVE').length,
      inactiveMembers: members.filter((m) => m.status !== 'ACTIVE').length,
      sessionsByStatus: tally(STATUSES, (k) => sessions.filter((s) => s.status === k).length),
      membersByPlan: tally(PLANS, (k) => members.filter((m) => m.plan === k).length),
      trainerAttendance: trainers.map((t) => ({
        trainerId: t.id, name: t.name,
        held: sessions.filter((s) => s.trainerId === t.id && s.status === 'COMPLETED').length,
        notHeld: sessions.filter((s) => s.trainerId === t.id && s.status === 'NOT_HELD').length,
      })),
    };
  },
  getPulse(): PulseInsight[] {
    const order = { FOLLOW_UP: 0, WATCH: 1, POSITIVE: 2 };
    return members.flatMap((m): PulseInsight[] => {
      if (m.status === 'DISABLED') return [];
      const idle = since(m.lastAttendance ?? m.joinedAt);
      const left = -since(m.expiresAt);
      const base = { memberId: m.id, name: m.name };
      if (idle >= 150) return [{ ...base, level: 'FOLLOW_UP', signal: 'Close to the six-month auto-disable', detail: `No attendance for ${idle} days.` }];
      if (m.status === 'EXPIRED') return [{ ...base, level: 'FOLLOW_UP', signal: 'Membership expired', detail: `Expired ${-left} days ago. Last visit ${idle} days ago.` }];
      if (idle >= 14) return [{ ...base, level: 'WATCH', signal: 'Attendance has dropped', detail: `No visit in ${idle} days.${left <= 7 ? ` Membership ends in ${left} days.` : ''}` }];
      if (left <= 7) return [{ ...base, level: 'WATCH', signal: 'Membership ending soon', detail: `Ends in ${left} days.` }];
      return [{ ...base, level: 'POSITIVE', signal: 'Attending regularly', detail: `Last visit ${idle} days ago.` }];
    }).sort((a, b) => order[a.level] - order[b.level]);
  },
};