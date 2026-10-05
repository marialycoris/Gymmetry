package dev.gymmetry.repository;

import dev.gymmetry.db.Database;
import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.Session;
import dev.gymmetry.domain.Trainer;
import dev.gymmetry.enums.*;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SessionRepository {

    private final MemberRepository memberRepo;
    private final TrainerRepository trainerRepo;

    public SessionRepository(MemberRepository memberRepo, TrainerRepository trainerRepo) {
        this.memberRepo = memberRepo;
        this.trainerRepo = trainerRepo;
    }

    public Session save(Session s) {
        String sql = """
            INSERT INTO sessions (member_id, trainer_id, scheduled_at, status,
                trainer_status, trainer_overridden, override_reason,
                decline_reason, not_held_reason, cancellation_reason,
                created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            RETURNING id
            """;
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            bind(ps, s, false);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                s.assignId(rs.getInt("id"));
                return s;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save session", e);
        }
    }

    public void update(Session s) {
        String sql = """
            UPDATE sessions SET member_id=?, trainer_id=?, scheduled_at=?,
                status=?, trainer_status=?, trainer_overridden=?, override_reason=?,
                decline_reason=?, not_held_reason=?, cancellation_reason=?,
                updated_at=?
            WHERE id=?
            """;
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            bind(ps, s, true);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update session", e);
        }
    }

    public Session findById(int id) {
        String sql = "SELECT * FROM sessions WHERE id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return mapRow(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find session", e);
        }
    }

    public List<Session> findAll() {
        String sql = "SELECT * FROM sessions ORDER BY id";
        List<Session> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(mapRow(rs));
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list sessions", e);
        }
        return result;
    }

    // ---- helpers ----

    private void bind(PreparedStatement ps, Session s, boolean forUpdate) throws SQLException {
        int i = 1;
        ps.setInt(i++, s.getMember().getId());
        ps.setInt(i++, s.getTrainer().getId());
        ps.setObject(i++, s.getScheduledAt());
        ps.setString(i++, s.getStatus().name());
        ps.setString(i++, s.getTrainerStatus().name());
        ps.setBoolean(i++, s.isTrainerStatusOverridden());
        ps.setString(i++, s.getOverrideReason());
        ps.setString(i++, s.getDeclineReason());
        ps.setString(i++, s.getNotHeldReason() == null ? null : s.getNotHeldReason().name());
        ps.setString(i++, s.getCancellationReason() == null ? null : s.getCancellationReason().name());
        if (forUpdate) {
            ps.setObject(i++, LocalDateTime.now());
            ps.setInt(i, s.getId());
        } else {
            ps.setObject(i++, s.getCreatedAt());
            ps.setObject(i, s.getUpdatedAt());
        }
    }

    private Session mapRow(ResultSet rs) throws SQLException {
        Member m = memberRepo.findById(rs.getInt("member_id"));
        Trainer t = trainerRepo.findById(rs.getInt("trainer_id"));
        LocalDateTime when = rs.getObject("scheduled_at", LocalDateTime.class);

        Session s = new Session(rs.getInt("id"), m, t, when);
        s.restoreFrom(
                SessionStatus.valueOf(rs.getString("status")),
                TrainerSessionStatus.valueOf(rs.getString("trainer_status")),
                rs.getBoolean("trainer_overridden"),
                rs.getString("override_reason"),
                rs.getString("decline_reason"),
                rs.getString("not_held_reason") == null ? null
                        : NotHeldReason.valueOf(rs.getString("not_held_reason")),
                rs.getString("cancellation_reason") == null ? null
                        : CancellationReason.valueOf(rs.getString("cancellation_reason"))
        );
        return s;
    }
}