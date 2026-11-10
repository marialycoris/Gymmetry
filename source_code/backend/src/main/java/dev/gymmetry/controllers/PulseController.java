package dev.gymmetry.controllers;

import dev.gymmetry.domain.*;
import dev.gymmetry.enums.AccountStatus;
import dev.gymmetry.enums.MembershipStatus;
import dev.gymmetry.enums.Role;
import dev.gymmetry.enums.SessionStatus;
import dev.gymmetry.service.Gym;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/pulse")
@CrossOrigin(origins = "*")
public class PulseController {

    private final Gym gym;

    public PulseController(Gym gym) {
        this.gym = gym;
    }

    public record PulseInsight(int memberId, String name, String level, String signal,
                               String detail, String suggestion, int recentVisits,
                               int previousVisits, int upcomingBookings, long daysLeft) {}

    @GetMapping("/members")
    public List<PulseInsight> members() {
        LocalDate today = LocalDate.now();
        List<Member> members = gym.getAllMembers();
        List<Session> sessions = gym.getAllSessions();
        List<AttendanceRecord> attendance = gym.getAllAttendance();

        List<PulseInsight> result = new ArrayList<>();
        for (Member m : members) {
            User user = gym.getAuthService().findByPerson(Role.MEMBER, m.getId());
            if (user != null && user.getAccountStatus() == AccountStatus.DISABLED) continue;
            result.add(insight(m, today, sessions, attendance));
        }

        result.sort((a, b) -> {
            int byLevel = Integer.compare(levelOrder(a.level()), levelOrder(b.level()));
            return byLevel != 0 ? byLevel : a.name().compareToIgnoreCase(b.name());
        });
        return result;
    }

    private PulseInsight insight(Member m, LocalDate today, List<Session> sessions,
                                 List<AttendanceRecord> attendance) {
        int memberId = m.getId();

        Set<LocalDate> visits = new HashSet<>();
        for (Session s : sessions) {
            if (s.getMember().getId() == memberId && s.getStatus() == SessionStatus.COMPLETED) {
                visits.add(s.getScheduledAt().toLocalDate());
            }
        }
        for (AttendanceRecord a : attendance) {
            if (a.getMember().getId() == memberId) {
                visits.add(a.getRecordedAt().toLocalDate());
            }
        }

        LocalDate lastVisit = visits.stream().max(LocalDate::compareTo).orElse(null);
        LocalDate joinedAt = m.getStartDate();
        long idle = lastVisit != null
                ? ChronoUnit.DAYS.between(lastVisit, today)
                : joinedAt != null ? ChronoUnit.DAYS.between(joinedAt, today) : 0;
        long left = m.getExpiryDate() != null ? ChronoUnit.DAYS.between(today, m.getExpiryDate()) : 0;
        long expiredDays = left < 0 ? -left : 0;

        int recentVisits = (int) visits.stream()
                .filter(d -> withinDays(today, d, 0, 30)).count();
        int previousVisits = (int) visits.stream()
                .filter(d -> withinDays(today, d, 31, 60)).count();

        int upcomingBookings = (int) sessions.stream()
                .filter(s -> s.getMember().getId() == memberId
                        && (s.getStatus() == SessionStatus.REQUESTED
                            || s.getStatus() == SessionStatus.SCHEDULED)
                        && s.getScheduledAt().toLocalDate().isAfter(today))
                .count();

        int missed = (int) sessions.stream()
                .filter(s -> s.getMember().getId() == memberId
                        && s.getStatus() == SessionStatus.NOT_HELD
                        && withinDays(today, s.getScheduledAt().toLocalDate(), 0, 60))
                .count();

        String attendanceDetail = "Last visit " + idle + " day" + (idle == 1 ? "" : "s") + " ago. "
                + recentVisits + " visit" + (recentVisits == 1 ? "" : "s") + " in the last 30 days vs "
                + previousVisits + " in the previous 30.";
        String bookingDetail = upcomingBookings > 0
                ? " " + upcomingBookings + " upcoming booking" + (upcomingBookings == 1 ? "" : "s") + "."
                : "";
        String expiryNote = left >= 0 && left <= 7
                ? " Membership ends in " + left + " day" + (left == 1 ? "" : "s") + "."
                : "";

        boolean expired = m.getMembershipStatus() == MembershipStatus.EXPIRED
                || (m.getExpiryDate() != null && m.getExpiryDate().isBefore(today));

        if (expired) {
            if (expiredDays >= 150) {
                return new PulseInsight(memberId, m.getName(), "FOLLOW_UP",
                        "Account will be auto-disabled soon",
                        "Membership expired " + expiredDays + " days ago. " + attendanceDetail,
                        "Call the member now to renew before the six-month auto-disable.",
                        recentVisits, previousVisits, upcomingBookings, left);
            }
            return new PulseInsight(memberId, m.getName(), "FOLLOW_UP", "Membership expired",
                    "Membership expired " + expiredDays + " day" + (expiredDays == 1 ? "" : "s")
                            + " ago. " + attendanceDetail,
                    "Reach out to offer a renewal and help them book their next session.",
                    recentVisits, previousVisits, upcomingBookings, left);
        }

        if (idle >= 150) {
            return new PulseInsight(memberId, m.getName(), "FOLLOW_UP", "Inactive for five months",
                    "No attendance for " + idle + " days." + bookingDetail,
                    "Call the member to check in and offer a reason to return before the account is auto-disabled.",
                    recentVisits, previousVisits, upcomingBookings, left);
        }

        boolean declining = previousVisits > 0 && recentVisits < previousVisits;
        boolean stopped = recentVisits == 0 && !visits.isEmpty() && idle >= 14;
        if (declining || stopped) {
            return new PulseInsight(memberId, m.getName(), "WATCH",
                    declining ? "Attendance is declining" : "Attendance has stopped",
                    attendanceDetail + expiryNote + bookingDetail,
                    "Send a check-in and help them book a session this week.",
                    recentVisits, previousVisits, upcomingBookings, left);
        }

        if (idle >= 14) {
            return new PulseInsight(memberId, m.getName(), "WATCH", "Attendance has dropped",
                    "No visit in " + idle + " days." + expiryNote + bookingDetail,
                    "Follow up to see what changed and offer a session slot.",
                    recentVisits, previousVisits, upcomingBookings, left);
        }

        if (left >= 0 && left <= 7) {
            return new PulseInsight(memberId, m.getName(), "WATCH", "Membership ending soon",
                    "Membership ends in " + left + " day" + (left == 1 ? "" : "s") + ". "
                            + attendanceDetail + bookingDetail,
                    "Offer a renewal before the plan expires.",
                    recentVisits, previousVisits, upcomingBookings, left);
        }

        if (missed >= 2) {
            return new PulseInsight(memberId, m.getName(), "WATCH", "Missed sessions recently",
                    missed + " sessions were not held in the last 60 days. "
                            + attendanceDetail + bookingDetail,
                    "Follow up to confirm their schedule and rebook.",
                    recentVisits, previousVisits, upcomingBookings, left);
        }

        return new PulseInsight(memberId, m.getName(), "POSITIVE",
                upcomingBookings > 0 ? "Attending regularly with sessions booked" : "Attending regularly",
                attendanceDetail + bookingDetail,
                upcomingBookings > 0 ? "No action needed — keep it up."
                        : "No action needed; encourage them to book their next session.",
                recentVisits, previousVisits, upcomingBookings, left);
    }

    private static boolean withinDays(LocalDate today, LocalDate date, int min, int max) {
        long days = ChronoUnit.DAYS.between(date, today);
        return days >= min && days <= max;
    }

    private static int levelOrder(String level) {
        return switch (level) {
            case "FOLLOW_UP" -> 0;
            case "WATCH" -> 1;
            default -> 2;
        };
    }
}
