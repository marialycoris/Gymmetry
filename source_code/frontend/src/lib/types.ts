export type Plan = 'BASIC' | 'PREMIUM' | 'VIP';
export type Gender = 'MALE' | 'FEMALE';
export type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED';
export type SessionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'NOT_HELD';
export type PayMethod = 'CASH' | 'CARD' | 'E_WALLET';
export type PulseLevel = 'FOLLOW_UP' | 'WATCH' | 'POSITIVE';
export type TrainerStatus = 'ACTIVE' | 'DISABLED';

export const PLANS: Plan[] = ['BASIC', 'PREMIUM', 'VIP'];
export const GENDERS: Gender[] = ['MALE', 'FEMALE'];
export const METHODS: PayMethod[] = ['CASH', 'CARD', 'E_WALLET'];
export const STATUSES: SessionStatus[] = ['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'NOT_HELD'];

// TODO: replace with your real plan prices (or load them from the API)
export const PLAN_PRICE: Record<Plan, number> = { BASIC: 800, PREMIUM: 1500, VIP: 2500 };

export interface Member {
  id: number; name: string; firstName: string; lastName: string; username: string;
  dateOfBirth: string; gender: Gender; address?: string;
  contactNumber: string; emergencyContactNumber: string; medicalCondition?: string;
  plan: Plan; status: MemberStatus; joinedAt: string; expiresAt: string; lastAttendance: string | null;
}
export interface MemberRegistrationInput {
  firstName: string; lastName: string; dateOfBirth: string; gender: Gender;
  address?: string; contactNumber: string; emergencyContactNumber: string; medicalCondition?: string;
  username: string; tempPassword: string; plan: Plan;
}
export interface MemberUpdateInput {
  firstName: string; lastName: string; dateOfBirth: string; gender: Gender;
  address?: string; contactNumber: string; emergencyContactNumber: string; medicalCondition?: string;
  username: string;
}
export interface Trainer {
  id: number; name: string; firstName: string; lastName: string; email: string; username: string;
  gender: Gender; contactNumber: string; address: string; license?: string;
  specialty: string; status: TrainerStatus;
}
export interface TrainerRegistrationInput {
  firstName: string; lastName: string; email: string; gender: Gender;
  contactNumber: string; address: string; license?: string;
  specialty: string; username: string; tempPassword: string;
}
export interface Session {
  id: number; memberId: number; memberName: string; trainerId: number; trainerName: string;
  date: string; time: string; status: SessionStatus; declineReason?: string; completionNote?: string;
}
export interface Slot { time: string; available: boolean }
export interface Payment {
  id: number; memberId: number; memberName: string; amount: number; method: PayMethod; paidAt: string;
}
export interface PulseInsight {
  memberId: number; name: string; level: PulseLevel; signal: string; detail: string; suggestion: string;
  recentVisits: number; previousVisits: number; upcomingBookings: number; daysLeft: number;
}
export interface Reports {
  revenueTotal: number;
  revenueByMethod: Record<PayMethod, number>;
  activeMembers: number;
  inactiveMembers: number;
  sessionsByStatus: Record<SessionStatus, number>;
  membersByPlan: Record<Plan, number>;
  trainerAttendance: { trainerId: number; name: string; held: number; notHeld: number }[];
}