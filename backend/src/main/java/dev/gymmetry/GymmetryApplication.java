package dev.gymmetry;

import java.time.LocalDateTime;

import dev.gymmetry.domain.Admin;
import dev.gymmetry.domain.BasicPlan;
import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.PremiumPlan;
import dev.gymmetry.domain.Session;
import dev.gymmetry.domain.Trainer;
import dev.gymmetry.enums.PaymentMethod;
import dev.gymmetry.service.AuthService;
import dev.gymmetry.service.Gym;

public class GymmetryApplication {

    public static void main(String[] args) {

        AuthService auth = new AuthService();
        Gym gym = new Gym(auth);

        // --- Seed admin (hardcoded for now, will be seeded properly in Phase 4) ---
        Admin admin = new Admin(0, "Root Admin", "admin@gymmetry.dev");
        auth.createUser("admin", "admin123", admin);

        // --- Admin registers a trainer ---
        Trainer marco = gym.registerTrainer(
                "Coach Marco", "marco@gymmetry.dev", "marco", "marco123");
        marco.addSpecialty("Strength");

        // --- Admin registers members ---
        Member alice = gym.registerMember(
                "Alice", "alice@example.com", new PremiumPlan(), "alice", "alice123");
        Member bob = gym.registerMember(
                "Bob", "bob@example.com", new BasicPlan(), "bob", "bob123");

        System.out.println("=== REGISTERED ===");
        System.out.printf("Alice status: %s%n", alice.getMembershipStatus());
        System.out.printf("Bob status:   %s%n%n", bob.getMembershipStatus());

        // --- Admin records Alice's payment ---
        gym.recordPayment(alice.getId(), alice.getPlan(),
                alice.getPlan().getTotalPrice(), PaymentMethod.CARD, admin);

        System.out.println("=== AFTER PAYMENT ===");
        System.out.printf("Alice: %s, expires %s (%d days left)%n%n",
                alice.getMembershipStatus(), alice.getExpiryDate(),
                alice.daysRemaining());

        // --- Alice books a session ---
        LocalDateTime slot = LocalDateTime.now().plusDays(5).withHour(9).withMinute(0);
        Session s1 = gym.requestSession(alice.getId(), marco.getId(), slot);
        System.out.println("=== BOOKING ===");
        System.out.println("Alice booked: " + s1.getStatus());

        // --- Trainer accepts ---
        gym.trainerAccept(s1.getId(), marco);
        System.out.println("Trainer accepted: " + s1.getStatus());

        // --- Trainer marks present ---
        gym.trainerMarkPresent(s1.getId(), marco);
        System.out.println("Marked present: " + s1.getStatus()
                + " / trainer " + s1.getTrainerStatus());
        System.out.println();

        // --- Bob tries to book without paying ---
        System.out.println("=== BOB TRIES TO BOOK ===");
        try {
            gym.requestSession(bob.getId(), marco.getId(),
                    LocalDateTime.now().plusDays(6).withHour(10).withMinute(0));
        } catch (RuntimeException e) {
            System.out.println("Blocked: " + e.getMessage());
        }
        System.out.println();

        // --- Reports ---
        System.out.println("=== REPORTS ===");
        System.out.println("Sessions by status: " + gym.countSessionsByStatus());
        System.out.println("Members by plan:    " + gym.countMembersByPlan());
        System.out.println("Trainer attendance: " + gym.countTrainerStatus());
        System.out.printf("Total revenue:      %.2f%n", gym.getTotalRevenue());
        System.out.println();

        // --- Attendance history ---
        System.out.println("=== ALICE ATTENDANCE ===");
        gym.getAttendanceForMember(alice.getId())
                .forEach(a -> System.out.println("  " + a));
    }
}