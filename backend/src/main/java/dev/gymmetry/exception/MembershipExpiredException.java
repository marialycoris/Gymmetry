package dev.gymmetry.exception;

import java.time.LocalDate;

public class MembershipExpiredException extends RuntimeException {
    private final int memberId;
    private final LocalDate expiryDate;

    public MembershipExpiredException(int memberId, LocalDate expiryDate) {
        super("Membership for member " + memberId
                + " expired on " + expiryDate);
        this.memberId = memberId;
        this.expiryDate = expiryDate;
    }

    public int getMemberId() { return memberId; }
    public LocalDate getExpiryDate() { return expiryDate; }
}