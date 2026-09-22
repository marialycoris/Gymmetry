package dev.gymmetry.exception;

public class SessionNotFoundException extends RuntimeException {
    public SessionNotFoundException(int id) {
        super("Session not found: " + id);
    }
}