package dev.gymmetry.controllers;

import dev.gymmetry.domain.*;
import dev.gymmetry.exception.PasswordChangeRequiredException;
import dev.gymmetry.service.AuthService;
import dev.gymmetry.service.Gym;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allows React to connect later
public class AuthController {

    private final AuthService authService;
    private final Gym gym;

    public AuthController(AuthService authService, Gym gym) {
        this.authService = authService;
        this.gym = gym;
    }

    // 1. Login Endpoint
    public record LoginRequest(String username, String password) {}
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = authService.login(request.username(), request.password());
            // In a real app, we'd return a JWT token here.
            // For now, we return basic user info.
            return ResponseEntity.ok(toLoginResponse(user, false));
        } catch (PasswordChangeRequiredException e) {
            return ResponseEntity.ok(toLoginResponse(e.getUser(), true));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    private LoginResponse toLoginResponse(User user, boolean mustChangePassword) {
        return new LoginResponse(
                user.getUsername(),
                user.getRole().name(),
                user.getPerson().getId(),
                user.getPerson().getName(),
                mustChangePassword
        );
    }

    public record LoginResponse(String username, String role, int personId, String name,
                                boolean mustChangePassword) {}

    public record ChangePasswordRequest(String username, String newPassword) {}

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            User user = authService.findByUsername(request.username());
            if (user == null) {
                return ResponseEntity.status(404).body("No user: " + request.username());
            }
            if (!user.mustChangePassword()) {
                return ResponseEntity.status(403).body("Password change is only available for first-login accounts.");
            }
            authService.completePasswordChange(user, request.newPassword());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}