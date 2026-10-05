package dev.gymmetry.domain;

import dev.gymmetry.enums.Role;

public class Admin extends Person {

    public Admin(int id, String name, String email) {
        super(id, name, email);
    }

    @Override
    public Role getRole() {
        return Role.ADMIN;
    }
}