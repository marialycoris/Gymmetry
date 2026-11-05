package dev.gymmetry.domain;

import java.util.ArrayList;
import java.util.List;

import dev.gymmetry.enums.Role;

public class Trainer extends Person {

    private final List<String> specialties;

    private String firstName;
    private String lastName;
    private String gender;
    private String contactNumber;
    private String address;
    private String license;

    public Trainer(int id, String name, String email) {
        this(id, name, email, null, null, null, null, null, null);
    }

    public Trainer(int id, String name, String email, String firstName, String lastName,
                   String gender, String contactNumber, String address, String license) {
        super(id, name, email);
        this.specialties = new ArrayList<>();
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.contactNumber = contactNumber;
        this.address = address;
        this.license = license;
    }

    public List<String> getSpecialties() {
        return List.copyOf(specialties);   // defensive copy — encapsulation
    }

    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getGender() { return gender; }
    public String getContactNumber() { return contactNumber; }
    public String getAddress() { return address; }
    public String getLicense() { return license; }

    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setGender(String gender) { this.gender = gender; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public void setAddress(String address) { this.address = address; }
    public void setLicense(String license) { this.license = license; }

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