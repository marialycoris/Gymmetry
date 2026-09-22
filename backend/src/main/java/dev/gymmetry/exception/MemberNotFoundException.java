package dev.gymmetry.exception;

public class MemberNotFoundException extends RuntimeException {
    public MemberNotFoundException(int id) {
        super("Member not found: " + id);
    }
}