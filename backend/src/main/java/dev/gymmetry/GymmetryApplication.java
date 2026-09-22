package dev.gymmetry;

import java.util.List;

import dev.gymmetry.domain.Admin;
import dev.gymmetry.domain.BasicPlan;
import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.MembershipPlan;
import dev.gymmetry.domain.Person;
import dev.gymmetry.domain.PremiumPlan;
import dev.gymmetry.domain.Trainer;
import dev.gymmetry.domain.VipPlan;

public class GymmetryApplication {

    public static void main(String[] args) {

        // 1. Plans — polymorphism demo (unchanged)
        List<MembershipPlan> plans = List.of(
                new BasicPlan(),
                new PremiumPlan(),
                new VipPlan()
        );

        System.out.println("=== PLANS ===");
        for (MembershipPlan plan : plans) {
            System.out.printf("%-8s | %8.2f | %s%n",
                    plan.getName(),
                    plan.calculateMonthlyFee(),
                    plan.getFeatures());
        }
        System.out.println();

        // 2. People — polymorphism via getRole()
        List<Person> people = List.of(
                new Admin(1, "Root Admin", "admin@gymmetry.dev"),
                new Trainer(2, "Coach Marco", "marco@gymmetry.dev"),
                new Member(3, "Alice", "alice@example.com", new PremiumPlan()),
                new Member(4, "Bob", "bob@example.com", new BasicPlan())
        );

        System.out.println("=== PEOPLE ===");
        for (Person p : people) {
            // Polymorphism: getRole() differs per subclass
            System.out.printf("%-8s | %-12s | %s%n",
                    p.getRole(),
                    p.getName(),
                    p.getEmail());
        }
        System.out.println();

        // 3. Members — polymorphic fee via plan delegation
        System.out.println("=== MEMBER FEES ===");
        double total = 0;
        for (Person p : people) {
            if (p instanceof Member m) {          // pattern matching (Java 16+)
                double fee = m.getMonthlyFee();
                total += fee;
                System.out.printf("%-8s pays %.2f / month%n", m.getName(), fee);
            }
        }
        System.out.printf("%nTotal monthly revenue: %.2f%n", total);
    }
}