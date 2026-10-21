package dev.gymmetry.service;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.*;
import dev.gymmetry.exception.*;
import dev.gymmetry.repository.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
// import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class Gym {

    private final MemberRepository memberRepo;
    private final TrainerRepository trainerRepo;
    private final SessionRepository sessionRepo;
    private final PaymentRepository paymentRepo;
    private final AttendanceRepository attendanceRepo;
    private final AuthService authService;

    public Gym(MemberRepository memberRepo, TrainerRepository trainerRepo,
               SessionRepository sessionRepo, PaymentRepository paymentRepo,
               AttendanceRepository attendanceRepo, AuthService authService) {
        this.memberRepo = memberRepo;
        this.trainerRepo = trainerRepo;
        this.sessionRepo = sessionRepo;
        this.paymentRepo = paymentRepo;
        this.attendanceRepo = attendanceRepo;
        this.authService = authService;
    }

    // ============================================================
    // MEMBERS
    // ============================================================

    public Member registerMember(String name, String email,
                                 MembershipPlan plan,
                                 String username, String password) {
        Member m = new Member(0, name, email, plan); // temp ID
        m = memberRepo.save(m);                      // returns with real ID
        authService.createUser(username, password, m, true);
        return m;
    }

    public Member findMember(int id) {
        Member m = memberRepo.findById(id);
        if (m == null) throw new MemberNotFoundException(id);
        return m;
    }

    public List<Member> getAllMembers() {
        return memberRepo.findAll();
    }

    // ============================================================
    // TRAINERS
    // ============================================================

    public Trainer registerTrainer(String name, String email,
                                   String username, String password) {
        Trainer t = new Trainer(0, name, email); // temp ID
        t = trainerRepo.save(t);
        authService.createUser(username, password, t, true);
        return t;
    }

    public Trainer findTrainer(int id) {
        Trainer t = trainerRepo.findById(id);
        if (t == null) throw new TrainerNotFoundException(id);
        return t;
    }

    public List<Trainer> getAllTrainers() {
        return trainerRepo.findAll();
    }

    // ============================================================
    // PAYMENTS
    // ============================================================

    public Payment recordPayment(int memberId, MembershipPlan plan,
                                 double amount, PaymentMethod method,
                                 Admin recordedBy) {
        Member member = findMember(memberId);
        
        // Save payment (id = 0, DB will assign)
        Payment payment = new Payment(0, member, plan, amount, method, recordedBy);
        paymentRepo.save(payment);

        // Activate or renew based on current state
        if (member.getMembershipStatus() == MembershipStatus.PENDING_PAYMENT) {
            member.setPlan(plan);
            member.activate(LocalDate.now());
        } else {
            member.renew(plan, LocalDate.now());
        }
        
        memberRepo.update(member);
        return payment;
    }

    public double getTotalRevenue() {
        return paymentRepo.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .mapToDouble(Payment::getAmount)
                .sum();
    }

    // ============================================================
    // SESSION BOOKING
    // ============================================================

    public Session requestSession(int memberId, int trainerId, LocalDateTime when) {
        Member member = findMember(memberId);
        Trainer trainer = findTrainer(trainerId);

        member.refreshStatus();
        if (!member.isMembershipValid()) {
            throw new MembershipExpiredException(memberId, member.getExpiryDate());
        }

        if (memberHasConflict(member, when)) {
            throw new IllegalStateException("Member already has a session at that time");
        }
        if (trainerHasConflict(trainer, when)) {
            throw new IllegalStateException("Trainer already has a session at that time");
        }

        Session s = new Session(0, member, trainer, when);
        return sessionRepo.save(s);
    }

    public Session findSession(int id) {
        Session s = sessionRepo.findById(id);
        if (s == null) throw new SessionNotFoundException(id);
        return s;
    }

    public List<Session> getSessionsForMember(int memberId) {
        return sessionRepo.findAll().stream()
                .filter(s -> s.getMember().getId() == memberId)
                .collect(Collectors.toList());
    }

    public List<Session> getSessionsForTrainer(int trainerId) {
        return sessionRepo.findAll().stream()
                .filter(s -> s.getTrainer().getId() == trainerId)
                .collect(Collectors.toList());
    }

    public List<Session> getSessionsByStatus(SessionStatus status) {
        return sessionRepo.findAll().stream()
                .filter(s -> s.getStatus() == status)
                .collect(Collectors.toList());
    }

    // ============================================================
    // ACTIONS
    // ============================================================

    public void trainerAccept(int sessionId, Trainer trainer) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.accept();
        sessionRepo.update(s);
    }

    public void trainerDecline(int sessionId, Trainer trainer, String reason) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.decline(reason);
        sessionRepo.update(s);
    }

    public void trainerMarkPresent(int sessionId, Trainer trainer) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.markMemberPresent();
        sessionRepo.update(s);

        // Create attendance record
        AttendanceRecord att = new AttendanceRecord(0, s.getMember(), trainer, s);
        attendanceRepo.save(att);
    }

    public void trainerMarkNoShow(int sessionId, Trainer trainer) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.markMemberNoShow();
        sessionRepo.update(s);
    }

    public void memberReschedule(int sessionId, Member member,
                                 LocalDateTime newTime, Trainer newTrainer) {
        Session s = findSession(sessionId);
        if (s.getMember().getId() != member.getId()) {
            throw new IllegalStateException("Not your session");
        }
        if (!memberCanEdit(s)) {
            throw new IllegalStateException("Cannot reschedule — less than 48h remain or session not editable");
        }
        s.reschedule(newTime, newTrainer);
        sessionRepo.update(s);
    }

    public void memberCancel(int sessionId, Member member) {
        Session s = findSession(sessionId);
        if (s.getMember().getId() != member.getId()) {
            throw new IllegalStateException("Not your session");
        }
        if (!memberCanEdit(s)) {
            throw new IllegalStateException("Cannot cancel — less than 48h remain or session not editable");
        }
        s.memberCancel();
        sessionRepo.update(s);
    }

    public void adminMarkTrainerAbsent(int sessionId, Admin admin, String reason) {
        Session s = findSession(sessionId);
        s.adminMarkTrainerAbsent(reason);
        sessionRepo.update(s);
    }

    public void adminOverrideTrainerStatus(int sessionId, Admin admin,
                                            TrainerSessionStatus status,
                                            String reason) {
        Session s = findSession(sessionId);
        s.adminOverrideTrainerStatus(status, reason);
        sessionRepo.update(s);
    }

    public int sweepMissedDeadlines() {
        int count = 0;
        for (Session s : sessionRepo.findAll()) {
            if (s.getStatus() == SessionStatus.SCHEDULED && s.isPastDeadline()) {
                s.markNotHeldByDeadline();
                sessionRepo.update(s);
                count++;
            }
        }
        return count;
    }

    public List<Trainer> getAvailableTrainers(LocalDateTime when) {
        return trainerRepo.findAll().stream()
                .filter(t -> !trainerHasConflict(t, when))
                .collect(Collectors.toList());
    }

    public List<AttendanceRecord> getAttendanceForMember(int memberId) {
        return attendanceRepo.findAll().stream()
                .filter(a -> a.getMember().getId() == memberId)
                .collect(Collectors.toList());
    }

    public Map<SessionStatus, Long> countSessionsByStatus() {
        return sessionRepo.findAll().stream()
                .collect(Collectors.groupingBy(Session::getStatus, Collectors.counting()));
    }

    public Map<String, Long> countMembersByPlan() {
        return memberRepo.findAll().stream()
                .collect(Collectors.groupingBy(
                        m -> m.getPlan().getName(),
                        Collectors.counting()));
    }

    public void setAccountStatus(String username, boolean enabled) {
        User user = authService.findByUsername(username);
        if (user == null) throw new IllegalArgumentException("No user: " + username);
        if (enabled) authService.enableUser(user);
        else authService.disableUser(user);
    }

    public AuthService getAuthService() {
        return authService;
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private boolean memberHasConflict(Member m, LocalDateTime when) {
        return sessionRepo.findAll().stream().anyMatch(s ->
                s.getMember().getId() == m.getId()
                        && s.getScheduledAt().equals(when)
                        && (s.getStatus() == SessionStatus.REQUESTED
                            || s.getStatus() == SessionStatus.SCHEDULED));
    }

    private boolean trainerHasConflict(Trainer t, LocalDateTime when) {
        return sessionRepo.findAll().stream().anyMatch(s ->
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
}