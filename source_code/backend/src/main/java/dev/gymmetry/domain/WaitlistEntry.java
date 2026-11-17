package dev.gymmetry.domain;

import dev.gymmetry.enums.WaitlistStatus;

import java.time.LocalDateTime;

public class WaitlistEntry {

    private int id;
    private final Member member;
    private final Trainer trainer;
    private final LocalDateTime scheduledAt;
    private WaitlistStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime notifiedAt;
    private LocalDateTime offerExpiresAt;

    public WaitlistEntry(int id, Member member, Trainer trainer, LocalDateTime scheduledAt) {
        if (member == null || trainer == null || scheduledAt == null)
            throw new IllegalArgumentException("Member, trainer, and schedule required");
        this.id = id;
        this.member = member;
        this.trainer = trainer;
        this.scheduledAt = scheduledAt;
        this.status = WaitlistStatus.WAITING;
        this.createdAt = LocalDateTime.now();
    }

    public int getId() { return id; }
    public Member getMember() { return member; }
    public Trainer getTrainer() { return trainer; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public WaitlistStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getNotifiedAt() { return notifiedAt; }
    public LocalDateTime getOfferExpiresAt() { return offerExpiresAt; }

    public void setId(int id) { this.id = id; }

    public boolean isActive() {
        return status == WaitlistStatus.WAITING || status == WaitlistStatus.OFFERED;
    }

    public void offer(LocalDateTime offerExpiresAt) {
        if (status != WaitlistStatus.WAITING)
            throw new IllegalStateException("Only waiting entries can be offered");
        this.status = WaitlistStatus.OFFERED;
        this.notifiedAt = LocalDateTime.now();
        this.offerExpiresAt = offerExpiresAt;
    }

    public void book() {
        if (status != WaitlistStatus.OFFERED)
            throw new IllegalStateException("Only an offered entry can be booked");
        this.status = WaitlistStatus.BOOKED;
    }

    public void cancel() {
        if (status == WaitlistStatus.BOOKED)
            throw new IllegalStateException("Booked entries cannot be cancelled");
        this.status = WaitlistStatus.CANCELLED;
    }

    public void expireOffer() {
        if (status == WaitlistStatus.OFFERED) this.status = WaitlistStatus.EXPIRED;
    }

    public boolean isOfferExpired() {
        return status == WaitlistStatus.OFFERED
                && offerExpiresAt != null
                && LocalDateTime.now().isAfter(offerExpiresAt);
    }

    public void restoreFrom(WaitlistStatus status, LocalDateTime createdAt,
                            LocalDateTime notifiedAt, LocalDateTime offerExpiresAt) {
        this.status = status;
        this.createdAt = createdAt == null ? LocalDateTime.now() : createdAt;
        this.notifiedAt = notifiedAt;
        this.offerExpiresAt = offerExpiresAt;
    }
}
