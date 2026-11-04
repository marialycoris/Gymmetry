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

    public record TrainerDto(int id, String name, String email, String username,
                             String specialty, String status) {}

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

    public record RegisterTrainerRequest(String name, String email, String specialty,
                                         String username, String tempPassword) {}

    @PostMapping
    public ResponseEntity<?> registerTrainer(@RequestBody RegisterTrainerRequest req) {
        try {
            Trainer t = gym.registerTrainer(req.name(), req.email(), req.specialty(),
                    req.username(), req.tempPassword());
            return ResponseEntity.ok(toDto(t));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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

    private TrainerDto toDto(Trainer t) {
        User user = gym.findTrainerUser(t.getId());
        String specialty = t.getSpecialties().isEmpty() ? "" : t.getSpecialties().get(0);
        String status = user != null && user.getAccountStatus() == AccountStatus.ENABLED ? "ACTIVE" : "DISABLED";
        return new TrainerDto(t.getId(), t.getName(), t.getEmail(),
                user != null ? user.getUsername() : "", specialty, status);
    }
}
