// In-memory demo data so the UI works before the backend is connected.
// Delete this file (and set USE_MOCK = false in client.ts) once API is live.
import type { Member, MemberRegistrationInput, MemberUpdateInput, Trainer, TrainerRegistrationInput, Session, Payment, Plan, PayMethod, SessionStatus, PulseInsight, Reports } from '../lib/types';
import { METHODS, PLANS, STATUSES } from '../lib/types';
import type { User } from '../context/AuthContext';

const iso = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };
const since = (date: string) => Math.round((new Date(iso()).getTime() - new Date(date).getTime()) / 864e5);
const SLOTS = ['06:00', '08:00', '10:00', '16:00', '18:00', '20:00'];
let seq = 100;

const members: Member[] = [
  { id: 1, name: 'Maria Santos', firstName: 'Maria', lastName: 'Santos', username: 'member', dateOfBirth: '1996-04-12', gender: 'FEMALE', address: '12 Mabini St., Makati', contactNumber: '09171234567', emergencyContactNumber: '09181234567', plan: 'PREMIUM', status: 'ACTIVE', joinedAt: iso(-200), expiresAt: iso(24), lastAttendance: iso(-4) },
  { id: 2, name: 'Jon Reyes', firstName: 'Jon', lastName: 'Reyes', username: 'jon', dateOfBirth: '1993-11-02', gender: 'MALE', contactNumber: '09172345678', emergencyContactNumber: '09182345678', plan: 'BASIC', status: 'ACTIVE', joinedAt: iso(-120), expiresAt: iso(5), lastAttendance: iso(-19) },
  { id: 3, name: 'Ana Cruz', firstName: 'Ana', lastName: 'Cruz', username: 'ana', dateOfBirth: '1990-06-25', gender: 'FEMALE', address: '8 Rizal Ave., Pasig', contactNumber: '09173456789', emergencyContactNumber: '09183456789', medicalCondition: 'Asthma', plan: 'VIP', status: 'EXPIRED', joinedAt: iso(-300), expiresAt: iso(-12), lastAttendance: iso(-40) },
  { id: 4, name: 'Paolo Lim', firstName: 'Paolo', lastName: 'Lim', username: 'paolo', dateOfBirth: '1988-01-18', gender: 'MALE', contactNumber: '09174567890', emergencyContactNumber: '09184567890', plan: 'BASIC', status: 'DISABLED', joinedAt: iso(-400), expiresAt: iso(-210), lastAttendance: iso(-200) },
  { id: 5, name: 'Liza Tan', firstName: 'Liza', lastName: 'Tan', username: 'newbie', dateOfBirth: '1999-09-30', gender: 'FEMALE', address: '21 Bonifacio St., Taguig', contactNumber: '09175678901', emergencyContactNumber: '09185678901', medicalCondition: 'Mild scoliosis', plan: 'PREMIUM', status: 'ACTIVE', joinedAt: iso(-60), expiresAt: iso(60), lastAttendance: iso(-9) },
];
const trainers: Trainer[] = [
  { id: 1, name: 'Rico Dela Cruz', firstName: 'Rico', lastName: 'Dela Cruz', email: 'rico@gymmetry.dev', username: 'trainer', gender: 'MALE', contactNumber: '09171112222', address: '14 Katipunan Ave., Quezon City', license: 'PT-0012345', specialty: 'Strength and Conditioning', status: 'ACTIVE' },
  { id: 2, name: 'Bea Mendoza', firstName: 'Bea', lastName: 'Mendoza', email: 'bea@gymmetry.dev', username: 'bea', gender: 'FEMALE', contactNumber: '09172223333', address: '5 Ortigas Ave., Pasig', specialty: 'Group Exercise & Boot Camp', status: 'ACTIVE' },
  { id: 3, name: 'Dan Villanueva', firstName: 'Dan', lastName: 'Villanueva', email: 'dan@gymmetry.dev', username: 'dan', gender: 'MALE', contactNumber: '09173334444', address: '22 España Blvd., Manila', license: 'PT-0067890', specialty: 'Corrective Exercise Specialist (CES)', status: 'ACTIVE' },
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
  // Completed history so Pulse can compare recent activity with previous activity.
  mk(9, 1, 1, -11, '08:00', 'COMPLETED'),
  mk(10, 1, 2, -18, '18:00', 'COMPLETED'),
  mk(11, 1, 1, -33, '10:00', 'COMPLETED'),
  mk(12, 1, 2, -40, '16:00', 'COMPLETED'),
  mk(13, 2, 3, -35, '08:00', 'COMPLETED'),
  mk(14, 2, 2, -44, '10:00', 'COMPLETED'),
  mk(15, 2, 3, -52, '20:00', 'COMPLETED'),
  mk(16, 5, 2, -9, '16:00', 'COMPLETED'),
  mk(17, 5, 1, -16, '06:00', 'COMPLETED'),
  mk(18, 5, 2, -28, '18:00', 'COMPLETED'),
  mk(19, 5, 1, -38, '08:00', 'COMPLETED'),
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
const trainer = (id: number) => { const t = trainers.find((x) => x.id === id); if (!t) throw new Error('Trainer not found.'); return t; };
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
  registerMember(i: MemberRegistrationInput) {
    if (members.some((m) => m.username === i.username)) throw new Error('That username is already taken.');
    if (i.tempPassword.length < 8) throw new Error('Temporary password must be at least 8 characters.');
    const m: Member = {
      id: ++seq,
      name: `${i.firstName} ${i.lastName}`.trim(),
      firstName: i.firstName,
      lastName: i.lastName,
      username: i.username,
      dateOfBirth: i.dateOfBirth,
      gender: i.gender,
      address: i.address?.trim() || undefined,
      contactNumber: i.contactNumber,
      emergencyContactNumber: i.emergencyContactNumber,
      medicalCondition: i.medicalCondition?.trim() || undefined,
      plan: i.plan,
      status: 'ACTIVE',
      joinedAt: iso(),
      expiresAt: iso(30),
      lastAttendance: null,
    };
    members.push(m);
    return { ...m };
  },
  updateMember(id: number, i: MemberUpdateInput): Member {
    const m = member(id);
    const username = i.username.toLowerCase();
    const currentUser = Object.values(USERS).find((u) => u.role === 'MEMBER' && u.personId === id);
    const taken = members.some((x) => x.id !== id && x.username.toLowerCase() === username)
      || trainers.some((t) => t.username.toLowerCase() === username)
      || (!!USERS[username] && USERS[username] !== currentUser);
    if (taken) throw new Error('That username is already taken.');

    m.firstName = i.firstName;
    m.lastName = i.lastName;
    m.name = `${i.firstName} ${i.lastName}`.trim();
    m.dateOfBirth = i.dateOfBirth;
    m.gender = i.gender;
    m.address = i.address?.trim() || undefined;
    m.contactNumber = i.contactNumber;
    m.emergencyContactNumber = i.emergencyContactNumber;
    m.medicalCondition = i.medicalCondition?.trim() || undefined;
    m.username = i.username;

    if (currentUser) {
      delete USERS[currentUser.username.toLowerCase()];
      currentUser.username = i.username;
      currentUser.name = m.name;
      USERS[username] = currentUser;
    }
    sessions.forEach((s) => { if (s.memberId === id) s.memberName = m.name; });
    payments.forEach((p) => { if (p.memberId === id) p.memberName = m.name; });
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

  getTrainers: (includeDisabled = false) =>
    trainers.filter((t) => includeDisabled || t.status === 'ACTIVE').map((t) => ({ ...t })),
  registerTrainer(i: TrainerRegistrationInput) {
    const taken = members.some((m) => m.username === i.username)
      || trainers.some((t) => t.username === i.username)
      || !!USERS[i.username.toLowerCase()];
    if (taken) throw new Error('That username is already taken.');
    if (i.tempPassword.length < 8) throw new Error('Temporary password must be at least 8 characters.');
    const t: Trainer = {
      id: ++seq,
      name: `${i.firstName} ${i.lastName}`.trim(),
      firstName: i.firstName,
      lastName: i.lastName,
      email: i.email,
      username: i.username,
      gender: i.gender,
      contactNumber: i.contactNumber,
      address: i.address,
      license: i.license?.trim() || undefined,
      specialty: i.specialty,
      status: 'ACTIVE',
    };
    trainers.push(t);
    USERS[i.username.toLowerCase()] = { username: i.username, role: 'TRAINER', personId: t.id, name: t.name, mustChangePassword: true };
    return { ...t };
  },
  updateTrainer(id: number, i: { name: string; email: string; specialty: string }) {
    const t = trainer(id);
    if (trainers.some((x) => x.id !== id && x.email === i.email)) throw new Error('That email is already registered.');
    t.name = i.name;
    t.email = i.email;
    t.specialty = i.specialty;
    const user = Object.values(USERS).find((u) => u.role === 'TRAINER' && u.personId === id);
    if (user) user.name = i.name;
    return { ...t };
  },
  setTrainerActive(id: number, active: boolean): void { trainer(id).status = active ? 'ACTIVE' : 'DISABLED'; },
  getSlots: (trainerId: number, date: string) => SLOTS.map((time) => ({ time, available: !slotTaken(trainerId, date, time) })),
  bookSession(i: { memberId: number; trainerId: number; date: string; time: string }) {
    if (member(i.memberId).status !== 'ACTIVE') throw new Error('Only active members can book sessions.');
    if (trainer(i.trainerId).status !== 'ACTIVE') throw new Error('That trainer is not available for booking.');
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
  completeSession(id: number, note?: string): void {
    const s = session(id); s.status = 'COMPLETED'; s.completionNote = note?.trim() || undefined;
    member(s.memberId).lastAttendance = s.date;
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
    const today = new Date(iso()).getTime();
    const DAY = 864e5;
    const daysAgo = (date: string) => Math.round((today - new Date(date).getTime()) / DAY);
    const completed = (id: number) => sessions.filter((s) => s.memberId === id && s.status === 'COMPLETED');
    const upcoming = (id: number) => sessions.filter((s) => s.memberId === id && (s.status === 'PENDING' || s.status === 'ACCEPTED') && daysAgo(s.date) < 0);

    return members.flatMap((m): PulseInsight[] => {
      if (m.status === 'DISABLED') return [];

      // Attendance history comes from completed sessions; lastAttendance is a fallback.
      const visits = completed(m.id).map((s) => s.date);
      const attended = [...visits, ...(m.lastAttendance ? [m.lastAttendance] : [])];
      const lastVisit = attended.length ? Math.max(...attended.map((d) => new Date(d).getTime())) : null;
      const idle = lastVisit === null ? since(m.joinedAt) : Math.round((today - lastVisit) / DAY);
      const left = -since(m.expiresAt);
      const expiredDays = -left;
      const recentVisits = visits.filter((d) => { const x = daysAgo(d); return x >= 0 && x <= 30; }).length;
      const previousVisits = visits.filter((d) => { const x = daysAgo(d); return x > 30 && x <= 60; }).length;
      const upcomingBookings = upcoming(m.id).length;
      const missed = sessions.filter((s) => s.memberId === m.id && s.status === 'NOT_HELD' && daysAgo(s.date) >= 0 && daysAgo(s.date) <= 60).length;

      const base = { memberId: m.id, name: m.name, recentVisits, previousVisits, upcomingBookings, daysLeft: left };
      const attendanceDetail = `Last visit ${idle} day${idle === 1 ? '' : 's'} ago. ${recentVisits} visit${recentVisits === 1 ? '' : 's'} in the last 30 days vs ${previousVisits} in the previous 30.`;
      const bookingDetail = upcomingBookings > 0 ? ` ${upcomingBookings} upcoming booking${upcomingBookings === 1 ? '' : 's'}.` : '';
      const expiryNote = left >= 0 && left <= 7 ? ` Membership ends in ${left} day${left === 1 ? '' : 's'}.` : '';

      if (m.status === 'EXPIRED') {
        if (expiredDays >= 150) return [{ ...base, level: 'FOLLOW_UP', signal: 'Account will be auto-disabled soon', detail: `Membership expired ${expiredDays} days ago. ${attendanceDetail}`, suggestion: 'Call the member now to renew before the six-month auto-disable.' }];
        return [{ ...base, level: 'FOLLOW_UP', signal: 'Membership expired', detail: `Membership expired ${expiredDays} day${expiredDays === 1 ? '' : 's'} ago. ${attendanceDetail}`, suggestion: 'Reach out to offer a renewal and help them book their next session.' }];
      }

      if (idle >= 150) return [{ ...base, level: 'FOLLOW_UP', signal: 'Inactive for five months', detail: `No attendance for ${idle} days.${bookingDetail}`, suggestion: 'Call the member to check in and offer a reason to return before the account is auto-disabled.' }];

      // Declining attendance compared with the member's previous activity.
      const declining = previousVisits > 0 && recentVisits < previousVisits;
      const stopped = recentVisits === 0 && visits.length > 0 && idle >= 14;
      if (declining || stopped) {
        return [{ ...base, level: 'WATCH', signal: declining ? 'Attendance is declining' : 'Attendance has stopped', detail: `${attendanceDetail}${expiryNote}${bookingDetail}`, suggestion: 'Send a check-in and help them book a session this week.' }];
      }

      if (idle >= 14) return [{ ...base, level: 'WATCH', signal: 'Attendance has dropped', detail: `No visit in ${idle} days.${expiryNote}${bookingDetail}`, suggestion: 'Follow up to see what changed and offer a session slot.' }];

      if (left >= 0 && left <= 7) return [{ ...base, level: 'WATCH', signal: 'Membership ending soon', detail: `Membership ends in ${left} day${left === 1 ? '' : 's'}. ${attendanceDetail}${bookingDetail}`, suggestion: 'Offer a renewal before the plan expires.' }];

      if (missed >= 2) return [{ ...base, level: 'WATCH', signal: 'Missed sessions recently', detail: `${missed} sessions were not held in the last 60 days. ${attendanceDetail}${bookingDetail}`, suggestion: 'Follow up to confirm their schedule and rebook.' }];

      return [{
        ...base,
        level: 'POSITIVE',
        signal: upcomingBookings > 0 ? 'Attending regularly with sessions booked' : 'Attending regularly',
        detail: `${attendanceDetail}${bookingDetail}`,
        suggestion: upcomingBookings > 0 ? 'No action needed — keep it up.' : 'No action needed; encourage them to book their next session.',
      }];
    }).sort((a, b) => order[a.level] - order[b.level] || a.name.localeCompare(b.name));
  },
};