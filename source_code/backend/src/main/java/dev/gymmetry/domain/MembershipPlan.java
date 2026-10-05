package dev.gymmetry.domain;

import java.util.List;

public abstract class MembershipPlan {

    private final String name;
    private final double basePrice;
    private final int durationMonths;

    protected MembershipPlan(String name, double basePrice, int durationMonths) {
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("Name cannot be blank");
        if (basePrice < 0)
            throw new IllegalArgumentException("Price cannot be negative");
        if (durationMonths < 1)
            throw new IllegalArgumentException("Duration must be at least 1 month");
        this.name = name;
        this.basePrice = basePrice;
        this.durationMonths = durationMonths;
    }

    public abstract double calculateMonthlyFee();
    public abstract List<String> getFeatures();

    public String getName() { return name; }
    public double getBasePrice() { return basePrice; }
    public int getDurationMonths() { return durationMonths; }

    public double getTotalPrice() {
        return calculateMonthlyFee() * durationMonths;
    }

    @Override
    public String toString() {
        return String.format("%s (%.2f/mo, %d months)",
                name, calculateMonthlyFee(), durationMonths);
    }
}