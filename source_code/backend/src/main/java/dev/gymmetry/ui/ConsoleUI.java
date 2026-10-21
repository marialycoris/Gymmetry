package dev.gymmetry.ui;

import dev.gymmetry.domain.*;
import dev.gymmetry.exception.PasswordChangeRequiredException;
import dev.gymmetry.service.AuthService;
import dev.gymmetry.service.Gym;

public class ConsoleUI {
    private final Gym gym;
    private final AuthService auth;
    private final InputReader in;

    public ConsoleUI(Gym gym, AuthService auth) {
        this.gym = gym;
        this.auth = auth;
        this.in = new InputReader();
    }

    public void start() {
        System.out.println("╔══════════════════════════════════╗");
        System.out.println("║           GYMMETRY               ║");
        System.out.println("║   Gym Membership System v1.0     ║");
        System.out.println("╚══════════════════════════════════╝");

        while (true) {
            System.out.println("\n1. Login");
            System.out.println("0. Exit");
            int choice = in.readInt("Choose: ");

            if (choice == 0) {
                System.out.println("Goodbye.");
                return;
            }
            if (choice == 1) {
                login();
            }
        }
    }

    private void login() {
        System.out.println("\n--- LOGIN ---");
        String username = in.readLine("Username: ");
        String password = in.readLine("Password: ");

        try {
            User user = auth.login(username, password);
            routeToMenu(user);
        } catch (PasswordChangeRequiredException e) {
            System.out.println("\n⚠ First login detected.");
            String newPw = in.readLine("New password (min 6 chars): ");
            String confirm = in.readLine("Confirm new password:     ");
            if (!newPw.equals(confirm)) {
                System.out.println("  ✗ Passwords do not match.");
                return;
            }
            try {
                auth.completePasswordChange(e.getUser(), newPw);
                System.out.println("  ✓ Password updated. Please log in again.");
            } catch (IllegalArgumentException ex) {
                System.out.println("  ✗ " + ex.getMessage());
            }
        } catch (RuntimeException e) {
            System.out.println("  ✗ " + e.getMessage());
        }
    }

    private void routeToMenu(User user) {
        Person person = user.getPerson();
        if (person instanceof Admin admin) {
            new AdminMenu(gym, in, admin).show();
        } else if (person instanceof Trainer trainer) {
            new TrainerMenu(gym, in, trainer).show();
        } else if (person instanceof Member member) {
            new MemberMenu(gym, in, member).show();
        }
    }
}