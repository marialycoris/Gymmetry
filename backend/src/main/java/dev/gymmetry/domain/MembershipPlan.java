package dev.gymmetry.domain;

import java.util.List;

public abstract class MembershipPlan {

    private final String name;
    private final double basePrice;

    protected MembershipPlan(String name, double basePrice) {
        if (basePrice < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }
        this.name = name;
        this.basePrice = basePrice;
    }

    public abstract double calculateMonthlyFee();

    public abstract List<String> getFeatures();

    public String getName() {
        return name;
    }

    public double getBasePrice() {
        return basePrice;
    }
}