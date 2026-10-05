package dev.gymmetry;

import dev.gymmetry.db.Database;
import dev.gymmetry.db.SchemaInitializer;
import dev.gymmetry.domain.Admin;
import dev.gymmetry.repository.*;
import dev.gymmetry.service.AuthService;
import dev.gymmetry.service.Gym;

public class GymmetryApplication {

    public static void main(String[] args) {
        System.out.println("Connecting to database...");
        Database.testConnection();
        SchemaInitializer.initialize();

        Admin admin = new Admin(0, "Root Admin", "admin@gymmetry.dev");
        MemberRepository memberRepo = new MemberRepository();
        TrainerRepository trainerRepo = new TrainerRepository();
        SessionRepository sessionRepo = new SessionRepository(memberRepo, trainerRepo);
        PaymentRepository paymentRepo = new PaymentRepository(memberRepo);
        UserRepository userRepo = new UserRepository(memberRepo, trainerRepo, admin);

        AuthService auth = new AuthService(userRepo);
        if (userRepo.findByUsername("admin") == null) {
            auth.createUser("admin", "admin123", admin);
            System.out.println("  ✓ Admin seeded");
        }

        Gym gym = new Gym(memberRepo, trainerRepo, sessionRepo, paymentRepo, auth);

        ConsoleUI ui = new ConsoleUI(gym, auth);
        ui.start();
    }
}