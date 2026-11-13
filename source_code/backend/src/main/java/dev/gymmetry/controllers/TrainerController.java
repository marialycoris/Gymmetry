package dev.gymmetry.controllers;

import dev.gymmetry.domain.Trainer;
import dev.gymmetry.domain.User;
import dev.gymmetry.enums.AccountStatus;
import dev.gymmetry.service.Gym;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainers")
@CrossOrigin(origins = "*")
public class TrainerController {

    private final Gym gym;

    public TrainerController(Gym gym) {
        this.gym = gym;
    }

    public record TrainerDto(int id, String name, String firstName, String lastName, String email,
                             String username, String gender, String contactNumber, String address,
                             String license, String specialty, String status) {}

    @GetMapping
    public List<TrainerDto> getAllTrainers(@RequestParam(defaultValue = "false") boolean includeDisabled) {
        return gym.getAllTrainers().stream()
                .map(this::toDto)
                .filter(t -> includeDisabled || t.status().equals("ACTIVE"))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTrainer(@PathVariable int id) {
        try {
            return ResponseEntity.ok(toDto(gym.findTrainer(id)));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    public record RegisterTrainerRequest(String firstName, String lastName, String name, String email,
                                         String gender, String contactNumber, String address, String license,
                                         String specialty, String username, String tempPassword) {}

    @PostMapping
    public ResponseEntity<?> registerTrainer(@RequestBody RegisterTrainerRequest req) {
        try {
            String name = req.name();
            if (name == null || name.isBlank()) {
                name = ((req.firstName() == null ? "" : req.firstName()) + " "
                        + (req.lastName() == null ? "" : req.lastName())).trim();
            }
            Trainer t = new Trainer(0, name, req.email(), req.firstName(), req.lastName(),
                    req.gender(), req.contactNumber(), req.address(), blankToNull(req.license()));
            if (req.specialty() != null && !req.specialty().isBlank()) t.addSpecialty(req.specialty());
            return ResponseEntity.ok(toDto(gym.registerTrainer(t, req.username(), req.tempPassword())));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    public record UpdateTrainerRequest(String name, String email, String specialty) {}

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrainer(@PathVariable int id, @RequestBody UpdateTrainerRequest req) {
        try {
            return ResponseEntity.ok(toDto(gym.updateTrainer(id, req.name(), req.email(), req.specialty())));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record StatusRequest(boolean active) {}

    @PutMapping("/{id}/status")
    public ResponseEntity<?> setTrainerActive(@PathVariable int id, @RequestBody StatusRequest req) {
        try {
            gym.setTrainerActive(id, req.active());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record PasswordRequest(String password) {}

    // Admin sets a temporary password; the trainer must change it on next login.
    @PutMapping("/{id}/password")
    public ResponseEntity<?> setTrainerPassword(@PathVariable int id, @RequestBody PasswordRequest req) {
        try {
            gym.setTrainerPassword(id, req.password());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private TrainerDto toDto(Trainer t) {
        User user = gym.findTrainerUser(t.getId());
        String specialty = t.getSpecialties().isEmpty() ? "" : t.getSpecialties().get(0);
        String status = user != null && user.getAccountStatus() == AccountStatus.ENABLED ? "ACTIVE" : "DISABLED";
        return new TrainerDto(t.getId(), t.getName(), t.getFirstName(), t.getLastName(), t.getEmail(),
                user != null ? user.getUsername() : "", t.getGender(), t.getContactNumber(),
                t.getAddress(), t.getLicense(), specialty, status);
    }
}
