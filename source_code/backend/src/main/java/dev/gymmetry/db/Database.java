package dev.gymmetry.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Properties;

public class Database {

    private static final String DEFAULT_HOST = "127.0.0.1";
    private static final String DEFAULT_PORTS = "5433,5432";
    private static final String DEFAULT_DATABASE = "gymmetry";
    private static final String DEFAULT_USER = "postgres";
    private static final String DEFAULT_PASSWORD = "123";
    private static final int DEFAULT_CONNECT_TIMEOUT_SECONDS = 3;

    private static volatile String activeUrl;

    private Database() {}

    public static Connection getConnection() throws SQLException {
        List<String> urls = preferActiveUrl(candidateUrls());
        SQLException lastFailure = null;

        for (String url : urls) {
            try {
                Connection connection = DriverManager.getConnection(url, connectionProperties());
                activeUrl = url;
                return connection;
            } catch (SQLException e) {
                if (url.equals(activeUrl)) {
                    activeUrl = null;
                }
                lastFailure = e;
            }
        }

        if (lastFailure == null) {
            lastFailure = new SQLException("No database URL configured");
        }
        throw new SQLException(
                "Cannot connect to PostgreSQL. Tried: " + sanitized(urls)
                        + ". " + lastFailure.getMessage(),
                lastFailure);
    }

    public static void testConnection() {
        try (Connection conn = getConnection()) {
            if (conn.isValid(2)) {
                System.out.println("  ✓ Database connected at " + sanitizeUrl(activeUrl));
            }
        } catch (SQLException e) {
            throw new RuntimeException(
                    "Cannot connect to PostgreSQL. Is it running? " + e.getMessage(), e);
        }
    }

    private static List<String> preferActiveUrl(List<String> urls) {
        String current = activeUrl;
        if (current == null || !urls.contains(current)) {
            return urls;
        }
        List<String> ordered = new ArrayList<>(urls.size());
        ordered.add(current);
        for (String url : urls) {
            if (!url.equals(current)) {
                ordered.add(url);
            }
        }
        return ordered;
    }

    private static List<String> candidateUrls() {
        LinkedHashSet<String> urls = new LinkedHashSet<>();
        String explicitUrls = readSetting("DB_URL", "db.url");
        if (explicitUrls != null && !explicitUrls.isBlank()) {
            addAll(urls, explicitUrls);
            if (!urls.isEmpty()) {
                return new ArrayList<>(urls);
            }
        }

        String host = valueOrDefault("DB_HOST", "db.host", DEFAULT_HOST);
        String database = valueOrDefault("DB_NAME", "db.name", DEFAULT_DATABASE);
        String ports = readSetting("DB_PORTS", "db.ports");
        if (ports == null || ports.isBlank()) {
            ports = readSetting("DB_PORT", "db.port");
        }
        if (ports == null || ports.isBlank()) {
            ports = DEFAULT_PORTS;
        }

        for (String port : ports.split(",")) {
            String trimmed = port.trim();
            if (!trimmed.isEmpty()) {
                urls.add("jdbc:postgresql://" + host + ":" + trimmed + "/" + database);
            }
        }
        if (urls.isEmpty()) {
            urls.add("jdbc:postgresql://" + host + ":5433/" + database);
        }
        return new ArrayList<>(urls);
    }

    private static void addAll(LinkedHashSet<String> urls, String values) {
        for (String value : values.split(",")) {
            String trimmed = value.trim();
            if (!trimmed.isEmpty()) {
                urls.add(trimmed);
            }
        }
    }

    private static Properties connectionProperties() {
        Properties properties = new Properties();
        properties.setProperty("user", valueOrDefault("DB_USER", "db.user", DEFAULT_USER));
        properties.setProperty("password", valueOrDefault("DB_PASSWORD", "db.password", DEFAULT_PASSWORD));
        properties.setProperty("connectTimeout", String.valueOf(connectTimeoutSeconds()));
        return properties;
    }

    private static int connectTimeoutSeconds() {
        String value = readSetting("DB_CONNECT_TIMEOUT", "db.connectTimeout");
        if (value == null || value.isBlank()) {
            return DEFAULT_CONNECT_TIMEOUT_SECONDS;
        }
        try {
            int seconds = Integer.parseInt(value.trim());
            return seconds > 0 ? seconds : DEFAULT_CONNECT_TIMEOUT_SECONDS;
        } catch (NumberFormatException e) {
            return DEFAULT_CONNECT_TIMEOUT_SECONDS;
        }
    }

    private static String valueOrDefault(String envKey, String propertyKey, String defaultValue) {
        String value = readSetting(envKey, propertyKey);
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }

    private static String readSetting(String envKey, String propertyKey) {
        String value = System.getenv(envKey);
        if (value != null && !value.isBlank()) {
            return value;
        }
        return System.getProperty(propertyKey);
    }

    private static String sanitized(List<String> urls) {
        List<String> result = new ArrayList<>(urls.size());
        for (String url : urls) {
            result.add(sanitizeUrl(url));
        }
        return String.join(", ", result);
    }

    private static String sanitizeUrl(String url) {
        if (url == null) {
            return "unknown";
        }
        int query = url.indexOf('?');
        return query < 0 ? url : url.substring(0, query);
    }
}
