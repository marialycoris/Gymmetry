package dev.gymmetry.ui;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.*;
import dev.gymmetry.service.Gym;

import java.time.LocalDateTime;
import java.util.List;

public class AdminMenu {
    private final Gym gym;
    private final InputReader in;
    private final Admin admin;

    public AdminMenu(Gym gym, InputReader in, Admin admin) {
        this.gym = gym;
        this.in = in;
        this.admin = admin;
    }

    public void show() {
        while (true) {
            System.out.println("\n╔══════════════════════════════════╗");
            System.out.println("║         ADMIN DASHBOARD          ║");
            System.out.println("╚══════════════════════════════════╝");
            System.out.println("1.  Register member");
            System.out.println("2.  Register trainer");
            System.out.println("3.  Record payment");
            System.out.println("4.  Book session (on behalf)");
            System.out.println("5.  Review declined sessions");
            System.out.println("6.  Override trainer attendance");
            System.out.println("7.  View all members");
            System.out.println("8.  View all trainers");
            System.out.println("9.  View all sessions");
            System.out.println("10. Reports");
            System.out.println("11. Run deadline sweep");
            System.out.println("12. Enable/Disable account");
            System.out.println("0.  Logout");

            int choice = in.readInt("\nChoose: ");
            try {
                switch (choice) {
                    case 1 -> registerMember();
                    case 2 -> registerTrainer();
                    case 3 -> recordPayment();
                    case 4 -> bookSession();
                    case 5 -> reviewDeclines();
                    case 6 -> overrideTrainerAttendance();
                    case 7 -> viewAllMembers();
                    case 8 -> viewAllTrainers();
                    case 9 -> viewAllSessions();
                    case 10 -> showReports();
                    case 11 -> runSweep();
                    case 12 -> toggleAccount();
                    case 0 -> { return; }
                    default -> System.out.println("  ✗ Invalid choice.");
                }
            } catch (RuntimeException e) {
                System.out.println("  ✗ Error: " + e.getMessage());
            }
            in.pause();
        }
    }

    private void registerMember() {
        System.out.println("\n--- REGISTER MEMBER ---");
        String name = in.readLine("Name:  ");
        String email = in.readLine("Email: ");
        String username = in.readLine("Username: ");
        String password = in.readLine("Password: ");
        MembershipPlan plan = pickPlan();
        Member m = gym.registerMember(name, email, plan, username, password);
        System.out.println("  ✓ Member registered: " + m);
    }

    private void registerTrainer() {
        System.out.println("\n--- REGISTER TRAINER ---");
        String name = in.readLine("Name:  ");
        String email = in.readLine("Email: ");
        String username = in.readLine("Username: ");
        String password = in.readLine("Password: ");
        Trainer t = gym.registerTrainer(name, email, username, password);
        System.out.println("  ✓ Trainer registered: " + t);
    }

    private void recordPayment() {
        System.out.println("\n--- RECORD PAYMENT ---");
        int memberId = in.readInt("Member ID: ");
        Member m = gym.findMember(memberId);
        MembershipPlan plan = m.getPlan() != null ? m.getPlan() : pickPlan();
        PaymentMethod method = pickPaymentMethod();
        double amount = in.readDouble("Amount (default " + plan.getTotalPrice() + "): ");
        gym.recordPayment(memberId, plan, amount, method, admin);
        Member updated = gym.findMember(memberId); // Fetch fresh from DB
        System.out.printf("  ✓ Payment recorded. %s is now %s (expires %s)%n",
                updated.getName(), updated.getMembershipStatus(), updated.getExpiryDate());
    }

    private void bookSession() {
        System.out.println("\n--- BOOK SESSION ---");
        int memberId = in.readInt("Member ID: ");
        int trainerId = in.readInt("Trainer ID: ");
        LocalDateTime when = in.readDateTime("Date/time");
        Session s = gym.requestSession(memberId, trainerId, when);
        System.out.println("  ✓ Session created: " + s);
    }

    private void reviewDeclines() {
        System.out.println("\n--- DECLINED SESSIONS ---");
        List<Session> declined = gym.getSessionsByStatus(SessionStatus.DECLINED);
        if (declined.isEmpty()) { System.out.println("  No declined sessions."); return; }
        for (Session s : declined) {
            System.out.printf("  ID=%d | Member=%s | Trainer=%s | %s%n",
                    s.getId(), s.getMember().getName(), s.getTrainer().getName(), s.getScheduledAt());
            System.out.printf("     Reason: %s%n", s.getDeclineReason());
        }
        int id = in.readInt("\nSession ID to act on (0 to skip): ");
        if (id == 0) return;
        Session s = gym.findSession(id);
        int newTrainerId = in.readInt("New trainer ID (0 to cancel session instead): ");
        if (newTrainerId != 0) {
            Trainer newTrainer = gym.findTrainer(newTrainerId);
            s.reschedule(s.getScheduledAt(), newTrainer);
            System.out.println("  ✓ Reassigned to " + newTrainer.getName());
        } else {
            gym.adminMarkTrainerAbsent(id, admin, "Admin approved decline");
            System.out.println("  ✓ Session cancelled.");
        }
    }

    private void overrideTrainerAttendance() {
        System.out.println("\n--- OVERRIDE TRAINER ATTENDANCE ---");
        int sessionId = in.readInt("Session ID: ");
        Session s = gym.findSession(sessionId);
        System.out.println("  Current: " + s.getTrainerStatus());
        System.out.println("  1. Mark PRESENT\n  2. Mark ABSENT");
        int choice = in.readInt("Choose: ");
        String reason = in.readLine("Reason (optional): ");
        TrainerSessionStatus status = choice == 1 ? TrainerSessionStatus.PRESENT : TrainerSessionStatus.ABSENT;
        gym.adminOverrideTrainerStatus(sessionId, admin, status, reason);
        System.out.println("  ✓ Overridden to " + status);
    }

    private void viewAllMembers() {
        System.out.println("\n--- ALL MEMBERS ---");
        for (Member m : gym.getAllMembers()) {
            m.refreshStatus();
            System.out.printf("  ID=%d | %-10s | %-14s | %s (expires %s)%n",
                    m.getId(), m.getName(), m.getPlan().getName(), m.getMembershipStatus(), m.getExpiryDate());
        }
    }

    private void viewAllTrainers() {
        System.out.println("\n--- ALL TRAINERS ---");
        for (Trainer t : gym.getAllTrainers()) {
            System.out.printf("  ID=%d | %-14s | %s%n", t.getId(), t.getName(), t.getSpecialties());
        }
    }

    private void viewAllSessions() {
        System.out.println("\n--- ALL SESSIONS ---");
        for (SessionStatus st : SessionStatus.values()) {
            for (Session s : gym.getSessionsByStatus(st)) {
                System.out.printf("  ID=%d | %-10s vs %-12s | %s | %s | trainer=%s%n",
                        s.getId(), s.getMember().getName(), s.getTrainer().getName(),
                        s.getScheduledAt(), s.getStatus(), s.getTrainerStatus());
            }
        }
    }

    private void showReports() {
        System.out.println("\n--- REPORTS ---");
        System.out.printf("Total revenue:       %.2f%n", gym.getTotalRevenue());
        System.out.println("Sessions by status: " + gym.countSessionsByStatus());
        System.out.println("Members by plan:    " + gym.countMembersByPlan());
    }

    private void runSweep() {
        int count = gym.sweepMissedDeadlines();
        System.out.println("  ✓ Swept " + count + " overdue sessions to NOT_HELD.");
    }

    private void toggleAccount() {
        String username = in.readLine("Username: ");
        System.out.println("  1. Enable\n  2. Disable");
        int c = in.readInt("Choose: ");
        gym.setAccountStatus(username, c == 1);
        System.out.println("  ✓ Account updated.");
    }

    private MembershipPlan pickPlan() {
        System.out.println("  Plans: 1=Basic  2=Premium  3=VIP");
        return switch (in.readInt("  Choose: ")) {
            case 1 -> new BasicPlan();
            case 2 -> new PremiumPlan();
            case 3 -> new VipPlan();
            default -> throw new IllegalArgumentException("Invalid plan");
        };
    }

    private PaymentMethod pickPaymentMethod() {
        System.out.println("  Methods: 1=CASH  2=CARD  3=GCASH  4=MAYA  5=BANK_TRANSFER");
        return switch (in.readInt("  Choose: ")) {
            case 1 -> PaymentMethod.CASH;
            case 2 -> PaymentMethod.CARD;
            case 3 -> PaymentMethod.GCASH;
            default -> throw new IllegalArgumentException("Invalid method");
        };
    }
}