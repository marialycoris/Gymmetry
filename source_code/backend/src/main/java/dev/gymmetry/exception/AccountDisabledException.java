package dev.gymmetry.exception;

public class AccountDisabledException extends RuntimeException {
    public AccountDisabledException(String username) {
        super("Account is disabled: " + username);
    }
}