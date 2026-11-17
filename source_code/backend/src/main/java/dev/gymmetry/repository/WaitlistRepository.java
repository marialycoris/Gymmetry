package dev.gymmetry.repository;

import dev.gymmetry.db.Database;
import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.Trainer;
import dev.gymmetry.domain.WaitlistEntry;
import dev.gymmetry.enums.WaitlistStatus;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class WaitlistRepository {

    private final MemberRepository memberRepo;
    private final TrainerRepository trainerRepo;

    public WaitlistRepository(MemberRepository memberRepo, TrainerRepository trainerRepo) {
        this.memberRepo = memberRepo;
        this.trainerRepo = trainerRepo;
    }

    public WaitlistEntry save(WaitlistEntry entry) {
        String sql = """
            INSERT INTO waitlist (member_id, trainer_id, scheduled_at, status,
                created_at, notified_at, offer_expires_at)
            VALUES (?,?,?,?,?,?,?)
            RETURNING id
            """;
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            bind(ps, entry);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                entry.setId(rs.getInt("id"));
                return entry;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save waitlist entry", e);
        }
    }

    public void update(WaitlistEntry entry) {
        String sql = """
            UPDATE waitlist SET status=?, notified_at=?, offer_expires_at=?
            WHERE id=?
            """;
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entry.getStatus().name());
            ps.setObject(2, entry.getNotifiedAt());
            ps.setObject(3, entry.getOfferExpiresAt());
            ps.setInt(4, entry.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update waitlist entry", e);
        }
    }

    public WaitlistEntry findById(int id) {
        String sql = "SELECT * FROM waitlist WHERE id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find waitlist entry", e);
        }
    }

    public List<WaitlistEntry> findAll() {
        String sql = "SELECT * FROM waitlist ORDER BY created_at, id";
        List<WaitlistEntry> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(mapRow(rs));
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list waitlist entries", e);
        }
        return result;
    }

    public List<WaitlistEntry> findByMember(int memberId) {
        String sql = "SELECT * FROM waitlist WHERE member_id = ? ORDER BY created_at, id";
        List<WaitlistEntry> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, memberId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list member waitlist entries", e);
        }
        return result;
    }

    public List<WaitlistEntry> findActiveBySlot(int trainerId, LocalDateTime scheduledAt) {
        String sql = """
            SELECT * FROM waitlist
            WHERE trainer_id = ? AND scheduled_at = ? AND status IN ('WAITING', 'OFFERED')
            ORDER BY created_at, id
            """;
        List<WaitlistEntry> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, trainerId);
            ps.setObject(2, scheduledAt);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list slot waitlist entries", e);
        }
        return result;
    }

    public boolean existsActiveForMemberSlot(int memberId, int trainerId, LocalDateTime scheduledAt) {
        String sql = """
            SELECT 1 FROM waitlist
            WHERE member_id = ? AND trainer_id = ? AND scheduled_at = ?
              AND status IN ('WAITING', 'OFFERED')
            LIMIT 1
            """;
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, memberId);
            ps.setInt(2, trainerId);
            ps.setObject(3, scheduledAt);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to check waitlist entry", e);
        }
    }

    public List<WaitlistEntry> findOffered() {
        String sql = "SELECT * FROM waitlist WHERE status = 'OFFERED' ORDER BY created_at, id";
        List<WaitlistEntry> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(mapRow(rs));
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list offers", e);
        }
        return result;
    }

    private void bind(PreparedStatement ps, WaitlistEntry entry) throws SQLException {
        ps.setInt(1, entry.getMember().getId());
        ps.setInt(2, entry.getTrainer().getId());
        ps.setObject(3, entry.getScheduledAt());
        ps.setString(4, entry.getStatus().name());
        ps.setObject(5, entry.getCreatedAt());
        ps.setObject(6, entry.getNotifiedAt());
        ps.setObject(7, entry.getOfferExpiresAt());
    }

    private WaitlistEntry mapRow(ResultSet rs) throws SQLException {
        Member m = memberRepo.findById(rs.getInt("member_id"));
        Trainer t = trainerRepo.findById(rs.getInt("trainer_id"));
        LocalDateTime scheduledAt = rs.getObject("scheduled_at", LocalDateTime.class);
        LocalDateTime createdAt = rs.getObject("created_at", LocalDateTime.class);
        LocalDateTime notifiedAt = rs.getObject("notified_at", LocalDateTime.class);
        LocalDateTime offerExpiresAt = rs.getObject("offer_expires_at", LocalDateTime.class);

        WaitlistEntry entry = new WaitlistEntry(rs.getInt("id"), m, t, scheduledAt);
        entry.restoreFrom(WaitlistStatus.valueOf(rs.getString("status")),
                createdAt, notifiedAt, offerExpiresAt);
        return entry;
    }
}
