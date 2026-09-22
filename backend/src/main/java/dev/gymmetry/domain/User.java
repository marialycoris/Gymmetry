package dev.gymmetry.domain;

import dev.gymmetry.enums.AccountStatus;
import dev.gymmetry.enums.Role;

public class User {

    private final String username;
    private String passwordHash;
    private final Role role;
    private final Person person;
    private AccountStatus accountStatus;

    public User(String username, String passwordHash, Role role, Person person) {
        if (username == null || username.isBlank())
            throw new IllegalArgumentException("Username cannot be blank");
        if (passwordHash == null || passwordHash.isBlank())
            throw new IllegalArgumentException("Password hash cannot be blank");
        if (role == null || person == null)
            throw new IllegalArgumentException("Role and person are required");
        if (role != person.getRole())
            throw new IllegalArgumentException("Role mismatch with person");

        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.person = person;
        this.accountStatus = AccountStatus.ENABLED;
    }

    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public Person getPerson() { return person; }
    public AccountStatus getAccountStatus() { return accountStatus; }

    public void setPasswordHash(String passwordHash) {
        if (passwordHash == null || passwordHash.isBlank())
            throw new IllegalArgumentException("Password hash cannot be blank");
        this.passwordHash = passwordHash;
    }

    public void setAccountStatus(AccountStatus status) {
        if (status == null) throw new IllegalArgumentException("Status required");
        this.accountStatus = status;
    }

    public boolean canLogin() {
        return accountStatus == AccountStatus.ENABLED;
    }

    @Override
    public String toString() {
        return String.format("User[username=%s, role=%s, status=%s]",
                username, role, accountStatus);
    }
}