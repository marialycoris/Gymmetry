package dev.gymmetry.service;

/**
 * Central password format rules. Kept in sync with the frontend helper
 * (src/lib/password.ts) so users get the same message on both sides.
 */
public final class PasswordPolicy {

    public static final String HINT =
            "Password must be at least 8 characters and include an uppercase letter, "
                    + "a lowercase letter, a number, and a special character.";

    private PasswordPolicy() {
    }

    public static void validate(String password) {
        if (password == null
                || password.length() < 8
                || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*")
                || !password.matches(".*[0-9].*")
                || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new IllegalArgumentException(HINT);
        }
    }
}
