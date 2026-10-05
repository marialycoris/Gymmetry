package dev.gymmetry.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Database {

    private static final String URL =
            "jdbc:postgresql://localhost:5432/gymmetry";
    private static final String USER = "postgres";
    private static final String PASSWORD = "YOUR_PGADMIN_PASSWORD";

    private Database() {}

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    public static void testConnection() {
        try (Connection conn = getConnection()) {
            if (conn.isValid(2)) {
                System.out.println("  ✓ Database connected");
            }
        } catch (SQLException e) {
            throw new RuntimeException(
                    "Cannot connect to PostgreSQL. Is it running? " + e.getMessage(), e);
        }
    }
}