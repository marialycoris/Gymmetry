package dev.gymmetry.domain;

import java.util.ArrayList;
import java.util.List;

import dev.gymmetry.enums.Role;

public class Trainer extends Person {

    private final List<String> specialties;

    public Trainer(int id, String name, String email) {
        super(id, name, email);
        this.specialties = new ArrayList<>();
    }

    public List<String> getSpecialties() {
        return List.copyOf(specialties);   // defensive copy — encapsulation
    }

    public void addSpecialty(String specialty) {
        if (specialty == null || specialty.isBlank()) {
            throw new IllegalArgumentException("Specialty cannot be blank");
        }
        if (!specialties.contains(specialty)) {
            specialties.add(specialty);
        }
    }

    public void removeSpecialty(String specialty) {
        specialties.remove(specialty);
    }

    @Override
    public Role getRole() {
        return Role.TRAINER;
    }
}