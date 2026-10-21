package dev.gymmetry.ui;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.SessionStatus;
import dev.gymmetry.service.Gym;

import java.time.LocalDateTime;
import java.util.List;

public class MemberMenu {
    private final Gym gym;
    private final InputReader in;
    private final Member member;

    public MemberMenu(Gym gym, InputReader in, Member member) {
        this.gym = gym;
        this.in = in;
        this.member = member;
    }

    public void show() {
        while (true) {
            member.refreshStatus();
            System.out.println();
            if (member.isMembershipValid()) {
                System.out.printf("Status: ACTIVE — %d days remaining (expires %s)%n", member.daysRemaining(), member.getExpiryDate());
            } else {
                System.out.printf("⚠ Status: %s — bookings disabled.%n", member.getMembershipStatus());
            }

            System.out.println("\n╔══════════════════════════════════╗");
            System.out.println("║         MEMBER DASHBOARD         ║");
            System.out.println("╚══════════════════════════════════╝");
            System.out.println("1. Book a session");
            System.out.println("2. My upcoming sessions");
            System.out.println("3. My attendance history");
            System.out.println("4. My membership");
            System.out.println("0. Logout");

            int choice = in.readInt("\nChoose: ");
            try {
                switch (choice) {
                    case 1 -> bookSession();
                    case 2 -> upcomingSessions();
                    case 3 -> attendanceHistory();
                    case 4 -> membershipInfo();
                    case 0 -> { return; }
                    default -> System.out.println("  ✗ Invalid choice.");
                }
            } catch (RuntimeException e) {
                System.out.println("  ✗ " + e.getMessage());
            }
            in.pause();
        }
    }

    private void bookSession() {
        System.out.println("\n--- BOOK SESSION ---");
        if (!member.isMembershipValid()) {
            System.out.println("  🔒 Booking disabled — membership is " + member.getMembershipStatus());
            return;
        }
        LocalDateTime when = in.readDateTime("Preferred date/time");
        List<Trainer> available = gym.getAvailableTrainers(when);
        if (available.isEmpty()) { System.out.println("  No trainers available at that time."); return; }
        
        for (Trainer t : available) {
            System.out.printf("    ID=%d | %-14s | %s%n", t.getId(), t.getName(), t.getSpecialties());
        }
        int trainerId = in.readInt("  Trainer ID: ");
        Session s = gym.requestSession(member.getId(), trainerId, when);
        System.out.println("  ✓ Session requested: " + s);
    }

    private void upcomingSessions() {
        System.out.println("\n--- MY UPCOMING SESSIONS ---");
        List<Session> mine = gym.getSessionsForMember(member.getId());
        if (mine.isEmpty()) { System.out.println("  (none)"); return; }
        for (Session s : mine) {
            System.out.printf("  ID=%d | Trainer=%-14s | %s | %s%n",
                    s.getId(), s.getTrainer().getName(), s.getScheduledAt(), s.getStatus());
        }
        int id = in.readInt("\nSession ID to manage (0 to skip): ");
        if (id == 0) return;
        
        Session s = gym.findSession(id);
        if (s.getStatus() != SessionStatus.REQUESTED && s.getStatus() != SessionStatus.SCHEDULED && s.getStatus() != SessionStatus.DECLINED) {
            System.out.println("  Session is " + s.getStatus() + " — cannot edit."); return;
        }
        
        System.out.println("  1. Reschedule\n  2. Cancel");
        int action = in.readInt("Choose: ");
        if (action == 1) {
            LocalDateTime newTime = in.readDateTime("New date/time");
            int newTrainerId = in.readInt("New trainer ID (same as current = " + s.getTrainer().getId() + "): ");
            Trainer newTrainer = gym.findTrainer(newTrainerId);
            gym.memberReschedule(id, member, newTime, newTrainer);
            System.out.println("  ✓ Rescheduled.");
        } else if (action == 2) {
            gym.memberCancel(id, member);
            System.out.println("  ✓ Cancelled.");
        }
    }

    private void attendanceHistory() {
        System.out.println("\n--- MY ATTENDANCE ---");
        List<AttendanceRecord> records = gym.getAttendanceForMember(member.getId());
        if (records.isEmpty()) { System.out.println("  (none)"); return; }
        for (AttendanceRecord a : records) {
            System.out.printf("  %s — Trainer: %s%n", a.getRecordedAt(), a.getTrainer().getName());
        }
    }

    private void membershipInfo() {
        System.out.println("\n--- MY MEMBERSHIP ---");
        System.out.println("Plan:    " + member.getPlan().getName());
        System.out.println("Status:  " + member.getMembershipStatus());
        System.out.println("Start:   " + member.getStartDate());
        System.out.println("Expires: " + member.getExpiryDate());
        System.out.println("Days remaining: " + member.daysRemaining());
    }
}