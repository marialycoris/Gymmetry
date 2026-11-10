package dev.gymmetry.controllers;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.AccountStatus;
import dev.gymmetry.enums.MembershipStatus;
import dev.gymmetry.enums.PaymentMethod;
import dev.gymmetry.service.Gym;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/members")
@CrossOrigin(origins = "*")
public class MemberController {

    private final Gym gym;

    public MemberController(Gym gym) {
        this.gym = gym;
    }

    public record MemberDto(int id, String name, String firstName, String lastName, String username,
                            LocalDate dateOfBirth, String gender, String address, String contactNumber,
                            String emergencyContactNumber, String medicalCondition, String plan,
                            String status, LocalDate joinedAt, LocalDate expiresAt,
                            LocalDate lastAttendance) {}

    // Get all members
    @GetMapping
    public List<MemberDto> getAllMembers() {
        return gym.getAllMembers().stream().map(this::toDto).toList();
    }

    // Get a specific member
    @GetMapping("/{id}")
    public ResponseEntity<?> getMember(@PathVariable int id) {
        try {
            return ResponseEntity.ok(toDto(gym.findMember(id)));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Register a new member
    public record RegisterMemberRequest(
            String firstName, String lastName, String dateOfBirth, String gender,
            String address, String contactNumber, String emergencyContactNumber, String medicalCondition,
            String name, String email, String plan, String username, String password, String tempPassword) {}

    @PostMapping
    public ResponseEntity<?> registerMember(@RequestBody RegisterMemberRequest req) {
        try {
            MembershipPlan plan = planFrom(req.plan());
            String name = req.name();
            if (name == null || name.isBlank()) {
                name = ((req.firstName() == null ? "" : req.firstName()) + " "
                        + (req.lastName() == null ? "" : req.lastName())).trim();
            }
            String email = req.email();
            if (email == null || email.isBlank()) {
                email = req.username() + "@gymmetry.local";
            }
            LocalDate dob = parseDate(req.dateOfBirth());
            String password = req.tempPassword() != null ? req.tempPassword() : req.password();

            Member m = new Member(0, name, email, plan,
                    req.firstName(), req.lastName(), dob, req.gender(),
                    blankToNull(req.address()), req.contactNumber(),
                    req.emergencyContactNumber(), blankToNull(req.medicalCondition()));
            return ResponseEntity.ok(toDto(gym.registerMember(m, req.username(), password)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record UpdateMemberRequest(
            String firstName, String lastName, String dateOfBirth, String gender,
            String address, String contactNumber, String emergencyContactNumber,
            String medicalCondition, String username) {}

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMember(@PathVariable int id, @RequestBody UpdateMemberRequest req) {
        try {
            User user = gym.findMemberUser(id);
            String oldUsername = user == null ? null : user.getUsername();

            Member m = gym.updateMemberDetails(id, req.firstName(), req.lastName(),
                    parseDate(req.dateOfBirth()), req.gender(), blankToNull(req.address()),
                    req.contactNumber(), req.emergencyContactNumber(),
                    blankToNull(req.medicalCondition()));
            gym.renameMemberUser(id, oldUsername, req.username());
            return ResponseEntity.ok(toDto(m));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record PlanRequest(String plan) {}

    @PutMapping("/{id}/plan")
    public ResponseEntity<?> updateMemberPlan(@PathVariable int id, @RequestBody PlanRequest req) {
        try {
            gym.updateMemberPlan(id, planFrom(req.plan()));
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<?> renewMember(@PathVariable int id) {
        try {
            gym.renewMember(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record StatusRequest(boolean active) {}

    @PutMapping("/{id}/status")
    public ResponseEntity<?> setMemberActive(@PathVariable int id, @RequestBody StatusRequest req) {
        try {
            gym.setMemberActive(id, req.active());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Record Payment for a member (Admin)
    public record PaymentRequest(String plan, double amount, String method) {}

    @PostMapping("/{id}/pay")
    public ResponseEntity<?> recordPayment(@PathVariable int id, @RequestBody PaymentRequest req) {
        try {
            MembershipPlan plan = planFrom(req.plan());
            // Assuming admin ID 0 for the seeded admin
            Admin admin = new Admin(0, "Root Admin", "admin@gymmetry.dev");
            PaymentMethod method = PaymentMethod.valueOf(req.method().toUpperCase());
            Payment p = gym.recordPayment(id, plan, req.amount(), method, admin);
            return ResponseEntity.ok(p);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private MemberDto toDto(Member m) {
        User user = gym.findMemberUser(m.getId());
        LocalDate lastAttendance = gym.getAttendanceForMember(m.getId()).stream()
                .map(a -> a.getRecordedAt().toLocalDate())
                .max(LocalDate::compareTo)
                .orElse(null);
        return new MemberDto(
                m.getId(), m.getName(), m.getFirstName(), m.getLastName(),
                user != null ? user.getUsername() : "",
                m.getDateOfBirth(), m.getGender(), m.getAddress(), m.getContactNumber(),
                m.getEmergencyContactNumber(), m.getMedicalCondition(),
                planCode(m.getPlan()),
                statusCode(user, m.getMembershipStatus()),
                m.getStartDate(), m.getExpiryDate(), lastAttendance);
    }

    private static String planCode(MembershipPlan plan) {
        return plan == null || plan.getName() == null ? "BASIC" : plan.getName().toUpperCase();
    }

    private static String statusCode(User user, MembershipStatus membershipStatus) {
        if (user != null && user.getAccountStatus() == AccountStatus.DISABLED) return "DISABLED";
        if (membershipStatus == MembershipStatus.ACTIVE) return "ACTIVE";
        if (membershipStatus == MembershipStatus.EXPIRED) return "EXPIRED";
        return "DISABLED";
    }

    private static MembershipPlan planFrom(String plan) {
        return switch (plan == null ? "basic" : plan.toLowerCase()) {
            case "premium" -> new PremiumPlan();
            case "vip" -> new VipPlan();
            default -> new BasicPlan();
        };
    }

    private static LocalDate parseDate(String value) {
        return value == null || value.isBlank() ? null : LocalDate.parse(value);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
