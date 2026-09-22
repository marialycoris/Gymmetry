package dev.gymmetry.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import dev.gymmetry.domain.Admin;
import dev.gymmetry.domain.AttendanceRecord;
import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.MembershipPlan;
import dev.gymmetry.domain.Payment;
import dev.gymmetry.domain.Session;
import dev.gymmetry.domain.Trainer;
import dev.gymmetry.domain.User;
import dev.gymmetry.enums.MembershipStatus;
import dev.gymmetry.enums.PaymentMethod;
import dev.gymmetry.enums.PaymentStatus;
import dev.gymmetry.enums.SessionStatus;
import dev.gymmetry.enums.TrainerSessionStatus;
import dev.gymmetry.exception.MemberNotFoundException;
import dev.gymmetry.exception.MembershipExpiredException;
import dev.gymmetry.exception.SessionNotFoundException;
import dev.gymmetry.exception.TrainerNotFoundException;

public class Gym {

    // --- Storage ---
    private final Map<Integer, Member> members = new HashMap<>();
    private final Map<Integer, Trainer> trainers = new HashMap<>();
    private final Map<Integer, Session> sessions = new HashMap<>();
    private final Map<Integer, Payment> payments = new HashMap<>();
    private final Map<Integer, AttendanceRecord> attendanceRecords = new HashMap<>();

    private int nextMemberId = 1;
    private int nextTrainerId = 1;
    private int nextSessionId = 1;
    private int nextPaymentId = 1;
    private int nextAttendanceId = 1;

    private final AuthService authService;

    public Gym(AuthService authService) {
        this.authService = authService;
    }

    // ============================================================
    // MEMBERS
    // ============================================================

    public Member registerMember(String name, String email,
                                 MembershipPlan plan,
                                 String username, String password) {
        int id = nextMemberId++;
        Member m = new Member(id, name, email, plan);
        members.put(id, m);
        authService.createUser(username, password, m, true);
        return m;
    }

    public Member findMember(int id) {
        Member m = members.get(id);
        if (m == null) throw new MemberNotFoundException(id);
        return m;
    }

    public List<Member> getAllMembers() {
        return new ArrayList<>(members.values());
    }

    // ============================================================
    // TRAINERS
    // ============================================================

    public Trainer registerTrainer(String name, String email,
                                   String username, String password) {
        int id = nextTrainerId++;
        Trainer t = new Trainer(id, name, email);
        trainers.put(id, t);
        authService.createUser(username, password, t, true);
        return t;
    }

    public Trainer findTrainer(int id) {
        Trainer t = trainers.get(id);
        if (t == null) throw new TrainerNotFoundException(id);
        return t;
    }

    public List<Trainer> getAllTrainers() {
        return new ArrayList<>(trainers.values());
    }

    // ============================================================
    // PAYMENTS
    // ============================================================

    public Payment recordPayment(int memberId, MembershipPlan plan,
                                 double amount, PaymentMethod method,
                                 Admin recordedBy) {
        Member member = findMember(memberId);
        int id = nextPaymentId++;

        Payment payment = new Payment(id, member, plan, amount, method, recordedBy);
        payments.put(id, payment);

        // Activate or renew based on current state
        if (member.getMembershipStatus() == MembershipStatus.PENDING_PAYMENT) {
            member.setPlan(plan);
            member.activate(LocalDate.now());
        } else {
            member.renew(plan, LocalDate.now());
        }

        return payment;
    }

    public List<Payment> getPaymentsForMember(int memberId) {
        return payments.values().stream()
                .filter(p -> p.getMember().getId() == memberId)
                .collect(Collectors.toList());
    }

    public double getTotalRevenue() {
        double total = 0;
        for (Payment p : payments.values()) {
            if (p.getStatus() == PaymentStatus.PAID) {
                total += p.getAmount();
            }
        }
        return total;
    }

    // ============================================================
    // SESSION BOOKING
    // ============================================================

    public Session requestSession(int memberId, int trainerId,
                                  LocalDateTime when) {
        Member member = findMember(memberId);
        Trainer trainer = findTrainer(trainerId);

        // Gate: membership must be valid to book
        member.refreshStatus();
        if (!member.isMembershipValid()) {
            throw new MembershipExpiredException(memberId, member.getExpiryDate());
        }

        // Gate: no conflicts
        if (memberHasConflict(member, when)) {
            throw new IllegalStateException("Member already has a session at that time");
        }
        if (trainerHasConflict(trainer, when)) {
            throw new IllegalStateException("Trainer already has a session at that time");
        }

        int id = nextSessionId++;
        Session s = new Session(id, member, trainer, when);
        sessions.put(id, s);
        return s;
    }

    public Session findSession(int id) {
        Session s = sessions.get(id);
        if (s == null) throw new SessionNotFoundException(id);
        return s;
    }

    public List<Session> getSessionsForMember(int memberId) {
        return sessions.values().stream()
                .filter(s -> s.getMember().getId() == memberId)
                .collect(Collectors.toList());
    }

    public List<Session> getSessionsForTrainer(int trainerId) {
        return sessions.values().stream()
                .filter(s -> s.getTrainer().getId() == trainerId)
                .collect(Collectors.toList());
    }

    public List<Session> getSessionsByStatus(SessionStatus status) {
        return sessions.values().stream()
                .filter(s -> s.getStatus() == status)
                .collect(Collectors.toList());
    }

    // ============================================================
    // TRAINER RESPONSES
    // ============================================================

    public void trainerAccept(int sessionId, Trainer trainer) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.accept();
    }

    public void trainerDecline(int sessionId, Trainer trainer, String reason) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.decline(reason);
    }

    public void trainerMarkPresent(int sessionId, Trainer trainer) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.markMemberPresent();

        // Create attendance record automatically
        int attId = nextAttendanceId++;
        AttendanceRecord att = new AttendanceRecord(attId, s.getMember(), trainer, s);
        attendanceRecords.put(attId, att);
    }

    public void trainerMarkNoShow(int sessionId, Trainer trainer) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.markMemberNoShow();
    }

    // ============================================================
    // MEMBER ACTIONS
    // ============================================================

    public void memberReschedule(int sessionId, Member member,
                                 LocalDateTime newTime, Trainer newTrainer) {
        Session s = findSession(sessionId);
        if (s.getMember().getId() != member.getId()) {
            throw new IllegalStateException("Not your session");
        }
        if (!memberCanEdit(s)) {
            throw new IllegalStateException(
                "Cannot reschedule — less than 48h remain or session not editable");
        }
        s.reschedule(newTime, newTrainer);
    }

    public void memberCancel(int sessionId, Member member) {
        Session s = findSession(sessionId);
        if (s.getMember().getId() != member.getId()) {
            throw new IllegalStateException("Not your session");
        }
        if (!memberCanEdit(s)) {
            throw new IllegalStateException(
                "Cannot cancel — less than 48h remain or session not editable");
        }
        s.memberCancel();
    }

    // ============================================================
    // ADMIN OVERRIDES
    // ============================================================

    public void adminMarkTrainerAbsent(int sessionId, Admin admin, String reason) {
        Session s = findSession(sessionId);
        s.adminMarkTrainerAbsent(reason);
    }

    public void adminOverrideTrainerStatus(int sessionId, Admin admin,
                                            TrainerSessionStatus status,
                                            String reason) {
        Session s = findSession(sessionId);
        s.adminOverrideTrainerStatus(status, reason);
    }

    public void adminCancelSession(int sessionId, Admin admin) {
        Session s = findSession(sessionId);
        s.adminMarkTrainerAbsent("Cancelled by admin");
    }

    // ============================================================
    // DEADLINE SWEEP (call this manually or on app start)
    // ============================================================

    /**
     * Marks any SCHEDULED session past its deadline with no trainer action
     * as NOT_HELD / trainer ABSENT.
     */
    public int sweepMissedDeadlines() {
        int count = 0;
        for (Session s : sessions.values()) {
            if (s.getStatus() == SessionStatus.SCHEDULED && s.isPastDeadline()) {
                s.markNotHeldByDeadline();
                count++;
            }
        }
        return count;
    }

    // ============================================================
    // AVAILABILITY
    // ============================================================

    public List<Trainer> getAvailableTrainers(LocalDateTime when) {
        return trainers.values().stream()
                .filter(t -> !trainerHasConflict(t, when))
                .collect(Collectors.toList());
    }

    // ============================================================
    // ATTENDANCE
    // ============================================================

    public List<AttendanceRecord> getAttendanceForMember(int memberId) {
        return attendanceRecords.values().stream()
                .filter(a -> a.getMember().getId() == memberId)
                .collect(Collectors.toList());
    }

    public List<AttendanceRecord> getAttendanceForTrainer(int trainerId) {
        return attendanceRecords.values().stream()
                .filter(a -> a.getTrainer().getId() == trainerId)
                .collect(Collectors.toList());
    }

    // ============================================================
    // REPORTS
    // ============================================================

    public Map<SessionStatus, Long> countSessionsByStatus() {
        return sessions.values().stream()
                .collect(Collectors.groupingBy(Session::getStatus, Collectors.counting()));
    }

    public Map<String, Long> countMembersByPlan() {
        return members.values().stream()
                .collect(Collectors.groupingBy(
                        m -> m.getPlan().getName(),
                        Collectors.counting()));
    }

    public Map<TrainerSessionStatus, Long> countTrainerStatus() {
        return sessions.values().stream()
                .filter(s -> s.getStatus() != SessionStatus.REQUESTED)
                .collect(Collectors.groupingBy(
                        Session::getTrainerStatus,
                        Collectors.counting()));
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private boolean memberHasConflict(Member m, LocalDateTime when) {
        return sessions.values().stream().anyMatch(s ->
                s.getMember().getId() == m.getId()
                        && s.getScheduledAt().equals(when)
                        && (s.getStatus() == SessionStatus.REQUESTED
                            || s.getStatus() == SessionStatus.SCHEDULED));
    }

    private boolean trainerHasConflict(Trainer t, LocalDateTime when) {
        return sessions.values().stream().anyMatch(s ->
                s.getTrainer().getId() == t.getId()
                        && s.getScheduledAt().equals(when)
                        && (s.getStatus() == SessionStatus.REQUESTED
                            || s.getStatus() == SessionStatus.SCHEDULED));
    }

    private boolean memberCanEdit(Session s) {
        return (s.getStatus() == SessionStatus.REQUESTED
                || s.getStatus() == SessionStatus.SCHEDULED
                || s.getStatus() == SessionStatus.DECLINED)
                && LocalDateTime.now().plusDays(2).isBefore(s.getScheduledAt());
    }

    private void requireOwnership(Session s, Trainer trainer) {
        if (s.getTrainer().getId() != trainer.getId()) {
            throw new IllegalStateException("This session is not assigned to you");
        }
    }

    public AuthService getAuthService() {
        return authService;
    }
    public void setAccountStatus(String username, boolean enabled) {
        User user = authService.findByUsername(username);
        if (user == null) {
            throw new IllegalArgumentException("No user with username: " + username);
        }
        if (enabled) authService.enableUser(user);
        else authService.disableUser(user);
    }

    public User findUserByUsername(String username) {
        return authService.findByUsername(username);
    }
}