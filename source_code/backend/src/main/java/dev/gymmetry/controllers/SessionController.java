package dev.gymmetry.controllers;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.SessionStatus;
import dev.gymmetry.service.Gym;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    private final Gym gym;

    public SessionController(Gym gym) {
        this.gym = gym;
    }

    // Shape expected by the frontend (see frontend/src/lib/types.ts Session)
    public record SessionDto(int id, int memberId, String memberName, int trainerId, String trainerName,
                             String date, String time, String status,
                             String declineReason, String completionNote) {}

    // GET /api/sessions?memberId=&trainerId=&status=  (status uses frontend codes)
    @GetMapping
    public List<SessionDto> getSessions(@RequestParam(required = false) Integer memberId,
                                        @RequestParam(required = false) Integer trainerId,
                                        @RequestParam(required = false) String status) {
        return gym.getAllSessions().stream()
                .map(this::toDto)
                .filter(dto -> memberId == null || dto.memberId() == memberId)
                .filter(dto -> trainerId == null || dto.trainerId() == trainerId)
                .filter(dto -> status == null || status.isBlank() || dto.status().equals(status))
                .toList();
    }

    @GetMapping("/member/{memberId}")
    public List<SessionDto> getMemberSessions(@PathVariable int memberId) {
        return gym.getSessionsForMember(memberId).stream().map(this::toDto).toList();
    }

    @GetMapping("/trainer/{trainerId}")
    public List<SessionDto> getTrainerSessions(@PathVariable int trainerId) {
        return gym.getSessionsForTrainer(trainerId).stream().map(this::toDto).toList();
    }

    // Member books a session (frontend sends date + time; scheduledAt kept for older callers)
    public record BookSessionRequest(Integer memberId, Integer trainerId, String date, String time, String scheduledAt) {}

    @PostMapping
    public ResponseEntity<?> bookSession(@RequestBody BookSessionRequest req) {
        try {
            LocalDateTime when = req.scheduledAt() != null
                    ? LocalDateTime.parse(req.scheduledAt())
                    : parseWhen(req.date(), req.time());
            Session s = gym.requestSession(req.memberId(), req.trainerId(), when);
            return ResponseEntity.ok(toDto(s));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Trainer accepts or declines: { accept, reason } (reason required when declining)
    public record ResponseRequest(Boolean accept, String reason) {}

    @PutMapping("/{id}/response")
    public ResponseEntity<?> respondToSession(@PathVariable int id, @RequestBody ResponseRequest req) {
        try {
            if (req.accept() == null) throw new IllegalArgumentException("accept is required");
            gym.respondToSession(id, req.accept(), req.reason());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Trainer marks a session completed: { note } — note is optional
    public record CompleteRequest(String note) {}

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeSession(@PathVariable int id, @RequestBody(required = false) CompleteRequest req) {
        try {
            gym.completeSession(id, req == null ? null : req.note());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Trainer accepts (older contract, kept for compatibility)
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

    // Trainer declines (older contract, kept for compatibility)
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

    // ---- helpers ----

    private SessionDto toDto(Session s) {
        LocalDateTime at = s.getScheduledAt();
        return new SessionDto(
                s.getId(),
                s.getMember().getId(),
                s.getMember().getName(),
                s.getTrainer().getId(),
                s.getTrainer().getName(),
                at.toLocalDate().toString(),
                at.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")),
                statusCode(s.getStatus()),
                s.getDeclineReason(),
                s.getCompletionNote());
    }

    /** Maps domain statuses to the codes the frontend uses. */
    private static String statusCode(SessionStatus status) {
        return switch (status) {
            case REQUESTED -> "PENDING";
            case SCHEDULED -> "ACCEPTED";
            default -> status.name();
        };
    }

    private static LocalDateTime parseWhen(String date, String time) {
        if (date == null || date.isBlank() || time == null || time.isBlank())
            throw new IllegalArgumentException("Date and time are required");
        String[] parts = time.split(":");
        return LocalDateTime.parse(String.format("%sT%02d:%02d",
                date, Integer.parseInt(parts[0]), Integer.parseInt(parts[1])));
    }
}
