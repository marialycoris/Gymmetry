package dev.gymmetry;

import dev.gymmetry.db.SchemaInitializer;
import dev.gymmetry.domain.Admin;
import dev.gymmetry.repository.*;
import dev.gymmetry.service.AuthService;
import dev.gymmetry.service.Gym;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class GymmetryApplication {

    public static void main(String[] args) {
        // Start the Spring Boot web server
        SpringApplication.run(GymmetryApplication.class, args);
    }

    // Spring Boot will use this to inject Gym and AuthService where needed
    @Bean
    public Gym gym() {
        System.out.println("Initializing Gymmetry components...");
        SchemaInitializer.initialize();

        Admin admin = new Admin(0, "Root Admin", "admin@gymmetry.dev");
        
        MemberRepository memberRepo = new MemberRepository();
        TrainerRepository trainerRepo = new TrainerRepository();
        SessionRepository sessionRepo = new SessionRepository(memberRepo, trainerRepo);
        PaymentRepository paymentRepo = new PaymentRepository(memberRepo);
        AttendanceRepository attendanceRepo = new AttendanceRepository(memberRepo, trainerRepo, sessionRepo);
        UserRepository userRepo = new UserRepository(memberRepo, trainerRepo, admin);

        AuthService auth = new AuthService(userRepo);
        if (userRepo.findByUsername("admin") == null) {
            auth.createUser("admin", "admin123", admin);
            System.out.println("  ✓ Admin seeded");
        }

        return new Gym(memberRepo, trainerRepo, sessionRepo, paymentRepo, attendanceRepo, auth);
    }

    @Bean
    public AuthService authService(Gym gym) {
        return gym.getAuthService();
    }
}