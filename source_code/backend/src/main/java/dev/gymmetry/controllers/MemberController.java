package dev.gymmetry.controllers;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.PaymentMethod;
import dev.gymmetry.service.Gym;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@CrossOrigin(origins = "*")
public class MemberController {

    private final Gym gym;

    public MemberController(Gym gym) {
        this.gym = gym;
    }

    // Get all members
    @GetMapping
    public List<Member> getAllMembers() {
        return gym.getAllMembers();
    }

    // Get a specific member
    @GetMapping("/{id}")
    public ResponseEntity<?> getMember(@PathVariable int id) {
        try {
            return ResponseEntity.ok(gym.findMember(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Register a new member
    public record RegisterMemberRequest(String name, String email, String plan, String username, String password) {}
    
    @PostMapping
    public ResponseEntity<?> registerMember(@RequestBody RegisterMemberRequest req) {
        try {
            MembershipPlan plan = switch (req.plan().toLowerCase()) {
                case "premium" -> new PremiumPlan();
                case "vip" -> new VipPlan();
                default -> new BasicPlan();
            };
            Member m = gym.registerMember(req.name(), req.email(), plan, req.username(), req.password());
            return ResponseEntity.ok(m);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Record Payment for a member (Admin)
    public record PaymentRequest(String plan, double amount, String method) {}
    
    @PostMapping("/{id}/pay")
    public ResponseEntity<?> recordPayment(@PathVariable int id, @RequestBody PaymentRequest req) {
        try {
            MembershipPlan plan = switch (req.plan().toLowerCase()) {
                case "premium" -> new PremiumPlan();
                case "vip" -> new VipPlan();
                default -> new BasicPlan();
            };
            // Assuming admin ID 0 for the seeded admin
            Admin admin = new Admin(0, "Root Admin", "admin@gymmetry.dev");
            PaymentMethod method = PaymentMethod.valueOf(req.method().toUpperCase());
            
            Payment p = gym.recordPayment(id, plan, req.amount(), method, admin);
            return ResponseEntity.ok(p);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}