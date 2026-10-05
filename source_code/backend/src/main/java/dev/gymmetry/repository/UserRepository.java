package dev.gymmetry.repository;

import dev.gymmetry.db.Database;
import dev.gymmetry.domain.*;
import dev.gymmetry.enums.AccountStatus;
import dev.gymmetry.enums.Role;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserRepository {

    private final MemberRepository memberRepo;
    private final TrainerRepository trainerRepo;
    private final Admin adminSingleton;   // admin isn't persisted as a Member/Trainer

    public UserRepository(MemberRepository memberRepo,
                          TrainerRepository trainerRepo,
                          Admin admin) {
        this.memberRepo = memberRepo;
        this.trainerRepo = trainerRepo;
        this.adminSingleton = admin;
    }

    public void save(User u) {
        String sql = """
            INSERT INTO users (username, password_hash, role, person_id,
                               account_status, must_change_pw)
            VALUES (?,?,?,?,?,?)
            ON CONFLICT (username) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                account_status = EXCLUDED.account_status,
                must_change_pw = EXCLUDED.must_change_pw
            """;
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, u.getUsername());
            ps.setString(2, u.getPasswordHash());
            ps.setString(3, u.getRole().name());
            ps.setInt(4, personIdFor(u));
            ps.setString(5, u.getAccountStatus().name());
            ps.setBoolean(6, u.mustChangePassword());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save user", e);
        }
    }

    public User findByUsername(String username) {
        String sql = "SELECT * FROM users WHERE username = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return mapRow(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find user", e);
        }
    }

    public List<User> findAll() {
        String sql = "SELECT * FROM users ORDER BY username";
        List<User> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(mapRow(rs));
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list users", e);
        }
        return result;
    }

    public void update(User u) {
        save(u);   // same upsert
    }

    private int personIdFor(User u) {
        Person p = u.getPerson();
        if (p instanceof Member m) return m.getId();
        if (p instanceof Trainer t) return t.getId();
        return 0;   // admin
    }

    private User mapRow(ResultSet rs) throws SQLException {
        String username = rs.getString("username");
        String hash = rs.getString("password_hash");
        Role role = Role.valueOf(rs.getString("role"));
        int personId = rs.getInt("person_id");

        Person person = switch (role) {
            case MEMBER -> memberRepo.findById(personId);
            case TRAINER -> trainerRepo.findById(personId);
            case ADMIN -> adminSingleton;
        };

        User u = new User(username, hash, role, person);
        u.setAccountStatus(AccountStatus.valueOf(rs.getString("account_status")));
        u.setMustChangePassword(rs.getBoolean("must_change_pw"));
        return u;
    }
}