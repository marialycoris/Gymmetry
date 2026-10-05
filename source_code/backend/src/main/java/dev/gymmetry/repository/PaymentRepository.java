package dev.gymmetry.repository;

import dev.gymmetry.db.Database;
import dev.gymmetry.domain.*;
import dev.gymmetry.enums.PaymentMethod;
import dev.gymmetry.enums.PaymentStatus;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PaymentRepository {

    private final MemberRepository memberRepo;

    public PaymentRepository(MemberRepository memberRepo) {
        this.memberRepo = memberRepo;
    }

    public void save(Payment p) {
        String sql = """
            INSERT INTO payments (member_id, plan_name, amount, method, status,
                                  paid_at, recorded_by, notes)
            VALUES (?,?,?,?,?,?,?,?)
            """;
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, p.getMember().getId());
            ps.setString(2, p.getPlan().getName());
            ps.setDouble(3, p.getAmount());
            ps.setString(4, p.getMethod().name());
            ps.setString(5, p.getStatus().name());
            ps.setObject(6, p.getPaidAt());
            ps.setString(7, p.getRecordedBy().getName());
            ps.setString(8, p.getNotes());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save payment", e);
        }
    }

    public List<Payment> findAll() {
        String sql = "SELECT * FROM payments ORDER BY id";
        List<Payment> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(mapRow(rs));
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list payments", e);
        }
        return result;
    }

    public List<Payment> findByMember(int memberId) {
        String sql = "SELECT * FROM payments WHERE member_id = ? ORDER BY id";
        List<Payment> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, memberId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list payments", e);
        }
        return result;
    }

    private Payment mapRow(ResultSet rs) throws SQLException {
        Member m = memberRepo.findById(rs.getInt("member_id"));
        MembershipPlan plan = MemberRepository.planFromName(rs.getString("plan_name"));
        PaymentMethod method = PaymentMethod.valueOf(rs.getString("method"));

        // Payment constructor generates its own timestamp; we set what we need after
        Payment p = new Payment(rs.getInt("id"), m, plan, rs.getDouble("amount"),
                method, new Admin(0, rs.getString("recorded_by"), ""));
        p.setStatus(PaymentStatus.valueOf(rs.getString("status")));
        p.setNotes(rs.getString("notes"));
        return p;
    }
}