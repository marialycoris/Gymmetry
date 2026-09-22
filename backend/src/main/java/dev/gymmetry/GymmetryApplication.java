package dev.gymmetry;

import java.util.List;

import dev.gymmetry.domain.BasicPlan;
import dev.gymmetry.domain.MembershipPlan;
import dev.gymmetry.domain.PremiumPlan;
import dev.gymmetry.domain.VipPlan;

public class GymmetryApplication {

    public static void main(String[] args) {
        List<MembershipPlan> plans = List.of(
                new BasicPlan(),
                new PremiumPlan(),
                new VipPlan()
        );

        for (MembershipPlan plan : plans) {
            System.out.println("=== " + plan.getName() + " ===");
            System.out.printf("Monthly fee: %.2f%n", plan.calculateMonthlyFee());
            System.out.println("Features:");
            for (String feature : plan.getFeatures()) {
                System.out.println("  - " + feature);
            }
            System.out.println();
        }
    }
}