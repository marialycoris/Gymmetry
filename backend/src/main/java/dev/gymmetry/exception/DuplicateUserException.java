package dev.gymmetry.exception;

public class DuplicateUserException extends RuntimeException {
    public DuplicateUserException(String username) {
        super("Username already taken: " + username);
    }
}