package dev.gymmetry.controllers;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.SessionStatus;
import dev.gymmetry.service.Gym;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    private final Gym gym;

    public SessionController(Gym gym) {
        this.gym = gym;
    }

    @GetMapping
    public List<Session> getAllSessions() {
        return gym.getSessionsByStatus(SessionStatus.REQUESTED); // Just an example
    }

    @GetMapping("/member/{memberId}")
    public List<Session> getMemberSessions(@PathVariable int memberId) {
        return gym.getSessionsForMember(memberId);
    }

    @GetMapping("/trainer/{trainerId}")
    public List<Session> getTrainerSessions(@PathVariable int trainerId) {
        return gym.getSessionsForTrainer(trainerId);
    }

    // Member books a session
    public record BookSessionRequest(int memberId, int trainerId, String scheduledAt) {}
    
    @PostMapping
    public ResponseEntity<?> bookSession(@RequestBody BookSessionRequest req) {
        try {
            LocalDateTime when = LocalDateTime.parse(req.scheduledAt());
            Session s = gym.requestSession(req.memberId(), req.trainerId(), when);
            return ResponseEntity.ok(s);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Trainer accepts
    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptSession(@PathVariable int id, @RequestParam int trainerId) {
        try {
            Trainer t = gym.findTrainer(trainerId);
            gym.trainerAccept(id, t);
            return ResponseEntity.ok("Session accepted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Trainer declines
    public record DeclineRequest(int trainerId, String reason) {}
    
    @PostMapping("/{id}/decline")
    public ResponseEntity<?> declineSession(@PathVariable int id, @RequestBody DeclineRequest req) {
        try {
            Trainer t = gym.findTrainer(req.trainerId());
            gym.trainerDecline(id, t, req.reason());
            return ResponseEntity.ok("Session declined");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}