package dev.gymmetry.domain;

import dev.gymmetry.enums.Role;

public class Member extends Person {

    private MembershipPlan plan;
    private boolean active;

    public Member(int id, String name, String email, MembershipPlan plan) {
        super(id, name, email);
        if (plan == null) throw new IllegalArgumentException("Plan cannot be null");
        this.plan = plan;
        this.active = true;
    }

    public MembershipPlan getPlan() { return plan; }
    public boolean isActive() { return active; }

    public void setPlan(MembershipPlan plan) {
        if (plan == null) throw new IllegalArgumentException("Plan cannot be null");
        this.plan = plan;
    }

    public void deactivate() { this.active = false; }
    public void reactivate() { this.active = true; }

    // Delegates to the plan — polymorphism
    public double getMonthlyFee() {
        return plan.calculateMonthlyFee();
    }

    @Override
    public Role getRole() {
        return Role.MEMBER;
    }
}