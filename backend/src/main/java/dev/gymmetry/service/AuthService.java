package dev.gymmetry.service;

import java.util.HashMap;
import java.util.Map;

import dev.gymmetry.domain.Person;
import dev.gymmetry.domain.User;
import dev.gymmetry.enums.AccountStatus;
import dev.gymmetry.exception.AccountDisabledException;
import dev.gymmetry.exception.AuthenticationException;
import dev.gymmetry.exception.DuplicateUserException;

public class AuthService {

    private final Map<String, User> usersByUsername = new HashMap<>();

    public User createUser(String username, String password, Person person) {
        if (usersByUsername.containsKey(username)) {
            throw new DuplicateUserException(username);
        }
        // TODO Phase 5: hash the password with BCrypt
        User user = new User(username, password, person.getRole(), person);
        usersByUsername.put(username, user);
        return user;
    }

    public User login(String username, String password) {
        User user = usersByUsername.get(username);
        if (user == null) {
            throw new AuthenticationException("Invalid username or password");
        }
        if (user.getAccountStatus() == AccountStatus.DISABLED) {
            throw new AccountDisabledException(username);
        }
        // TODO Phase 5: use BCrypt.checkpw
        if (!user.getPasswordHash().equals(password)) {
            throw new AuthenticationException("Invalid username or password");
        }
        return user;
    }

    public void changePassword(User user, String newPassword) {
        // TODO Phase 5: hash
        user.setPasswordHash(newPassword);
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