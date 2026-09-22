package dev.gymmetry.domain;

import java.util.List;

public class VipPlan extends MembershipPlan {

    public VipPlan() {
        super("VIP", 2000.0);
    }

    @Override
    public double calculateMonthlyFee() {
        return getBasePrice() * 1.10;
    }

    @Override
    public List<String> getFeatures() {
        return List.of("Gym access", "Locker", "Sauna", "Unlimited PT", "Guest passes");
    }
}