package dev.gymmetry.controllers;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.AccountStatus;
import dev.gymmetry.enums.MembershipStatus;
import dev.gymmetry.enums.PaymentMethod;
import dev.gymmetry.enums.PaymentStatus;
import dev.gymmetry.enums.Role;
import dev.gymmetry.enums.SessionStatus;
import dev.gymmetry.service.Gym;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final Gym gym;

    public ReportController(Gym gym) {
        this.gym = gym;
    }

    public record TrainerAttendance(int trainerId, String name, int held, int notHeld) {}

    public record ReportsResponse(double revenueTotal,
                                  Map<String, Double> revenueByMethod,
                                  int activeMembers,
                                  int inactiveMembers,
                                  Map<String, Integer> sessionsByStatus,
                                  Map<String, Integer> membersByPlan,
                                  List<TrainerAttendance> trainerAttendance) {}

    @GetMapping("/summary")
    public ReportsResponse summary() {
        List<Payment> payments = gym.getAllPayments();
        List<Member> members = gym.getAllMembers();
        List<Session> sessions = gym.getAllSessions();
        List<Trainer> trainers = gym.getAllTrainers();

        Map<String, Double> revenueByMethod = new LinkedHashMap<>();
        revenueByMethod.put("CASH", 0.0);
        revenueByMethod.put("CARD", 0.0);
        revenueByMethod.put("E_WALLET", 0.0);
        double revenueTotal = 0;
        for (Payment p : payments) {
            if (p.getStatus() != PaymentStatus.PAID) continue;
            revenueTotal += p.getAmount();
            revenueByMethod.merge(paymentCode(p.getMethod()), p.getAmount(), Double::sum);
        }

        Map<String, Integer> sessionsByStatus = new LinkedHashMap<>();
        sessionsByStatus.put("PENDING", 0);
        sessionsByStatus.put("ACCEPTED", 0);
        sessionsByStatus.put("DECLINED", 0);
        sessionsByStatus.put("COMPLETED", 0);
        sessionsByStatus.put("NOT_HELD", 0);
        for (Session s : sessions) {
            sessionsByStatus.merge(sessionCode(s.getStatus()), 1, Integer::sum);
        }

        Map<String, Integer> membersByPlan = new LinkedHashMap<>();
        membersByPlan.put("BASIC", 0);
        membersByPlan.put("PREMIUM", 0);
        membersByPlan.put("VIP", 0);
        int activeMembers = 0;
        for (Member m : members) {
            membersByPlan.merge(m.getPlan().getName().toUpperCase(), 1, Integer::sum);
            if (isActive(m)) activeMembers++;
        }

        List<TrainerAttendance> trainerAttendance = trainers.stream()
                .map(t -> new TrainerAttendance(
                        t.getId(), t.getName(),
                        (int) sessions.stream().filter(s -> s.getTrainer().getId() == t.getId()
                                && s.getStatus() == SessionStatus.COMPLETED).count(),
                        (int) sessions.stream().filter(s -> s.getTrainer().getId() == t.getId()
                                && s.getStatus() == SessionStatus.NOT_HELD).count()))
                .toList();

        return new ReportsResponse(revenueTotal, revenueByMethod, activeMembers,
                members.size() - activeMembers, sessionsByStatus, membersByPlan, trainerAttendance);
    }

    private boolean isActive(Member m) {
        if (m.getMembershipStatus() != MembershipStatus.ACTIVE) return false;
        User user = gym.getAuthService().findByPerson(Role.MEMBER, m.getId());
        return user == null || user.getAccountStatus() != AccountStatus.DISABLED;
    }

    private static String paymentCode(PaymentMethod method) {
        return method == PaymentMethod.GCASH ? "E_WALLET" : method.name();
    }

    private static String sessionCode(SessionStatus status) {
        return switch (status) {
            case REQUESTED -> "PENDING";
            case SCHEDULED -> "ACCEPTED";
            case CANCELLED -> "DECLINED";
            default -> status.name();
        };
    }
}
