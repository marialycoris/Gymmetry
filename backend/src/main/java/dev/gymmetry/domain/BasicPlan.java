package dev.gymmetry.domain;

import java.util.List;

public class BasicPlan extends MembershipPlan {
    public BasicPlan() { super("Basic", 500.0, 1); }

    @Override
    public double calculateMonthlyFee() { return getBasePrice(); }

    @Override
    public List<String> getFeatures() {
        return List.of("Gym access", "Locker");
    }
}