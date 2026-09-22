package dev.gymmetry.enums;

//Fixed set of values, type-safe, no risk of typos like "ADMIN " or "admin". 
// use Role.ADMIN in switch statements later for menu routing.

public enum Role {
    ADMIN,
    TRAINER,
    MEMBER
}