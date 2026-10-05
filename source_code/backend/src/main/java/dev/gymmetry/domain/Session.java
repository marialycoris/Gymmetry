package dev.gymmetry.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import dev.gymmetry.enums.CancellationReason;
import dev.gymmetry.enums.NotHeldReason;
import dev.gymmetry.enums.SessionStatus;
import dev.gymmetry.enums.TrainerSessionStatus;

public class Session {

    private int id;
    private final Member member;
    private Trainer trainer;
    private LocalDateTime scheduledAt;
    private SessionStatus status;

    // Trainer attendance for this session
    private TrainerSessionStatus trainerStatus;
    private boolean trainerStatusOverridden;
    private String overrideReason;

    // Outcome reasons
    private String declineReason;
    private NotHeldReason notHeldReason;
    private CancellationReason cancellationReason;

    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Session(int id, Member member, Trainer trainer, LocalDateTime scheduledAt) {
        if (member == null || trainer == null || scheduledAt == null)
            throw new IllegalArgumentException("Member, trainer, and schedule required");
        this.id = id;
        this.member = member;
        this.trainer = trainer;
        this.scheduledAt = scheduledAt;
        this.status = SessionStatus.REQUESTED;
        this.trainerStatus = TrainerSessionStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    // --- Getters ---
    public int getId() { return id; }
    public Member getMember() { return member; }
    public Trainer getTrainer() { return trainer; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public SessionStatus getStatus() { return status; }
    public TrainerSessionStatus getTrainerStatus() { return trainerStatus; }
    public boolean isTrainerStatusOverridden() { return trainerStatusOverridden; }
    public String getOverrideReason() { return overrideReason; }
    public String getDeclineReason() { return declineReason; }
    public NotHeldReason getNotHeldReason() { return notHeldReason; }
    public CancellationReason getCancellationReason() { return cancellationReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // --- Deadline: midnight of session date ---
    public LocalDateTime getDeadline() {
        return scheduledAt.toLocalDate().atTime(23, 59, 59);
    }

    public boolean isPastDeadline() {
        return LocalDateTime.now().isAfter(getDeadline());
    }

    public LocalDate getSessionDate() {
        return scheduledAt.toLocalDate();
    }

    // --- State transitions ---

    public void accept() {
        requireStatus(SessionStatus.REQUESTED, "accept");
        this.status = SessionStatus.SCHEDULED;
        touch();
    }

    public void decline(String reason) {
        requireStatus(SessionStatus.REQUESTED, "decline");
        if (reason == null || reason.isBlank())
            throw new IllegalArgumentException("Decline reason required");
        this.declineReason = reason;
        this.status = SessionStatus.DECLINED;
        touch();
    }

    public void reschedule(LocalDateTime newTime, Trainer newTrainer) {
        if (status != SessionStatus.REQUESTED && status != SessionStatus.SCHEDULED
                && status != SessionStatus.DECLINED) {
            throw new IllegalStateException("Cannot reschedule from " + status);
        }
        if (newTime == null || newTrainer == null)
            throw new IllegalArgumentException("New time and trainer required");
        this.scheduledAt = newTime;
        this.trainer = newTrainer;
        this.status = SessionStatus.REQUESTED;
        touch();
    }

    public void memberCancel() {
        if (status != SessionStatus.REQUESTED && status != SessionStatus.SCHEDULED
                && status != SessionStatus.DECLINED) {
            throw new IllegalStateException("Cannot cancel from " + status);
        }
        this.status = SessionStatus.CANCELLED;
        this.cancellationReason = CancellationReason.MEMBER_CANCELLED_IN_TIME;
        touch();
    }

    public void markMemberPresent() {
        requireStatus(SessionStatus.SCHEDULED, "mark present");
        this.status = SessionStatus.COMPLETED;
        this.trainerStatus = TrainerSessionStatus.PRESENT;
        touch();
    }

    public void markMemberNoShow() {
        requireStatus(SessionStatus.SCHEDULED, "mark no-show");
        this.status = SessionStatus.NOT_HELD;
        this.notHeldReason = NotHeldReason.MEMBER_NO_SHOW;
        this.trainerStatus = TrainerSessionStatus.PRESENT;
        touch();
    }

    public void markNotHeldByDeadline() {
        requireStatus(SessionStatus.SCHEDULED, "mark not held");
        this.status = SessionStatus.NOT_HELD;
        this.notHeldReason = NotHeldReason.NOT_MARKED;
        this.trainerStatus = TrainerSessionStatus.ABSENT;
        touch();
    }

    public void adminMarkTrainerAbsent(String reason) {
        this.status = SessionStatus.CANCELLED;
        this.cancellationReason = CancellationReason.TRAINER_ABSENT;
        this.trainerStatus = TrainerSessionStatus.ABSENT;
        this.trainerStatusOverridden = true;
        this.overrideReason = reason;
        touch();
    }

    public void adminOverrideTrainerStatus(TrainerSessionStatus newStatus, String reason) {
        if (newStatus == null) throw new IllegalArgumentException("Status required");
        this.trainerStatus = newStatus;
        this.trainerStatusOverridden = true;
        this.overrideReason = reason;
        touch();
    }

    // --- Helpers ---

    private void requireStatus(SessionStatus expected, String action) {
        if (this.status != expected) {
            throw new IllegalStateException(
                "Cannot " + action + " — session is " + this.status);
        }
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }

        public void setId(int id) {
        this.id = id;
    }

    /**
     * Restores persisted state (used by the repository only).
     */
    public void restoreFrom(
            dev.gymmetry.enums.SessionStatus status,
            dev.gymmetry.enums.TrainerSessionStatus trainerStatus,
            boolean overridden,
            String overrideReason,
            String declineReason,
            dev.gymmetry.enums.NotHeldReason notHeldReason,
            dev.gymmetry.enums.CancellationReason cancellationReason) {
        this.status = status;
        this.trainerStatus = trainerStatus;
        this.trainerStatusOverridden = overridden;
        this.overrideReason = overrideReason;
        this.declineReason = declineReason;
        this.notHeldReason = notHeldReason;
        this.cancellationReason = cancellationReason;
    }

    @Override
    public String toString() {
        return String.format(
            "Session[id=%d, member=%s, trainer=%s, at=%s, status=%s, trainerStatus=%s]",
            id, member.getName(), trainer.getName(), scheduledAt, status, trainerStatus);
    }
}