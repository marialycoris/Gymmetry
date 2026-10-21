package dev.gymmetry.service;

import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.Person;
import dev.gymmetry.domain.User;
import dev.gymmetry.enums.AccountStatus;
import dev.gymmetry.exception.AccountDisabledException;
import dev.gymmetry.exception.AuthenticationException;
import dev.gymmetry.exception.DuplicateUserException;
import dev.gymmetry.exception.PasswordChangeRequiredException;
import dev.gymmetry.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class AuthService {

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public User createUser(String username, String password, Person person) {
        return createUser(username, password, person, false);
    }

    public User createUser(String username, String password, Person person,
                           boolean requirePasswordChange) {
        if (userRepo.findByUsername(username) != null) {
            throw new DuplicateUserException(username);
        }
        String hash = encoder.encode(password);
        User user = new User(username, hash, person.getRole(), person);
        if (requirePasswordChange) {
            user.setMustChangePassword(true);
        }
        userRepo.save(user);
        return user;
    }

    public User login(String username, String password) {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new AuthenticationException("Invalid username or password");
        }

        // Lazily disable members who haven't renewed in 6 months
        if (user.getPerson() instanceof Member m && m.isAutoDisableDue()) {
            user.setAccountStatus(AccountStatus.DISABLED);
            userRepo.update(user);
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

    public void completePasswordChange(User user, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        user.setPasswordHash(encoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepo.update(user);
    }

    public String adminResetPassword(User user) {
        String temp = "temp" + (int) (Math.random() * 900000 + 100000);
        user.setPasswordHash(encoder.encode(temp));
        user.setMustChangePassword(true);
        userRepo.update(user);
        return temp;
    }

    public void changePassword(User user, String oldPassword, String newPassword) {
        if (!encoder.matches(oldPassword, user.getPasswordHash())) {
            throw new AuthenticationException("Current password is incorrect");
        }
        completePasswordChange(user, newPassword);
    }

    public User findByUsername(String username) {
        return userRepo.findByUsername(username);
    }

    public void disableUser(User user) {
        user.setAccountStatus(AccountStatus.DISABLED);
        userRepo.update(user);
    }

    public void enableUser(User user) {
        user.setAccountStatus(AccountStatus.ENABLED);
        userRepo.update(user);
    }
}