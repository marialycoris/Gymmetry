package dev.gymmetry.repository;

import dev.gymmetry.db.Database;
import dev.gymmetry.domain.BasicPlan;
import dev.gymmetry.domain.Member;
import dev.gymmetry.domain.MembershipPlan;
import dev.gymmetry.domain.PremiumPlan;
import dev.gymmetry.domain.VipPlan;
import dev.gymmetry.enums.MembershipStatus;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class MemberRepository {

    public Member save(Member m) {
        String sql = """
            INSERT INTO members (name, email, plan_name, membership_status,
                                 start_date, expiry_date)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id
            """;
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, m.getName());
            ps.setString(2, m.getEmail());
            ps.setString(3, m.getPlan().getName());
            ps.setString(4, m.getMembershipStatus().name());
            ps.setObject(5, m.getStartDate());
            ps.setObject(6, m.getExpiryDate());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return copyWithId(m, rs.getInt("id"));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save member", e);
        }
    }

    public Member findById(int id) {
        String sql = "SELECT * FROM members WHERE id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return mapRow(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find member " + id, e);
        }
    }

    public List<Member> findAll() {
        String sql = "SELECT * FROM members ORDER BY id";
        List<Member> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(mapRow(rs));
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list members", e);
        }
        return result;
    }

    public void update(Member m) {
        String sql = """
            UPDATE members SET name=?, email=?, plan_name=?,
                membership_status=?, start_date=?, expiry_date=?
            WHERE id=?
            """;
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, m.getName());
            ps.setString(2, m.getEmail());
            ps.setString(3, m.getPlan().getName());
            ps.setString(4, m.getMembershipStatus().name());
            ps.setObject(5, m.getStartDate());
            ps.setObject(6, m.getExpiryDate());
            ps.setInt(7, m.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update member", e);
        }
    }

    // ---- mapping ----

    private Member mapRow(ResultSet rs) throws SQLException {
        int id = rs.getInt("id");
        String name = rs.getString("name");
        String email = rs.getString("email");
        MembershipPlan plan = planFromName(rs.getString("plan_name"));
        Member m = new Member(id, name, email, plan);
        // Overwrite the pending state with persisted state
        m.setMembershipStatus(MembershipStatus.valueOf(rs.getString("membership_status")));
        m.setStartDate(rs.getObject("start_date", LocalDate.class));
        m.setExpiryDate(rs.getObject("expiry_date", LocalDate.class));
        return m;
    }

    private Member copyWithId(Member src, int id) {
        Member m = new Member(id, src.getName(), src.getEmail(), src.getPlan());
        m.setMembershipStatus(src.getMembershipStatus());
        m.setStartDate(src.getStartDate());
        m.setExpiryDate(src.getExpiryDate());
        return m;
    }

    public static MembershipPlan planFromName(String name) {
        return switch (name) {
            case "Basic" -> new BasicPlan();
            case "Premium" -> new PremiumPlan();
            case "VIP" -> new VipPlan();
            default -> throw new IllegalArgumentException("Unknown plan: " + name);
        };
    }
}