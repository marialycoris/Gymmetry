package dev.gymmetry.ui;

import dev.gymmetry.domain.Session;
import dev.gymmetry.domain.Trainer;
import dev.gymmetry.enums.SessionStatus;
import dev.gymmetry.service.Gym;

import java.util.List;

public class TrainerMenu {
    private final Gym gym;
    private final InputReader in;
    private final Trainer trainer;

    public TrainerMenu(Gym gym, InputReader in, Trainer trainer) {
        this.gym = gym;
        this.in = in;
        this.trainer = trainer;
    }

    public void show() {
        while (true) {
            System.out.println("\n╔══════════════════════════════════╗");
            System.out.println("║        TRAINER DASHBOARD         ║");
            System.out.println("╚══════════════════════════════════╝");
            System.out.println("1. Pending session requests");
            System.out.println("2. My upcoming sessions");
            System.out.println("3. Mark member attendance");
            System.out.println("0. Logout");

            int choice = in.readInt("\nChoose: ");
            try {
                switch (choice) {
                    case 1 -> pendingRequests();
                    case 2 -> mySessions();
                    case 3 -> markAttendance();
                    case 0 -> { return; }
                    default -> System.out.println("  ✗ Invalid choice.");
                }
            } catch (RuntimeException e) {
                System.out.println("  ✗ Error: " + e.getMessage());
            }
            in.pause();
        }
    }

    private void pendingRequests() {
        System.out.println("\n--- PENDING REQUESTS ---");
        List<Session> pending = gym.getSessionsForTrainer(trainer.getId()).stream()
                .filter(s -> s.getStatus() == SessionStatus.REQUESTED).toList();
        if (pending.isEmpty()) { System.out.println("  (none)"); return; }

        for (Session s : pending) {
            System.out.printf("  ID=%d | Member=%s | %s%n", s.getId(), s.getMember().getName(), s.getScheduledAt());
        }
        int id = in.readInt("\nSession ID (0 to skip): ");
        if (id == 0) return;

        System.out.println("  1. Accept\n  2. Decline");
        int action = in.readInt("Choose: ");
        if (action == 1) {
            gym.trainerAccept(id, trainer);
            System.out.println("  ✓ Accepted.");
        } else if (action == 2) {
            String reason = in.readLine("Reason: ");
            gym.trainerDecline(id, trainer, reason);
            System.out.println("  ✓ Declined.");
        }
    }

    private void mySessions() {
        System.out.println("\n--- MY SESSIONS ---");
        for (Session s : gym.getSessionsForTrainer(trainer.getId())) {
            System.out.printf("  ID=%d | %-10s | %s | %s | trainer=%s%n",
                    s.getId(), s.getMember().getName(), s.getScheduledAt(), s.getStatus(), s.getTrainerStatus());
        }
    }

    private void markAttendance() {
        System.out.println("\n--- MARK MEMBER ATTENDANCE ---");
        List<Session> scheduled = gym.getSessionsForTrainer(trainer.getId()).stream()
                .filter(s -> s.getStatus() == SessionStatus.SCHEDULED).toList();
        if (scheduled.isEmpty()) { System.out.println("  (none scheduled)"); return; }

        for (Session s : scheduled) {
            System.out.printf("  ID=%d | Member=%s | %s%n", s.getId(), s.getMember().getName(), s.getScheduledAt());
        }
        int id = in.readInt("\nSession ID: ");
        System.out.println("  1. Member PRESENT\n  2. Member NO-SHOW");
        int action = in.readInt("Choose: ");
        if (action == 1) {
            gym.trainerMarkPresent(id, trainer);
            System.out.println("  ✓ Marked present.");
        } else if (action == 2) {
            gym.trainerMarkNoShow(id, trainer);
            System.out.println("  ✓ Marked no-show.");
        }
    }
}