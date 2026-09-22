package dev.gymmetry;

import java.time.LocalDate;
import java.time.LocalDateTime;

import dev.gymmetry.domain.Admin;
import dev.gymmetry.domain.AttendanceRecord;
import dev.gymmetry.domain.BasicPlan;
import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.Payment;
import dev.gymmetry.domain.PremiumPlan;
import dev.gymmetry.domain.Session;
import dev.gymmetry.domain.Trainer;
import dev.gymmetry.enums.PaymentMethod;

public class GymmetryApplication {

    public static void main(String[] args) {

        Admin admin = new Admin(1, "Root Admin", "admin@gymmetry.dev");
        Trainer trainer = new Trainer(2, "Coach Marco", "marco@gymmetry.dev");
        trainer.addSpecialty("Strength");
        trainer.addSpecialty("Conditioning");

        Member alice = new Member(3, "Alice", "alice@example.com", new PremiumPlan());
        Member bob = new Member(4, "Bob", "bob@example.com", new BasicPlan());

        // --- Membership activation ---
        System.out.println("=== MEMBERSHIP ACTIVATION ===");
        alice.activate(LocalDate.now());
        System.out.printf("Alice: %s, expires %s (%d days left)%n",
                alice.getMembershipStatus(), alice.getExpiryDate(), alice.daysRemaining());

        // Bob does not pay yet
        System.out.printf("Bob:   %s (no payment yet)%n%n", bob.getMembershipStatus());

        // --- Payments ---
        System.out.println("=== PAYMENTS ===");
        Payment p1 = new Payment(1, alice, alice.getPlan(), 3150.0,
                PaymentMethod.CARD, admin);
        System.out.println(p1);
        System.out.println();

        // --- Session lifecycle ---
        System.out.println("=== SESSION LIFECYCLE ===");
        Session s1 = new Session(1, alice, trainer,
                LocalDateTime.now().plusDays(3).withHour(9).withMinute(0));
        System.out.println("Created: " + s1);

        s1.accept();
        System.out.println("Accepted: " + s1.getStatus());

        s1.markMemberPresent();
        System.out.println("Marked present: " + s1.getStatus()
                + " / trainer " + s1.getTrainerStatus());
        System.out.println();

        // --- Different outcome: no-show ---
        Session s2 = new Session(2, alice, trainer,
                LocalDateTime.now().plusDays(5).withHour(10).withMinute(0));
        s2.accept();
        s2.markMemberNoShow();
        System.out.println("Second session no-show:");
        System.out.println("  status = " + s2.getStatus()
                + " (reason " + s2.getNotHeldReason() + ")");
        System.out.println("  trainer = " + s2.getTrainerStatus());
        System.out.println();

        // --- Deadline auto-miss ---
        Session s3 = new Session(3, alice, trainer,
                LocalDateTime.now().plusDays(7).withHour(14).withMinute(0));
        s3.accept();
        s3.markNotHeldByDeadline();
        System.out.println("Third session trainer forgot:");
        System.out.println("  status = " + s3.getStatus()
                + " (reason " + s3.getNotHeldReason() + ")");
        System.out.println("  trainer = " + s3.getTrainerStatus());
        System.out.println();

        // --- Attendance record ---
        AttendanceRecord att = new AttendanceRecord(1, alice, trainer, s1);
        System.out.println("=== ATTENDANCE ===");
        System.out.println(att);
    }
}