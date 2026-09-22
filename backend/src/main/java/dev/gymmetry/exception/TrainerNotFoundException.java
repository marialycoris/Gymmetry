package dev.gymmetry.exception;

public class TrainerNotFoundException extends RuntimeException {
    public TrainerNotFoundException(int id) {
        super("Trainer not found: " + id);
    }
}