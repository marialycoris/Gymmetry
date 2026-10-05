package dev.gymmetry.domain;

import dev.gymmetry.enums.Role;

public abstract class Person {

    private final int id;
    private String name;
    private String email;

    protected Person(int id, String name, String email) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be blank");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }

    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be blank");
        }
        this.name = name;
    }

    public void setEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
        this.email = email;
    }

    // Every subclass must declare its role — abstract method
    public abstract Role getRole();

    @Override
    public String toString() {
        return String.format("%s[id=%d, name=%s, email=%s]",
                getRole(), id, name, email);
    }
}