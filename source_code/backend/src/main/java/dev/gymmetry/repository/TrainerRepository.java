package dev.gymmetry.repository;

import dev.gymmetry.db.Database;
import dev.gymmetry.domain.Trainer;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TrainerRepository {

    public Trainer save(Trainer t) {
        String sql = "INSERT INTO trainers (name, email) VALUES (?, ?) RETURNING id";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, t.getName());
            ps.setString(2, t.getEmail());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                int id = rs.getInt("id");
                Trainer copy = new Trainer(id, t.getName(), t.getEmail());
                for (String s : t.getSpecialties()) copy.addSpecialty(s);
                saveSpecialties(copy);
                return copy;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save trainer", e);
        }
    }

    public Trainer findById(int id) {
        String sql = "SELECT * FROM trainers WHERE id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return loadSpecialties(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find trainer " + id, e);
        }
    }

    public void update(Trainer t) {
        String sql = "UPDATE trainers SET name = ?, email = ? WHERE id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, t.getName());
            ps.setString(2, t.getEmail());
            ps.setInt(3, t.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update trainer", e);
        }
        replaceSpecialties(t);
    }

    public List<Trainer> findAll() {
        String sql = "SELECT * FROM trainers ORDER BY id";
        List<Trainer> result = new ArrayList<>();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(loadSpecialties(mapRow(rs)));
        } catch (SQLException e) {
            throw new RuntimeException("Failed to list trainers", e);
        }
        return result;
    }

    // ---- helpers ----

    private Trainer mapRow(ResultSet rs) throws SQLException {
        return new Trainer(rs.getInt("id"), rs.getString("name"), rs.getString("email"));
    }

    private Trainer loadSpecialties(Trainer t) throws SQLException {
        String sql = "SELECT specialty FROM trainer_specialties WHERE trainer_id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, t.getId());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) t.addSpecialty(rs.getString("specialty"));
            }
        }
        return t;
    }

    private void saveSpecialties(Trainer t) throws SQLException {
        String sql = "INSERT INTO trainer_specialties (trainer_id, specialty) VALUES (?, ?)";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (String s : t.getSpecialties()) {
                ps.setInt(1, t.getId());
                ps.setString(2, s);
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }

    private void replaceSpecialties(Trainer t) {
        try (Connection conn = Database.getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "DELETE FROM trainer_specialties WHERE trainer_id = ?")) {
                ps.setInt(1, t.getId());
                ps.executeUpdate();
            }
            saveSpecialties(t);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update trainer specialties", e);
        }
    }
}