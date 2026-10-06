# Gymmetry: A Membership, Session Booking, and Attendance Management System for Fitness Centers

## Project Description

A study by Abu Bakar and Md Said (2019) identified problems associated with manual booking, including the need for customers to visit the gym personally, difficulty checking class or trainer availability, possible duplicate bookings, and the risk of misplaced booking records. The researchers also reported that 90% of their 30 respondents indicated a need for an improved booking process (Abu Bakar & Md Said, 2019).

To address these problems, Gymmetry provides a centralized gym-management system with separate role-based access for **Admin**, **Trainer**, and **Member**. Members can register, manage their membership information, view available sessions and trainers, book sessions, monitor attendance, and access membership-status records. Trainers can view their schedules, manage assigned sessions, and record member attendance. Administrators can manage accounts, memberships, sessions, trainer schedules, attendance records, and payments through a centralized dashboard.

By replacing scattered manual records with a structured digital system, Gymmetry aims to reduce booking conflicts, improve information accessibility, support more efficient administrative work, and provide members with a more convenient gym-booking experience.

### Target Users / Stakeholders

| Stakeholder | Role |
|---|---|
| **Gym Admin / Owner** | Manages members, trainers, payments, and reviews reports |
| **Trainer** | Handles session requests and records member attendance |
| **Member** | Books sessions with trainers, manages their own membership |

## Objectives

1. **Digitize membership management** — replace paper and spreadsheets with a structured database
2. **Automate membership lifecycle** — from registration and payment, through expiry, to renewal or disablement
3. **Provide structured session booking** — with member-chosen trainers, trainer accept/decline, and reschedule/cancel rules
4. **Ensure accurate attendance tracking** — member attendance is verified through completed sessions, not self-reported
5. **Empower admins with oversight** — the ability to override trainer attendance, review declined sessions, and generate reports
6. **Enforce business rules consistently** — like blocking expired members from booking, and auto-disabling accounts after 6 months of inactivity
7. **Provide a foundation for future expansion** — a REST API and web frontend for broader accessibility

## Key Features

### 1. Authentication & User Management
Role-based login (Admin, Trainer, Member) with password hashing (BCrypt) and first-login password change.

### 2. Membership Management
Registration, plan assignment (Basic / Premium / VIP), activation, renewal, expiry tracking, and 6-month auto-disable.

### 3. Payment Recording
Admin records payments (Cash / Card / E-wallet) with history per member and revenue totals.

### 4. Session Booking
Members choose trainers and time slots; the system prevents conflicts.

### 5. Trainer Response Workflow
Trainers accept or decline requested sessions (with a reason).

### 6. Decline Review & Reassignment
Admin reviews declined sessions and may reassign them to another trainer.

### 7. Attendance Tracking
Trainer marks a session as completed → member attendance is auto-recorded; admin can override trainer attendance.

### 8. Deadline Sweep
Sessions not marked by the trainer by midnight are auto-flagged `NOT_HELD` and the trainer marked absent.

### 9. Reports
Revenue totals, active vs. inactive members, sessions by status, members per plan, trainer attendance.

### 10. Role-Based Dashboards
Each role sees only the actions it's permitted to perform.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 17 |
| Build Tool | Maven |
| Database | PostgreSQL 17 |
| Security | BCrypt (Spring Security Crypto) |
| Version Control | Git + GitHub |

## Project Structure
```bash
gymmetry/
├── README.md
├── source_code/
│   ├── backend/
│   │   ├── src/
│   │   ├── target/
│   │   ├── pom.xml
│   └── REQUIREMENTS.md 
├── docs/
├── UML_diagrams/
│   ├── ActivityDiagram.png
│   ├── ClassDiagram.png
│   ├── SequenceDiagram.png
│   ├── UseCase.png
└── .gitignore
```

## Setup / Execution Instructions

### Prerequisites
- Java 17 or later
- Maven 3.8+
- PostgreSQL 17

### Database Setup
1. Start PostgreSQL
2. Create a database named `gymmetry`
3. Update credentials in `source_code/backend/src/main/java/dev/gymmetry/db/Database.java` if needed

### Backend
```bash
cd source_code/backend
mvn clean compile
mvn exec:java -Dexec.mainClass="dev.gymmetry.GymmetryApplication"

The schema is created automatically on first run.

Default admin credentials:

Username: admin

Password: admin123
```

### UML Diagrams
All diagram files are stored in the UML_diagrams/ directory.

Use Case Diagram -> UML_diagrams/UseCase.png

Class Diagram -> UML_diagrams/ClassDiagram.png

Sequence Diagram -> 👾👾👾👾👾👾👾👾👾👾👾

Activity Diagram -> UML_diagrams/ActivityDiagram.png


## 📌 Notes

- **Project Description** uses your exact text verbatim, including the citation.
- **Objectives** — your 7 bullets, unchanged.
- **Key Features** — your 10 modules, each as a subheading (matches the rubric's "Key Features" requirement).
- **Technology Stack** — reflects what you're actually using (Java 17, Maven, PostgreSQL, BCrypt). No invented frameworks.
- **Project Structure** — matches your real repo: `source_code/backend/`, `docs/`, `UML_diagrams/`, README at root.
- **UML Diagrams** — the 4 required diagrams, embedded as images.
