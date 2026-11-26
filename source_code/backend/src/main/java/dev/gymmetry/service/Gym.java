package dev.gymmetry.service;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.*;
import dev.gymmetry.exception.*;
import dev.gymmetry.repository.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class Gym {

    public static final List<LocalTime> BOOKING_SLOTS = List.of(
            LocalTime.of(6, 0), LocalTime.of(8, 0), LocalTime.of(10, 0),
            LocalTime.of(16, 0), LocalTime.of(18, 0), LocalTime.of(20, 0));

    private static final int WAITLIST_OFFER_HOURS = 24;
    private static final int DEFAULT_SLOT_CAPACITY = 1;
    private static final Map<String, Integer> SPECIALIZATION_CAPACITIES = Map.of(
            "Strength and Conditioning", 3,
            "Fitness Nutrition / Nutrition Coaching", 1,
            "Corrective Exercise Specialist (CES)", 1,
            "Weight Management & Fat Loss", 3,
            "Senior Fitness", 4,
            "Youth Fitness", 6,
            "Group Exercise & Boot Camp", 15,
            "Bodybuilding / Physique Coaching", 2);

    private final MemberRepository memberRepo;
    private final TrainerRepository trainerRepo;
    private final SessionRepository sessionRepo;
    private final PaymentRepository paymentRepo;
    private final AttendanceRepository attendanceRepo;
    private final WaitlistRepository waitlistRepo;
    private final AuthService authService;

    public Gym(MemberRepository memberRepo, TrainerRepository trainerRepo,
               SessionRepository sessionRepo, PaymentRepository paymentRepo,
               AttendanceRepository attendanceRepo, WaitlistRepository waitlistRepo,
               AuthService authService) {
        this.memberRepo = memberRepo;
        this.trainerRepo = trainerRepo;
        this.sessionRepo = sessionRepo;
        this.paymentRepo = paymentRepo;
        this.attendanceRepo = attendanceRepo;
        this.waitlistRepo = waitlistRepo;
        this.authService = authService;
    }

    public record SlotAvailability(LocalTime time, boolean available, int capacity,
                                   int booked, int remaining) {}

    public record AlternativeSlot(int trainerId, String trainerName, String specialty,
                                  LocalDate date, LocalTime time, String kind) {}

    // ============================================================
    // MEMBERS
    // ============================================================

    public Member registerMember(String name, String email,
                                 MembershipPlan plan,
                                 String username, String password) {
        return registerMember(new Member(0, name, email, plan), username, password);
    }

    public Member registerMember(Member member, String username, String password) {
        Member m = memberRepo.save(member); // returns with real ID
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

    public Member updateMemberDetails(int id, String firstName, String lastName,
                                      LocalDate dateOfBirth, String gender, String address,
                                      String contactNumber, String emergencyContactNumber,
                                      String medicalCondition) {
        Member m = findMember(id);
        m.setFirstName(firstName);
        m.setLastName(lastName);
        m.setDateOfBirth(dateOfBirth);
        m.setGender(gender);
        m.setAddress(address);
        m.setContactNumber(contactNumber);
        m.setEmergencyContactNumber(emergencyContactNumber);
        m.setMedicalCondition(medicalCondition);
        memberRepo.update(m);
        return m;
    }

    public void updateMemberPlan(int id, MembershipPlan plan) {
        Member m = findMember(id);
        m.setPlan(plan);
        memberRepo.update(m);
    }

    public void renewMember(int id) {
        Member m = findMember(id);
        m.renew(m.getPlan(), LocalDate.now());
        memberRepo.update(m);
    }

    public void setMemberActive(int id, boolean active) {
        Member m = findMember(id);
        User user = authService.findByPerson(m.getRole(), m.getId());
        if (user == null) throw new IllegalStateException("No login account for member " + id);
        if (active) authService.enableUser(user);
        else authService.disableUser(user);
    }

    public User findMemberUser(int id) {
        Member m = findMember(id);
        return authService.findByPerson(m.getRole(), m.getId());
    }

    public void renameMemberUser(int id, String oldUsername, String newUsername) {
        if (newUsername == null || newUsername.isBlank() || newUsername.equals(oldUsername)) return;
        Member m = findMember(id);
        User user = authService.findByPerson(m.getRole(), m.getId());
        if (user == null) throw new IllegalStateException("No login account for member " + id);
        authService.renameUsername(user, newUsername);
    }

    public void setMemberPassword(int id, String newPassword) {
        Member m = findMember(id);
        User user = authService.findByPerson(m.getRole(), m.getId());
        if (user == null) throw new IllegalStateException("No login account for member " + id);
        authService.adminSetPassword(user, newPassword);
    }

    // ============================================================
    // TRAINERS
    // ============================================================

    public Trainer registerTrainer(String name, String email,
                                   String username, String password) {
        return registerTrainer(name, email, null, username, password);
    }

    public Trainer registerTrainer(String name, String email, String specialty,
                                   String username, String password) {
        Trainer t = new Trainer(0, name, email); // temp ID
        if (specialty != null && !specialty.isBlank()) t.addSpecialty(specialty);
        return registerTrainer(t, username, password);
    }

    public Trainer registerTrainer(Trainer trainer, String username, String password) {
        Trainer t = trainerRepo.save(trainer);
        authService.createUser(username, password, t, true);
        return t;
    }

    public Trainer updateTrainer(int id, String name, String email, String specialty) {
        findTrainer(id); // ensures the trainer exists
        Trainer updated = new Trainer(id, name, email);
        if (specialty != null && !specialty.isBlank()) updated.addSpecialty(specialty);
        trainerRepo.update(updated);
        return trainerRepo.findById(id);
    }

    public void setTrainerActive(int trainerId, boolean active) {
        Trainer t = findTrainer(trainerId);
        User user = authService.findByPerson(t.getRole(), t.getId());
        if (user == null) throw new IllegalStateException("No login account for trainer " + trainerId);
        if (active) authService.enableUser(user);
        else authService.disableUser(user);
    }

    public User findTrainerUser(int trainerId) {
        Trainer t = findTrainer(trainerId);
        return authService.findByPerson(t.getRole(), t.getId());
    }

    public void setTrainerPassword(int trainerId, String newPassword) {
        Trainer t = findTrainer(trainerId);
        User user = authService.findByPerson(t.getRole(), t.getId());
        if (user == null) throw new IllegalStateException("No login account for trainer " + trainerId);
        authService.adminSetPassword(user, newPassword);
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
        return requestSession(memberId, trainerId, when, true);
    }

    private Session requestSession(int memberId, int trainerId, LocalDateTime when,
                                   boolean reserveOffers) {
        Member member = findMember(memberId);
        Trainer trainer = findTrainer(trainerId);

        member.refreshStatus();
        if (!member.isMembershipValid()) {
            throw new MembershipExpiredException(memberId, member.getExpiryDate());
        }

        if (memberHasConflict(member, when)) {
            throw new IllegalStateException("Member already has a session at that time");
        }
        requireSlotCapacity(trainer, when, -1, reserveOffers);

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
                .filter(s -> s.getStatus() != SessionStatus.REASSIGN_PENDING)
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
        Trainer slotTrainer = s.getTrainer();
        LocalDateTime slotTime = s.getScheduledAt();
        s.decline(reason);
        sessionRepo.update(s);
        offerNextForSlot(slotTrainer.getId(), slotTime);
    }

    public void trainerMarkPresent(int sessionId, Trainer trainer) {
        trainerMarkPresent(sessionId, trainer, null);
    }

    public void trainerMarkPresent(int sessionId, Trainer trainer, String note) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.markMemberPresent(note);
        sessionRepo.update(s);

        recordAttendance(s);
    }

    /** API flow: the trainer of the session accepts or declines a request (no login context). */
    public void respondToSession(int sessionId, boolean accept, String reason) {
        Session s = findSession(sessionId);
        Trainer slotTrainer = s.getTrainer();
        LocalDateTime slotTime = s.getScheduledAt();
        if (accept) s.accept();
        else s.decline(reason);
        sessionRepo.update(s);
        if (!accept) offerNextForSlot(slotTrainer.getId(), slotTime);
    }

    /** API flow: the trainer of the session marks it completed with an optional note. */
    public void completeSession(int sessionId, String note) {
        Session s = findSession(sessionId);
        s.markMemberPresent(note);
        sessionRepo.update(s);

        recordAttendance(s);
    }

    public void overrideAttendance(int sessionId, SessionStatus outcome) {
        Session s = findSession(sessionId);
        s.adminOverrideAttendance(outcome);
        sessionRepo.update(s);

        if (outcome == SessionStatus.COMPLETED) {
            recordAttendance(s);
        } else {
            attendanceRepo.deleteBySession(s.getId());
        }
    }

    private void recordAttendance(Session s) {
        if (!attendanceRepo.existsBySession(s.getId())) {
            attendanceRepo.save(new AttendanceRecord(0, s.getMember(), s.getTrainer(), s));
        }
    }

    public void trainerMarkNoShow(int sessionId, Trainer trainer) {
        Session s = findSession(sessionId);
        requireOwnership(s, trainer);
        s.markMemberNoShow();
        sessionRepo.update(s);
    }

    public void markNoShow(int sessionId) {
        Session s = findSession(sessionId);
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
        if (newTime == null || newTrainer == null) {
            throw new IllegalArgumentException("New time and trainer required");
        }
        if (memberHasConflict(s.getMember(), newTime, s.getId())) {
            throw new IllegalStateException("Member already has a session at that time");
        }
        requireSlotCapacity(newTrainer, newTime, s.getId());
        Trainer oldTrainer = s.getTrainer();
        LocalDateTime oldTime = s.getScheduledAt();
        s.reschedule(newTime, newTrainer);
        sessionRepo.update(s);
        offerNextForSlot(oldTrainer.getId(), oldTime);
    }

    public void memberCancel(int sessionId, Member member) {
        Session s = findSession(sessionId);
        if (s.getMember().getId() != member.getId()) {
            throw new IllegalStateException("Not your session");
        }
        if (!memberCanEdit(s)) {
            throw new IllegalStateException("Cannot cancel — less than 48h remain or session not editable");
        }
        Trainer slotTrainer = s.getTrainer();
        LocalDateTime slotTime = s.getScheduledAt();
        s.memberCancel();
        sessionRepo.update(s);
        offerNextForSlot(slotTrainer.getId(), slotTime);
    }

    /** API flow: an admin reassigns a declined session to another trainer. */
    public void reassignSession(int sessionId, Trainer newTrainer) {
        Session s = findSession(sessionId);
        if (s.getStatus() != SessionStatus.DECLINED) {
            throw new IllegalStateException("Only declined sessions can be reassigned");
        }
        if (newTrainer == null) throw new IllegalArgumentException("New trainer required");
        if (s.getTrainer().getId() == newTrainer.getId()) {
            throw new IllegalStateException("Session is already assigned to this trainer");
        }
        requireSlotCapacity(newTrainer, s.getScheduledAt(), s.getId());
        Trainer oldTrainer = s.getTrainer();
        LocalDateTime slotTime = s.getScheduledAt();
        s.proposeReassignment(newTrainer);
        sessionRepo.update(s);
        offerNextForSlot(oldTrainer.getId(), slotTime);
    }

    public void respondToReassignment(int sessionId, boolean accept) {
        Session s = findSession(sessionId);
        if (accept) s.confirmReassignment();
        else s.rejectReassignment();
        sessionRepo.update(s);
        if (!accept) offerNextForSlot(s.getTrainer().getId(), s.getScheduledAt());
    }

    public void adminMarkTrainerAbsent(int sessionId, Admin admin, String reason) {
        markTrainerAbsent(sessionId, reason);
    }

    public void markTrainerAbsent(int sessionId, String reason) {
        Session s = findSession(sessionId);
        Trainer slotTrainer = s.getTrainer();
        LocalDateTime slotTime = s.getScheduledAt();
        s.adminMarkTrainerAbsent(reason);
        sessionRepo.update(s);
        offerNextForSlot(slotTrainer.getId(), slotTime);
    }

    public void adminCancel(int sessionId) {
        Session s = findSession(sessionId);
        Trainer slotTrainer = s.getTrainer();
        LocalDateTime slotTime = s.getScheduledAt();
        s.adminCancel();
        sessionRepo.update(s);
        offerNextForSlot(slotTrainer.getId(), slotTime);
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
                .filter(t -> hasSlotCapacity(t, when, -1, true))
                .collect(Collectors.toList());
    }

    // ============================================================
    // FAIRSLOT
    // ============================================================

    public boolean isSlotAvailable(int trainerId, LocalDateTime when) {
        Trainer trainer = findTrainer(trainerId);
        return hasSlotCapacity(trainer, when, -1, true);
    }

    public List<SlotAvailability> getOpenSlots(int trainerId, LocalDate date) {
        Trainer trainer = findTrainer(trainerId);
        LocalDateTime now = LocalDateTime.now();
        List<SlotAvailability> slots = new ArrayList<>();
        for (LocalTime time : BOOKING_SLOTS) {
            LocalDateTime when = date.atTime(time);
            int capacity = slotCapacity(trainer);
            int booked = (int) occupiedSlots(trainerId, when, -1, true);
            slots.add(new SlotAvailability(time, when.isAfter(now) && booked < capacity,
                    capacity, booked, Math.max(0, capacity - booked)));
        }
        return slots;
    }

    public List<AlternativeSlot> getAlternatives(int trainerId, LocalDate date, LocalTime time) {
        Trainer requested = findTrainer(trainerId);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime requestedWhen = date.atTime(time);
        List<AlternativeSlot> result = new ArrayList<>();

        for (LocalTime slot : BOOKING_SLOTS) {
            if (slot.equals(time)) continue;
            LocalDateTime when = date.atTime(slot);
            if (when.isAfter(now) && isSlotAvailable(trainerId, when)) {
                result.add(alternative(requested, date, slot, "SAME_TRAINER"));
            }
        }
        for (Trainer t : getAllTrainers()) {
            if (t.getId() == trainerId || !isTrainerActive(t)) continue;
            if (requestedWhen.isAfter(now) && isSlotAvailable(t.getId(), requestedWhen)) {
                result.add(alternative(t, date, time, "OTHER_TRAINER"));
            }
        }
        for (Trainer t : getAllTrainers()) {
            if (t.getId() == trainerId || !isTrainerActive(t)) continue;
            for (LocalTime slot : BOOKING_SLOTS) {
                if (slot.equals(time)) continue;
                LocalDateTime when = date.atTime(slot);
                if (when.isAfter(now) && isSlotAvailable(t.getId(), when)) {
                    result.add(alternative(t, date, slot, "OTHER_TRAINER"));
                }
            }
        }
        return result.stream().limit(8).toList();
    }

    public WaitlistEntry joinWaitlist(int memberId, int trainerId, LocalDateTime when) {
        Member member = findMember(memberId);
        member.refreshStatus();
        if (!member.isMembershipValid()) {
            throw new MembershipExpiredException(memberId, member.getExpiryDate());
        }
        Trainer trainer = findTrainer(trainerId);
        if (!when.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Choose a future time to join the waitlist");
        }
        if (isSlotAvailable(trainerId, when)) {
            int remaining = slotCapacity(trainer) - (int) occupiedSlots(trainerId, when, -1, true);
            throw new IllegalStateException("That time still has " + remaining + " open spot"
                    + (remaining == 1 ? "" : "s") + " — book it instead");
        }
        boolean memberConflict = memberHasConflict(member, when);
        if (memberConflict) {
            throw new IllegalStateException("You already have a session at that time");
        }
        if (waitlistRepo.existsActiveForMemberSlot(memberId, trainerId, when)) {
            throw new IllegalStateException("You are already on this waitlist");
        }
        return waitlistRepo.save(new WaitlistEntry(0, member, trainer, when));
    }

    public List<WaitlistEntry> getWaitlistForMember(int memberId) {
        findMember(memberId);
        expireWaitlistOffers();
        return waitlistRepo.findByMember(memberId);
    }

    public List<WaitlistEntry> getAllWaitlist() {
        expireWaitlistOffers();
        return waitlistRepo.findAll();
    }

    public int getWaitlistPosition(WaitlistEntry entry) {
        if (!entry.isActive()) return 0;
        int position = 1;
        for (WaitlistEntry waiting : waitlistRepo.findActiveBySlot(
                entry.getTrainer().getId(), entry.getScheduledAt())) {
            if (waiting.getId() == entry.getId()) return position;
            position++;
        }
        return 0;
    }

    public WaitlistEntry cancelWaitlist(int id) {
        WaitlistEntry entry = findWaitlistEntry(id);
        if (!entry.isActive()) {
            throw new IllegalStateException("This waitlist entry is no longer active");
        }
        boolean wasOffered = entry.getStatus() == WaitlistStatus.OFFERED;
        entry.cancel();
        waitlistRepo.update(entry);
        if (wasOffered) offerNextForSlot(entry.getTrainer().getId(), entry.getScheduledAt());
        return entry;
    }

    public Session claimWaitlist(int id) {
        WaitlistEntry entry = findWaitlistEntry(id);
        if (entry.isOfferExpired()) {
            entry.expireOffer();
            waitlistRepo.update(entry);
            offerNextForSlot(entry.getTrainer().getId(), entry.getScheduledAt());
            throw new IllegalStateException("This offer has expired");
        }
        if (entry.getStatus() != WaitlistStatus.OFFERED) {
            throw new IllegalStateException("This waitlist entry does not have an open offer");
        }
        Session session = requestSession(entry.getMember().getId(),
                entry.getTrainer().getId(), entry.getScheduledAt(), false);
        entry.book();
        waitlistRepo.update(entry);
        return session;
    }

    public int expireWaitlistOffers() {
        int expired = 0;
        for (WaitlistEntry entry : waitlistRepo.findOffered()) {
            if (!entry.isOfferExpired()) continue;
            entry.expireOffer();
            waitlistRepo.update(entry);
            expired++;
            offerNextForSlot(entry.getTrainer().getId(), entry.getScheduledAt());
        }
        return expired;
    }

    private void offerNextForSlot(int trainerId, LocalDateTime when) {
        if (!isSlotAvailable(trainerId, when)) return;
        List<WaitlistEntry> entries = waitlistRepo.findActiveBySlot(trainerId, when);
        for (WaitlistEntry entry : entries) {
            if (entry.getStatus() != WaitlistStatus.OFFERED) continue;
            if (!entry.isOfferExpired()) return;
            entry.expireOffer();
            waitlistRepo.update(entry);
        }
        for (WaitlistEntry entry : entries) {
            if (entry.getStatus() != WaitlistStatus.WAITING) continue;
            entry.offer(LocalDateTime.now().plusHours(WAITLIST_OFFER_HOURS));
            waitlistRepo.update(entry);
            return;
        }
    }

    private WaitlistEntry findWaitlistEntry(int id) {
        WaitlistEntry entry = waitlistRepo.findById(id);
        if (entry == null) throw new IllegalArgumentException("Waitlist entry not found: " + id);
        return entry;
    }

    private AlternativeSlot alternative(Trainer trainer, LocalDate date, LocalTime time, String kind) {
        String specialty = trainer.getSpecialties().isEmpty() ? "" : trainer.getSpecialties().get(0);
        return new AlternativeSlot(trainer.getId(), trainer.getName(), specialty, date, time, kind);
    }

    private boolean isTrainerActive(Trainer trainer) {
        User user = authService.findByPerson(Role.TRAINER, trainer.getId());
        return user == null || user.getAccountStatus() != AccountStatus.DISABLED;
    }

    public List<AttendanceRecord> getAttendanceForMember(int memberId) {
        return attendanceRepo.findAll().stream()
                .filter(a -> a.getMember().getId() == memberId)
                .collect(Collectors.toList());
    }

    public List<AttendanceRecord> getAllAttendance() {
        return attendanceRepo.findAll();
    }

    public List<Session> getAllSessions() {
        return sessionRepo.findAll();
    }

    public List<Payment> getAllPayments() {
        return paymentRepo.findAll();
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
        return memberHasConflict(m, when, -1);
    }

    private boolean memberHasConflict(Member m, LocalDateTime when, int excludeSessionId) {
        return sessionRepo.findAll().stream().anyMatch(s ->
                s.getMember().getId() == m.getId()
                        && s.getId() != excludeSessionId
                        && s.getScheduledAt().equals(when)
                        && (s.getStatus() == SessionStatus.REQUESTED
                            || s.getStatus() == SessionStatus.REASSIGN_PENDING
                            || s.getStatus() == SessionStatus.SCHEDULED));
    }

    private void requireSlotCapacity(Trainer trainer, LocalDateTime when, int excludeSessionId) {
        requireSlotCapacity(trainer, when, excludeSessionId, true);
    }

    private void requireSlotCapacity(Trainer trainer, LocalDateTime when, int excludeSessionId,
                                     boolean reserveOffers) {
        if (hasSlotCapacity(trainer, when, excludeSessionId, reserveOffers)) return;
        String specialty = primarySpecialty(trainer);
        String label = specialty.isEmpty() ? "this trainer" : specialty;
        throw new IllegalStateException("This time slot is fully booked for " + label
                + ". Join the waitlist to get the next opening.");
    }

    private boolean hasSlotCapacity(Trainer trainer, LocalDateTime when, int excludeSessionId,
                                    boolean reserveOffers) {
        return occupiedSlots(trainer.getId(), when, excludeSessionId, reserveOffers) < slotCapacity(trainer);
    }

    private long occupiedSlots(int trainerId, LocalDateTime when, int excludeSessionId,
                               boolean includeOffers) {
        long sessions = activeSessionsForSlot(trainerId, when, excludeSessionId);
        return includeOffers ? sessions + activeOffersForSlot(trainerId, when) : sessions;
    }

    private long activeSessionsForSlot(int trainerId, LocalDateTime when, int excludeSessionId) {
        return sessionRepo.findAll().stream()
                .filter(s -> s.getId() != excludeSessionId)
                .filter(s -> s.getTrainer().getId() == trainerId)
                .filter(s -> s.getScheduledAt().equals(when))
                .filter(s -> s.getStatus() == SessionStatus.REQUESTED
                        || s.getStatus() == SessionStatus.REASSIGN_PENDING
                        || s.getStatus() == SessionStatus.SCHEDULED)
                .count();
    }

    private long activeOffersForSlot(int trainerId, LocalDateTime when) {
        return waitlistRepo.findActiveBySlot(trainerId, when).stream()
                .filter(e -> e.getStatus() == WaitlistStatus.OFFERED && !e.isOfferExpired())
                .count();
    }

    private int slotCapacity(Trainer trainer) {
        return SPECIALIZATION_CAPACITIES.getOrDefault(
                primarySpecialty(trainer), DEFAULT_SLOT_CAPACITY);
    }

    private String primarySpecialty(Trainer trainer) {
        return trainer.getSpecialties().isEmpty() ? "" : trainer.getSpecialties().get(0);
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