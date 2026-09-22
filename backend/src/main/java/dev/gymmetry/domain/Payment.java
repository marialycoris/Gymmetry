package dev.gymmetry.domain;

import java.time.LocalDateTime;

import dev.gymmetry.enums.PaymentMethod;
import dev.gymmetry.enums.PaymentStatus;

public class Payment {

    private final int id;
    private final Member member;
    private final MembershipPlan plan;
    private final double amount;
    private final PaymentMethod method;
    private PaymentStatus status;
    private final LocalDateTime paidAt;
    private final Admin recordedBy;
    private String notes;

    public Payment(int id, Member member, MembershipPlan plan, double amount,
                   PaymentMethod method, Admin recordedBy) {
        if (member == null || plan == null || method == null || recordedBy == null)
            throw new IllegalArgumentException("Required fields cannot be null");
        if (amount < 0)
            throw new IllegalArgumentException("Amount cannot be negative");
        this.id = id;
        this.member = member;
        this.plan = plan;
        this.amount = amount;
        this.method = method;
        this.recordedBy = recordedBy;
        this.paidAt = LocalDateTime.now();
        this.status = PaymentStatus.PAID;
    }

    public int getId() { return id; }
    public Member getMember() { return member; }
    public MembershipPlan getPlan() { return plan; }
    public double getAmount() { return amount; }
    public PaymentMethod getMethod() { return method; }
    public PaymentStatus getStatus() { return status; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public Admin getRecordedBy() { return recordedBy; }
    public String getNotes() { return notes; }

    public void setStatus(PaymentStatus status) {
        if (status == null) throw new IllegalArgumentException("Status required");
        this.status = status;
    }

    public void setNotes(String notes) { this.notes = notes; }

    @Override
    public String toString() {
        return String.format("Payment[id=%d, member=%s, amount=%.2f, method=%s, status=%s]",
                id, member.getName(), amount, method, status);
    }
}