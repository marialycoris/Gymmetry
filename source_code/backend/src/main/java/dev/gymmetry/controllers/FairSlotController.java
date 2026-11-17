package dev.gymmetry.controllers;

import dev.gymmetry.domain.WaitlistEntry;
import dev.gymmetry.enums.WaitlistStatus;
import dev.gymmetry.service.Gym;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fairslot")
@CrossOrigin(origins = "*")
public class FairSlotController {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final Gym gym;

    public FairSlotController(Gym gym) {
        this.gym = gym;
    }

    public record WaitlistDto(int id, int memberId, String memberName, int trainerId,
                              String trainerName, String date, String time, String status,
                              int position, String notifiedAt, String offerExpiresAt) {}

    @GetMapping("/waitlist")
    public List<WaitlistDto> getWaitlist(@RequestParam(required = false) Integer memberId) {
        List<WaitlistEntry> entries = memberId == null
                ? gym.getAllWaitlist()
                : gym.getWaitlistForMember(memberId);
        return entries.stream().map(this::toDto).toList();
    }

    public record JoinWaitlistRequest(Integer memberId, Integer trainerId, String date, String time) {}

    @PostMapping("/waitlist")
    public ResponseEntity<?> joinWaitlist(@RequestBody JoinWaitlistRequest req) {
        try {
            if (req.memberId() == null || req.trainerId() == null) {
                throw new IllegalArgumentException("memberId and trainerId are required");
            }
            WaitlistEntry entry = gym.joinWaitlist(req.memberId(), req.trainerId(),
                    parseWhen(req.date(), req.time()));
            return ResponseEntity.ok(toDto(entry));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/waitlist/{id}")
    public ResponseEntity<?> cancelWaitlist(@PathVariable int id) {
        try {
            gym.cancelWaitlist(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/waitlist/{id}/claim")
    public ResponseEntity<?> claimWaitlist(@PathVariable int id) {
        try {
            gym.claimWaitlist(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record AlternativeDto(int trainerId, String trainerName, String specialty,
                                 String date, String time, String kind) {}

    @GetMapping("/alternatives")
    public ResponseEntity<?> getAlternatives(@RequestParam int trainerId,
                                             @RequestParam String date,
                                             @RequestParam String time) {
        try {
            List<AlternativeDto> options = gym.getAlternatives(trainerId,
                            LocalDate.parse(date), LocalTime.parse(time)).stream()
                    .map(a -> new AlternativeDto(a.trainerId(), a.trainerName(), a.specialty(),
                            a.date().toString(), a.time().format(TIME_FORMAT), a.kind()))
                    .toList();
            return ResponseEntity.ok(options);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record SlotDemand(String date, String time, int waiting, int total) {}

    public record TrainerDemand(int trainerId, String name, int waiting, int total) {}

    public record InsightsDto(int activeEntries, int waitingEntries, int offeredEntries,
                              List<SlotDemand> topSlots, List<TrainerDemand> topTrainers) {}

    private record SlotKey(String date, String time) {}

    @GetMapping("/insights")
    public InsightsDto getInsights() {
        List<WaitlistEntry> entries = gym.getAllWaitlist();
        int waiting = (int) entries.stream()
                .filter(e -> e.getStatus() == WaitlistStatus.WAITING).count();
        int offered = (int) entries.stream()
                .filter(e -> e.getStatus() == WaitlistStatus.OFFERED).count();

        Map<SlotKey, Long> totalBySlot = entries.stream().collect(Collectors.groupingBy(
                e -> new SlotKey(e.getScheduledAt().toLocalDate().toString(),
                        e.getScheduledAt().toLocalTime().format(TIME_FORMAT)),
                Collectors.counting()));
        Map<SlotKey, Long> waitingBySlot = entries.stream()
                .filter(e -> e.getStatus() == WaitlistStatus.WAITING)
                .collect(Collectors.groupingBy(
                        e -> new SlotKey(e.getScheduledAt().toLocalDate().toString(),
                                e.getScheduledAt().toLocalTime().format(TIME_FORMAT)),
                        Collectors.counting()));

        List<SlotDemand> topSlots = totalBySlot.entrySet().stream()
                .map(s -> new SlotDemand(s.getKey().date(), s.getKey().time(),
                        waitingBySlot.getOrDefault(s.getKey(), 0L).intValue(),
                        s.getValue().intValue()))
                .sorted((a, b) -> {
                    int byWaiting = Integer.compare(b.waiting(), a.waiting());
                    if (byWaiting != 0) return byWaiting;
                    int byTotal = Integer.compare(b.total(), a.total());
                    if (byTotal != 0) return byTotal;
                    return (a.date() + a.time()).compareTo(b.date() + b.time());
                })
                .limit(6)
                .toList();

        List<TrainerDemand> topTrainers = entries.stream()
                .collect(Collectors.groupingBy(e -> e.getTrainer().getId()))
                .values().stream()
                .map(group -> {
                    WaitlistEntry first = group.get(0);
                    int groupWaiting = (int) group.stream()
                            .filter(e -> e.getStatus() == WaitlistStatus.WAITING).count();
                    return new TrainerDemand(first.getTrainer().getId(),
                            first.getTrainer().getName(), groupWaiting, group.size());
                })
                .sorted((a, b) -> {
                    int byWaiting = Integer.compare(b.waiting(), a.waiting());
                    if (byWaiting != 0) return byWaiting;
                    int byTotal = Integer.compare(b.total(), a.total());
                    return byTotal != 0 ? byTotal : a.name().compareToIgnoreCase(b.name());
                })
                .limit(6)
                .toList();

        return new InsightsDto(waiting + offered, waiting, offered, topSlots, topTrainers);
    }

    private WaitlistDto toDto(WaitlistEntry entry) {
        LocalDateTime at = entry.getScheduledAt();
        return new WaitlistDto(
                entry.getId(),
                entry.getMember().getId(),
                entry.getMember().getName(),
                entry.getTrainer().getId(),
                entry.getTrainer().getName(),
                at.toLocalDate().toString(),
                at.toLocalTime().format(TIME_FORMAT),
                entry.getStatus().name(),
                gym.getWaitlistPosition(entry),
                entry.getNotifiedAt() == null ? null : entry.getNotifiedAt().toString(),
                entry.getOfferExpiresAt() == null ? null : entry.getOfferExpiresAt().toString());
    }

    private static LocalDateTime parseWhen(String date, String time) {
        if (date == null || date.isBlank() || time == null || time.isBlank()) {
            throw new IllegalArgumentException("Date and time are required");
        }
        return LocalDate.parse(date).atTime(LocalTime.parse(time));
    }
}
