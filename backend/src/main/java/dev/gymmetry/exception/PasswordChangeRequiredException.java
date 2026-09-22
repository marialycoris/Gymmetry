package dev.gymmetry.exception;

import dev.gymmetry.domain.User;

public class PasswordChangeRequiredException extends RuntimeException {

    private final User user;

    public PasswordChangeRequiredException(User user) {
        super("First login — password change required for " + user.getUsername());
        this.user = user;
    }

    public User getUser() { return user; }
}