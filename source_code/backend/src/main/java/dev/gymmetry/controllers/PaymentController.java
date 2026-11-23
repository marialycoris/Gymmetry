package dev.gymmetry.controllers;

import dev.gymmetry.domain.Admin;
import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.Payment;
import dev.gymmetry.enums.PaymentMethod;
import dev.gymmetry.service.Gym;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final Gym gym;

    public PaymentController(Gym gym) {
        this.gym = gym;
    }

    public record PaymentDto(int id, int memberId, String memberName, double amount,
                             String method, LocalDate paidAt) {}

    @GetMapping
    public List<PaymentDto> getPayments(@RequestParam(required = false) Integer memberId) {
        return gym.getAllPayments().stream()
                .filter(p -> memberId == null || p.getMember().getId() == memberId)
                .map(this::toDto)
                .toList();
    }

    public record PaymentRequest(int memberId, double amount, String method) {}

    @PostMapping
    public ResponseEntity<?> recordPayment(@RequestBody PaymentRequest req) {
        try {
            if (req.memberId() <= 0) throw new IllegalArgumentException("memberId is required");
            if (!(req.amount() > 0)) throw new IllegalArgumentException("Enter an amount greater than zero.");
            if (req.method() == null || req.method().isBlank()) {
                throw new IllegalArgumentException("method is required");
            }
            Member member = gym.findMember(req.memberId());
            PaymentMethod method = paymentMethod(req.method());
            Admin admin = new Admin(0, "Root Admin", "admin@gymmetry.dev");
            Payment payment = gym.recordPayment(req.memberId(), member.getPlan(),
                    req.amount(), method, admin);
            return ResponseEntity.ok(toDto(payment));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private PaymentDto toDto(Payment p) {
        return new PaymentDto(p.getId(), p.getMember().getId(), p.getMember().getName(),
                p.getAmount(), paymentCode(p.getMethod()), p.getPaidAt().toLocalDate());
    }

    private static PaymentMethod paymentMethod(String code) {
        String normalized = code.trim().toUpperCase();
        if (normalized.equals("E_WALLET") || normalized.equals("EWALLET")) {
            return PaymentMethod.GCASH;
        }
        return PaymentMethod.valueOf(normalized);
    }

    private static String paymentCode(PaymentMethod method) {
        return method == PaymentMethod.GCASH ? "E_WALLET" : method.name();
    }
}
