package dev.gymmetry.repository;
import dev.gymmetry.db.Database;
import dev.gymmetry.domain.AttendanceRecord;
import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.Session;
import dev.gymmetry.domain.Trainer;

import java.sql.*;
// import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AttendanceRepository {

    private final MemberRepository memberRepo;
    private final TrainerRepository trainerRepo;
    private final SessionRepository sessionRepo;

    public AttendanceRepository(MemberRepository memberRepo, TrainerRepository trainerRepo, SessionRepository sessionRepo) {
        this.memberRepo = memberRepo;
        this.trainerRepo = trainerRepo;
        this.sessionRepo = sessionRepo;
    }

    public void save(AttendanceRecord a) {
        String sql = "INSERT INTO attendance (member_id, trainer_id, session_id, recorded_at) VALUES (?,?,?,?)";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, a.getMember().getId());
            ps.setInt(2, a.getTrainer().getId());
            ps.setInt(3, a.getSession().getId());
            ps.setObject(4, a.getRecordedAt());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save attendance", e);
        }
    }

    public List<AttendanceRecord> findAll() {
        String sql = "SELECT * FROM attendance ORDER BY id";
        List<AttendanceRecord> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(mapRow(rs));
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list attendance", e);
        }
        return result;
    }

    private AttendanceRecord mapRow(ResultSet rs) throws SQLException {
        Member m = memberRepo.findById(rs.getInt("member_id"));
        Trainer t = trainerRepo.findById(rs.getInt("trainer_id"));
        Session s = sessionRepo.findById(rs.getInt("session_id"));
        
        // Create the record but overwrite the auto-generated timestamp with the saved one
        AttendanceRecord a = new AttendanceRecord(rs.getInt("id"), m, t, s);
        return a; 
    }
}