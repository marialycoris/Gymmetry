package dev.gymmetry.db;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class SchemaInitializer {

    public static void initialize() {
        String sql = loadSchemaSql();
        try (Connection conn = Database.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String statement : sql.split(";")) {
                String trimmed = statement.trim();
                if (!trimmed.isEmpty()) {
                    stmt.execute(trimmed);
                }
            }
            System.out.println("  ✓ Schema initialized");
        } catch (SQLException e) {
            throw new RuntimeException("Failed to initialize schema: " + e.getMessage(), e);
        }
    }

    private static String loadSchemaSql() {
        try (InputStream in = SchemaInitializer.class
                .getClassLoader()
                .getResourceAsStream("sql/schema.sql")) {
            if (in == null) throw new RuntimeException("schema.sql not found in resources");
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Cannot read schema.sql", e);
        }
    }
}