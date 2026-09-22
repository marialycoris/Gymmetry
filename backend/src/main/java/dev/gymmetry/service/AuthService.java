package dev.gymmetry.service;

import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.Person;
import dev.gymmetry.domain.User;
import dev.gymmetry.enums.AccountStatus;
import dev.gymmetry.enums.Role;
import dev.gymmetry.exception.AccountDisabledException;
import dev.gymmetry.exception.AuthenticationException;
import dev.gymmetry.exception.DuplicateUserException;
import dev.gymmetry.exception.PasswordChangeRequiredException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.HashMap;
import java.util.Map;

public class AuthService {

    private final Map<String, User> usersByUsername = new HashMap<>();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // Users created via the "seed" path (admin) skip first-login password change.
    // Trainer and Member accounts require it.
    public User createUser(String username, String password, Person person) {
        return createUser(username, password, person, false);
    }

    public User createUser(String username, String password, Person person,
                           boolean requirePasswordChange) {
        if (usersByUsername.containsKey(username)) {
            throw new DuplicateUserException(username);
        }
        String hash = encoder.encode(password);
        User user = new User(username, hash, person.getRole(), person);
        if (requirePasswordChange) {
            user.setMustChangePassword(true);
        }
        usersByUsername.put(username, user);
        return user;
    }

    public User login(String username, String password) {
        User user = usersByUsername.get(username);
        if (user == null) {
            // Don't reveal which part was wrong
            throw new AuthenticationException("Invalid username or password");
        }

        // Lazily disable members who haven't renewed in 6 months
        if (user.getPerson() instanceof Member m && m.isAutoDisableDue()) {
            user.setAccountStatus(AccountStatus.DISABLED);
        }

        if (user.getAccountStatus() == AccountStatus.DISABLED) {
            throw new AccountDisabledException(username);
        }

        if (!encoder.matches(password, user.getPasswordHash())) {
            throw new AuthenticationException("Invalid username or password");
        }

        if (user.mustChangePassword()) {
            throw new PasswordChangeRequiredException(user);
        }

        return user;
    }

    /**
     * After PasswordChangeRequiredException, client calls this to set a new password.
     */
    public void completePasswordChange(User user, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        user.setPasswordHash(encoder.encode(newPassword));
        user.setMustChangePassword(false);
    }

    /**
     * Admin-driven reset. Sets a temp password and forces change on next login.
     */
    public String adminResetPassword(User user) {
        String temp = "temp" + (int) (Math.random() * 900000 + 100000);
        user.setPasswordHash(encoder.encode(temp));
        user.setMustChangePassword(true);
        return temp;
    }

    public void changePassword(User user, String oldPassword, String newPassword) {
        if (!encoder.matches(oldPassword, user.getPasswordHash())) {
            throw new AuthenticationException("Current password is incorrect");
        }
        completePasswordChange(user, newPassword);
    }

    public User findByUsername(String username) {
        return usersByUsername.get(username);
    }

    public void disableUser(User user) {
        user.setAccountStatus(AccountStatus.DISABLED);
    }

    public void enableUser(User user) {
        user.setAccountStatus(AccountStatus.ENABLED);
    }

    public int userCount() {
        return usersByUsername.size();
    }
}