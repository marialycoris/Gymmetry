package dev.gymmetry.domain;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import dev.gymmetry.enums.MembershipStatus;
import dev.gymmetry.enums.Role;

public class Member extends Person {

    private MembershipPlan plan;
    private MembershipStatus membershipStatus;
    private LocalDate startDate;
    private LocalDate expiryDate;

    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String contactNumber;
    private String emergencyContactNumber;
    private String medicalCondition;

    public Member(int id, String name, String email, MembershipPlan plan) {
        this(id, name, email, plan, null, null, null, null, null, null, null, null);
    }

    public Member(int id, String name, String email, MembershipPlan plan,
                  String firstName, String lastName, LocalDate dateOfBirth, String gender,
                  String address, String contactNumber, String emergencyContactNumber,
                  String medicalCondition) {
        super(id, name, email);
        if (plan == null) throw new IllegalArgumentException("Plan cannot be null");
        this.plan = plan;
        this.membershipStatus = MembershipStatus.PENDING_PAYMENT;
        this.startDate = null;
        this.expiryDate = null;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.address = address;
        this.contactNumber = contactNumber;
        this.emergencyContactNumber = emergencyContactNumber;
        this.medicalCondition = medicalCondition;
    }

    // --- Getters ---
    public MembershipPlan getPlan() { return plan; }
    public MembershipStatus getMembershipStatus() { return membershipStatus; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getGender() { return gender; }
    public String getAddress() { return address; }
    public String getContactNumber() { return contactNumber; }
    public String getEmergencyContactNumber() { return emergencyContactNumber; }
    public String getMedicalCondition() { return medicalCondition; }

    // --- Member details ---
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public void setGender(String gender) { this.gender = gender; }
    public void setAddress(String address) { this.address = address; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public void setEmergencyContactNumber(String emergencyContactNumber) { this.emergencyContactNumber = emergencyContactNumber; }
    public void setMedicalCondition(String medicalCondition) { this.medicalCondition = medicalCondition; }

    // --- Plan management ---
    public void setPlan(MembershipPlan plan) {
        if (plan == null) throw new IllegalArgumentException("Plan cannot be null");
        this.plan = plan;
    }

    // --- Lifecycle ---

    /**
     * First-time activation after first payment.
     */
    public void activate(LocalDate paymentDate) {
        this.startDate = paymentDate;
        this.expiryDate = paymentDate.plusMonths(plan.getDurationMonths());
        this.membershipStatus = MembershipStatus.ACTIVE;
    }

    /**
     * Renewal. If still valid, new period stacks on current expiry.
     * If expired, new period starts from paymentDate.
     */
    public void renew(MembershipPlan newPlan, LocalDate paymentDate) {
        if (newPlan == null) throw new IllegalArgumentException("Plan cannot be null");
        this.plan = newPlan;

        LocalDate base = isMembershipValid()
                ? expiryDate.plusDays(1)
                : paymentDate;

        this.startDate = base;
        this.expiryDate = base.plusMonths(newPlan.getDurationMonths());
        this.membershipStatus = MembershipStatus.ACTIVE;
    }

    public void deactivate() {
        this.membershipStatus = MembershipStatus.INACTIVE;
    }

    // --- Validity ---

    public boolean isMembershipValid() {
        if (membershipStatus != MembershipStatus.ACTIVE) return false;
        if (expiryDate == null) return false;
        return !LocalDate.now().isAfter(expiryDate);
    }

    /**
     * Refreshes EXPIRED status if past expiry. Call before displaying.
     */
    public void refreshStatus() {
        if (membershipStatus == MembershipStatus.ACTIVE
                && expiryDate != null
                && LocalDate.now().isAfter(expiryDate)) {
            this.membershipStatus = MembershipStatus.EXPIRED;
        }
    }

    public long daysRemaining() {
        if (expiryDate == null) return 0;
        long days = ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
        return Math.max(days, 0);
    }

    // --- Pricing ---

    public double getMonthlyFee() {
        return plan.calculateMonthlyFee();
    }

    /**
     * Returns true if 6 months have passed since expiry with no renewal.
     * Used by AuthService to lazily disable stale accounts on login.
     */
    
    public boolean isAutoDisableDue() {
        if (expiryDate == null) return false;   // never activated, skip
        return LocalDate.now().isAfter(expiryDate.plusMonths(6));
    }

    @Override
    public Role getRole() { return Role.MEMBER; }

    public void setMembershipStatus(MembershipStatus status) {
    this.membershipStatus = status;
    }

    public void setStartDate(java.time.LocalDate d) {
        this.startDate = d;
    }

    public void setExpiryDate(java.time.LocalDate d) {
        this.expiryDate = d;
    }

    @Override
    public String toString() {
        return String.format(
            "Member[id=%d, name=%s, plan=%s, status=%s, expires=%s]",
            getId(), getName(), plan.getName(), membershipStatus, expiryDate);
    }
}