package dev.gymmetry.domain;

import java.util.List;

public class PremiumPlan extends MembershipPlan {

    public PremiumPlan() {
        super("Premium", 1000.0);
    }

    @Override
    public double calculateMonthlyFee() {
        return getBasePrice() * 1.05;
    }

    @Override
    public List<String> getFeatures() {
        return List.of("Gym access", "Locker", "Sauna", "1 PT session/week");
    }
}