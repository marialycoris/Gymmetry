# Gymmetry: A Membership, Session Booking, Attendance Management, and Member Engagement System for Fitness Centers

## Project Description

A study by Abu Bakar and Md Said (2019) identified problems associated with manual booking, including the need for customers to visit the gym personally, difficulty checking class or trainer availability, possible duplicate bookings, and the risk of misplaced booking records. The researchers also reported that 90% of their 30 respondents indicated a need for an improved booking process (Abu Bakar & Md Said, 2019).

To address these problems, Gymmetry provides a centralized gym-management system with separate role-based access for **Admin**, **Trainer**, and **Member**. Members can manage their membership information, view available sessions and trainers, book sessions, monitor attendance, and access membership-status records. Trainers can view their schedules, manage assigned sessions, and record member attendance. Administrators can manage accounts, memberships, sessions, trainer schedules, attendance records, and payments through a centralized dashboard.

Beyond standard gym-management functions, Gymmetry introduces **Gymmetry Pulse** and **Gymmetry FairSlot** to improve member engagement and session scheduling. Gymmetry Pulse analyzes attendance patterns and membership activity to help administrators identify changes in participation and prioritize member follow-ups. Gymmetry FairSlot improves the booking experience through waitlists, available-slot notifications, and alternative session suggestions when preferred schedules are fully booked or become unavailable.

By combining centralized record management with engagement insights and more flexible booking options, Gymmetry aims to reduce booking conflicts, improve information accessibility, support more efficient administrative work, and provide a more convenient experience for both gym staff and members.

## Target Users / Stakeholders

| Stakeholder | Role |
|---|---|
| **Gym Admin / Owner** | Manages members, trainers, payments, and reports; reviews member engagement insights and scheduling trends |
| **Trainer** | Handles session requests, manages assigned schedules, and records member attendance |
| **Member** | Manages their membership, books sessions, monitors attendance, and receives relevant booking notifications |

## Objectives

1. **Digitize membership management** — replace paper-based records and spreadsheets with a structured database.
2. **Automate the membership lifecycle** — manage registration, payment recording, activation, expiry, renewal, and account disablement.
3. **Provide structured session booking** — allow members to choose trainers and time slots while enforcing trainer responses, rescheduling, cancellation, and booking-conflict rules.
4. **Improve session availability and booking flexibility** — implement waitlists, available-slot notifications, and alternative session suggestions through Gymmetry FairSlot.
5. **Ensure accurate attendance tracking** — record member attendance based on completed sessions rather than self-reported attendance.
6. **Empower administrators with oversight** — allow attendance overrides, review of declined sessions, reassignment of bookings, and report generation.
7. **Provide member engagement insights** — use Gymmetry Pulse to analyze attendance patterns and membership activity, identify potential changes in participation, and support timely member follow-ups.
8. **Enforce business rules consistently** — prevent expired members from booking sessions and automatically disable accounts after six months of inactivity, according to the system's defined rules.
9. **Provide a foundation for future expansion** — support a REST API and web frontend for broader accessibility and future enhancements.

## Key Features

### 1. Authentication & User Management
Role-based login for Admin, Trainer, and Member accounts, with password hashing using BCrypt and a first-login password change requirement.

### 2. Membership Management
Member registration, plan assignment (Basic / Premium / VIP), activation, renewal, expiry tracking, and automatic account disablement after six months of inactivity.

### 3. Payment Recording
Admin records payments through Cash, Card, or E-wallet, with payment history per member and revenue totals for administrative reporting.

### 4. Session Booking
Members select trainers and available time slots. The system validates availability and prevents conflicting bookings.

### 5. Trainer Response Workflow
Trainers review session requests and accept or decline them, with a reason required for declined requests.

### 6. Decline Review & Reassignment
Administrators review declined sessions and may reassign them to another trainer to help members secure an alternative schedule.

### 7. Attendance Tracking
Trainers mark sessions as completed, which automatically records member attendance. Administrators can override trainer attendance when necessary.

### 8. Deadline Sweep
Sessions that have not been marked by the trainer by midnight are automatically flagged as `NOT_HELD`, and the trainer is marked absent according to the system's attendance rules.

### 9. Reports
Generate reports covering revenue totals, active and inactive members, sessions by status, members per membership plan, and trainer attendance.

### 10. Role-Based Dashboards
Each role has access to the features and actions permitted by its assigned permissions.

### 11. Gymmetry Pulse — Member Engagement Insights
Analyze member attendance history, booking activity, and membership status to identify changes in participation and potential follow-up needs.

Key capabilities:
- Track member attendance patterns over time.
- Identify declining attendance compared with a member's previous activity.
- Highlight upcoming membership expirations and other relevant engagement indicators.
- Provide administrators with explanations for flagged records and suggested follow-up actions.
- Present attendance and engagement trends through dashboard summaries.

Pulse provides rule-based indicators to support staff decisions. A flagged member is not automatically considered likely to cancel their membership, and staff can review the available context before taking action.

### 12. Gymmetry FairSlot — Flexible Session Booking
Improve session availability and help members find suitable alternatives when their preferred time slots are unavailable.

Key capabilities:
- Allow members to join a waitlist for fully booked sessions.
- Notify waitlisted members when a slot becomes available following a cancellation or schedule change.
- Suggest alternative sessions or trainers when a requested slot is unavailable.
- Maintain a transparent waitlist order based on defined booking rules.
- Provide administrators with insights into frequently requested time slots and scheduling demand.

FairSlot aims to make better use of available trainer schedules while giving members more opportunities to book suitable sessions.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 17 |
| Build Tool | Maven |
| Database | PostgreSQL 17 |
| Security | BCrypt (Spring Security Crypto) |
| Frontend (planned) | React + TypeScript + Tailwind CSS |
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

```
Use Case Diagram -> https://drive.google.com/file/d/1OvcyyGdVhXLmDtI7FNU1ZwnMG2JZRvRe/view?usp=drive_link

Class Diagram -> https://drive.google.com/file/d/1Bu0xiMndS38IwmjBtsm0O_Cn6HSly6CV/view?usp=drive_link

Sequence Diagram -> https://drive.google.com/file/d/1ewgt1jRo30dlitkDIEZ5dQHvy3QE-3Y9/view?usp=drive_link

Activity Diagram -> https://drive.google.com/file/d/1W_8G1LUVu4bOr0dcyuPg8_lI4WfulUnL/view?usp=drive_link
```
All diagram files are stored in the UML_diagrams/ directory as well.
