package dev.gymmetry.domain;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import dev.gymmetry.enums.MembershipStatus;
import dev.gymmetry.enums.Role;

public class Member extends Person {

    private MembershipPlan plan;
    private MembershipStatus membershipStatus;
    private LocalDate startDate;
    private LocalDate expiryDate;

    public Member(int id, String name, String email, MembershipPlan plan) {
        super(id, name, email);
        if (plan == null) throw new IllegalArgumentException("Plan cannot be null");
        this.plan = plan;
        this.membershipStatus = MembershipStatus.PENDING_PAYMENT;
        this.startDate = null;
        this.expiryDate = null;
    }

    // --- Getters ---
    public MembershipPlan getPlan() { return plan; }
    public MembershipStatus getMembershipStatus() { return membershipStatus; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getExpiryDate() { return expiryDate; }

    // --- Plan management ---
    public void setPlan(MembershipPlan plan) {
        if (plan == null) throw new IllegalArgumentException("Plan cannot be null");
        this.plan = plan;
    }

    // --- Lifecycle ---

    /**
     * First-time activation after first payment.
     */
    public void activate(LocalDate paymentDate) {
        this.startDate = paymentDate;
        this.expiryDate = paymentDate.plusMonths(plan.getDurationMonths());
        this.membershipStatus = MembershipStatus.ACTIVE;
    }

    /**
     * Renewal. If still valid, new period stacks on current expiry.
     * If expired, new period starts from paymentDate.
     */
    public void renew(MembershipPlan newPlan, LocalDate paymentDate) {
        if (newPlan == null) throw new IllegalArgumentException("Plan cannot be null");
        this.plan = newPlan;

        LocalDate base = isMembershipValid()
                ? expiryDate.plusDays(1)
                : paymentDate;

        this.startDate = base;
        this.expiryDate = base.plusMonths(newPlan.getDurationMonths());
        this.membershipStatus = MembershipStatus.ACTIVE;
    }

    public void deactivate() {
        this.membershipStatus = MembershipStatus.INACTIVE;
    }

    // --- Validity ---

    public boolean isMembershipValid() {
        if (membershipStatus != MembershipStatus.ACTIVE) return false;
        if (expiryDate == null) return false;
        return !LocalDate.now().isAfter(expiryDate);
    }

    /**
     * Refreshes EXPIRED status if past expiry. Call before displaying.
     */
    public void refreshStatus() {
        if (membershipStatus == MembershipStatus.ACTIVE
                && expiryDate != null
                && LocalDate.now().isAfter(expiryDate)) {
            this.membershipStatus = MembershipStatus.EXPIRED;
        }
    }

    public long daysRemaining() {
        if (expiryDate == null) return 0;
        long days = ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
        return Math.max(days, 0);
    }

    // --- Pricing ---

    public double getMonthlyFee() {
        return plan.calculateMonthlyFee();
    }

    @Override
    public Role getRole() { return Role.MEMBER; }

    @Override
    public String toString() {
        return String.format(
            "Member[id=%d, name=%s, plan=%s, status=%s, expires=%s]",
            getId(), getName(), plan.getName(), membershipStatus, expiryDate);
    }
}