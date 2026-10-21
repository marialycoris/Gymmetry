package dev.gymmetry.ui;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Scanner;

public class InputReader {
    private final Scanner scanner;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public InputReader() {
        this.scanner = new Scanner(System.in);
    }

    public String readLine(String prompt) {
        System.out.print(prompt);
        return scanner.nextLine().trim();
    }

    public int readInt(String prompt) {
        while (true) {
            try {
                return Integer.parseInt(readLine(prompt));
            } catch (NumberFormatException e) {
                System.out.println("  ✗ Please enter a valid number.");
            }
        }
    }

    public double readDouble(String prompt) {
        while (true) {
            try {
                return Double.parseDouble(readLine(prompt));
            } catch (NumberFormatException e) {
                System.out.println("  ✗ Please enter a valid number.");
            }
        }
    }

    public LocalDateTime readDateTime(String prompt) {
        while (true) {
            try {
                return LocalDateTime.parse(readLine(prompt + " (yyyy-MM-dd HH:mm): "), FMT);
            } catch (DateTimeParseException e) {
                System.out.println("  ✗ Invalid format. Example: 2026-10-15 09:00");
            }
        }
    }

    public void pause() {
        System.out.print("\nPress Enter to continue...");
        scanner.nextLine();
    }
}