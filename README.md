# Gymmetry: A Membership, Session Booking, Attendance Management, and Member Engagement System for Fitness Centers

## Project Description

A study by Abu Bakar and Md Said (2019) identified problems associated with manual booking, including the need for customers to visit the gym personally, difficulty checking class or trainer availability, possible duplicate bookings, and the risk of misplaced booking records. The researchers also reported that 90% of their 30 respondents indicated a need for an improved booking process (Abu Bakar & Md Said, 2019).

To address these problems, Gymmetry provides a centralized gym-management system with separate role-based UI flows for **Admin**, **Trainer**, and **Member**. Members can manage their membership information, view available sessions and trainers, book sessions, respond to proposed trainer changes, monitor attendance, and see in-app waitlist offers. Trainers can view their schedules, respond to session requests, record attendance, and flag member no-shows. Administrators can manage accounts, memberships, sessions, attendance records, payments, and reports through a centralized dashboard.

Beyond standard gym-management functions, Gymmetry introduces **Gymmetry Pulse** and **Gymmetry FairSlot** to improve member engagement and session scheduling. Gymmetry Pulse analyzes attendance patterns and membership activity to help administrators identify changes in participation and prioritize member follow-ups. Gymmetry FairSlot improves the booking experience through waitlists, in-app slot offers, and alternative session suggestions when preferred schedules are fully booked or become unavailable.

By combining centralized record management with engagement insights and more flexible booking options, Gymmetry aims to reduce booking conflicts, improve information accessibility, support more efficient administrative work, and provide a more convenient experience for both gym staff and members.

## Target Users / Stakeholders

| Stakeholder | Role |
|---|---|
| **Gym Admin / Owner** | Manages members, trainers, payments, reports, session reassignment, cancellations, attendance overrides, waitlists, and engagement insights |
| **Trainer** | Handles session requests, views assigned sessions, marks attendance, and flags member no-shows |
| **Member** | Manages their membership, books or joins a waitlist for sessions, approves or rejects proposed trainer changes, and monitors attendance |

## Objectives

1. **Digitize membership management** — replace paper-based records and spreadsheets with a structured database.
2. **Automate the membership lifecycle** — manage registration, payment recording, activation, expiry, renewal, and lazy account disablement after six months past expiry.
3. **Provide structured session booking** — allow members and admins to choose trainers and time slots while enforcing trainer responses, reassignment approvals, cancellations, and booking-conflict rules.
4. **Improve session availability and booking flexibility** — implement waitlists, in-app slot offers, and alternative session suggestions through Gymmetry FairSlot.
5. **Ensure accurate attendance tracking** — record member attendance from trainer-marked completed sessions rather than self-reported attendance.
6. **Empower administrators with oversight** — allow attendance overrides, decline review, reassignment subject to member approval, cancellations, and report generation.
7. **Provide member engagement insights** — use Gymmetry Pulse to analyze attendance patterns and membership activity and support timely member follow-ups.
8. **Enforce business rules consistently** — prevent inactive or expired members from booking sessions and lazily disable accounts six months after expiry when they log in.
9. **Provide a foundation for future expansion** — expose a REST API and web frontend for broader accessibility and future enhancements.

## Key Features

> **Progress:** **Implemented** = working end to end · **Partial** = usable in the web UI/backend but with a documented limitation · **Not started** = not yet built.

### 1. Authentication & User Management
**Status:** Implemented — UI routing is role-based; REST endpoints are not protected by server-side authorization.

Role-based login for Admin, Trainer, and Member accounts. Passwords follow a format policy (at least 8 characters with an uppercase letter, a lowercase letter, a number, and a special character) and are stored using BCrypt hashing. Newly registered Trainer and Member accounts receive a temporary password and must change it on first login. Admins can open a user's profile and set a new temporary password, which forces a change on the next login. The seeded `admin` / `admin123` account is exempt from the password policy because it is created through the seed path.

### 2. Membership Management
**Status:** Implemented

Member registration, plan assignment (Basic / Premium / VIP), activation, renewal, expiry tracking, and lazy account disablement when more than six months have passed since `expiryDate` without renewal.

### 3. Payment Recording
**Status:** Implemented

Admins record payments through Cash, Card, or E-wallet (`GCASH` is exposed to the frontend as `E_WALLET`), with payment history per member and revenue totals for administrative reporting.

### 4. Session Booking
**Status:** Implemented

Members select trainers and available time slots. Admins can also book on a member's behalf from the Sessions tab. The system validates membership status, trainer availability, fixed slot capacity, and conflicting bookings.

### 5. Trainer Response Workflow
**Status:** Implemented

Trainers review session requests and accept or decline them, with a reason required for declined requests.

### 6. Decline Review & Reassignment
**Status:** Implemented

Administrators review declined sessions and propose another trainer. The member must accept that trainer before the request is shown to the proposed trainer for a response; rejecting the proposal cancels the session.

### 7. Attendance Tracking
**Status:** Implemented

Trainers mark scheduled sessions as completed or flag a member as a no-show. Completion records member attendance; no-shows set the session to `NOT_HELD` with reason `MEMBER_NO_SHOW`. Administrators can mark a trainer absent (`CANCELLED` / `TRAINER_ABSENT`), cancel a session directly (`CANCELLED` / `ADMIN_CANCELLED`), or override an existing `COMPLETED` / `NOT_HELD` outcome through `PUT /api/sessions/{id}/attendance`. The backend keeps the member attendance record in sync by adding or removing it as needed.

### 8. Deadline Sweep
**Status:** Implemented

Sessions that have not been marked by the trainer by 23:59:59 of the session date are automatically flagged as `NOT_HELD`, with reason `NOT_MARKED` and the trainer marked `ABSENT`. The backend runs the sweep automatically at midnight and once on startup to catch anything missed while the server was offline.

### 9. Reports
**Status:** Implemented

Generate reports covering revenue totals, active and inactive members, sessions by status, members per membership plan, and per-trainer held/not-held session counts. "Trainer attendance" in this report is derived from completed and not-held sessions; it is separate from the session-level `trainerStatus` field.

### 10. Role-Based Dashboards
**Status:** Implemented — UI routing only; API endpoints are not yet protected by server-side authorization.

Each role has a separate dashboard with the actions permitted by its UI flow. The REST API itself currently trusts caller-supplied IDs and does not enforce roles.

### 11. Gymmetry Pulse — Member Engagement Insights
**Status:** Implemented

Analyze member attendance history, booking activity, and membership status to identify changes in participation and potential follow-up needs. Active, non-disabled members are included in Pulse results.

Key capabilities:
- Track member attendance patterns over time.
- Compare the last 30 days with the previous 30 days to identify declining attendance.
- Highlight idle members, upcoming membership expirations, and recent missed sessions.
- Provide administrators with explanations for flagged records and suggested follow-up actions.
- Present engagement indicators through admin dashboard summaries and the Pulse tab.

Pulse provides rule-based indicators to support staff decisions. A flagged member is not automatically considered likely to cancel their membership, and staff can review the available context before taking action.

### 12. Gymmetry FairSlot — Flexible Session Booking
**Status:** Implemented

Improve session availability and help members find suitable alternatives when their preferred time slots are unavailable.

Key capabilities:
- Allow members to join a waitlist for fully booked sessions (`POST /api/fairslot/waitlist`).
- Offer the next waitlisted member an in-app slot for 24 hours when a booking is cancelled or a schedule changes. This is an in-app offer only; no email, SMS, or push notification is sent.
- Expire unclaimed offers every 15 minutes and pass the slot to the next member.
- Suggest alternative sessions or trainers when a requested slot is unavailable (`GET /api/fairslot/alternatives`).
- Maintain a transparent waitlist order based on booking request order (`GET /api/fairslot/waitlist`).
- Provide administrators with insights into frequently requested time slots and trainer demand (`GET /api/fairslot/insights`).

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 17 |
| Backend Framework | Spring Boot 3.2 (REST API) |
| Build Tool | Maven |
| Database | PostgreSQL via JDBC (version is not pinned by project configuration) |
| Password Hashing | BCrypt (`spring-security-crypto`) |
| Frontend | React 19 + TypeScript + Tailwind CSS 4 + Vite 8 |
| Version Control | Git + GitHub |

## Project Structure

```bash
gymmetry/
├── README.md
├── UML_diagrams/
│   ├── ActivityDiagram.png
│   ├── ClassDiagram.png
│   ├── SequenceDiagram.png
│   └── UseCase.png
├── java-upgrade/
├── source_code/
│   ├── REQUIREMENTS.md
│   ├── backend/
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/dev/gymmetry/
│   │       │   ├── GymmetryApplication.java
│   │       │   ├── config/          # Global CORS configuration
│   │       │   ├── controllers/     # Auth, members, trainers, sessions, payments, reports, pulse, fairslot
│   │       │   ├── db/              # Database connection + schema initializer
│   │       │   ├── domain/          # Person, Member, Trainer, Admin, Session, Payment, ...
│   │       │   ├── enums/
│   │       │   ├── exception/
│   │       │   ├── repository/      # JDBC data access
│   │       │   ├── service/         # Gym, AuthService, PasswordPolicy, scheduled jobs
│   │       │   └── ui/              # Legacy console UI (not launched by Spring Boot)
│   │       └── resources/sql/schema.sql
│   └── frontend/
│       ├── package.json
│       └── src/
│           ├── api/                 # REST client + inactive demo mock data
│           ├── components/
│           ├── context/
│           ├── hooks/
│           ├── lib/
│           ├── pages/               # Login, Admin, Trainer, Member dashboards
│           ├── App.tsx
│           └── main.tsx
├── .gitattributes
└── .gitignore
```

## Setup / Execution Instructions

### Prerequisites

- Java 17 or later
- Maven 3.6.3+
- PostgreSQL with a database named `gymmetry` (or configure `DB_NAME`)
- Node.js 20.19+ or 22.12+ and npm (required by Vite 8)

### Database Setup

1. Start PostgreSQL.
2. Create a database named `gymmetry`, or set `DB_NAME` to an existing database.
3. The backend tries `127.0.0.1:5433` first, then `127.0.0.1:5432`.
4. Default credentials are `postgres` / `123` with a 3-second connect timeout. Override them for your environment.

Override database settings with environment variables or matching JVM system properties:

| Environment variable | System property | Default |
|---|---|---|
| `DB_URL` | `db.url` | — |
| `DB_HOST` | `db.host` | `127.0.0.1` |
| `DB_PORTS` | `db.ports` | `5433,5432` |
| `DB_PORT` | `db.port` | — |
| `DB_NAME` | `db.name` | `gymmetry` |
| `DB_USER` | `db.user` | `postgres` |
| `DB_PASSWORD` | `db.password` | `123` |
| `DB_CONNECT_TIMEOUT` | `db.connectTimeout` | `3` |

### Backend

```bash
cd source_code/backend
mvn clean compile
mvn spring-boot:run
```

The schema is created automatically on first run, and the default admin account is seeded if it does not exist.

Default admin credentials:

- **Username:** `admin`
- **Password:** `admin123`

The REST API is served at `http://localhost:8080/api`.

### Frontend

```bash
cd source_code/frontend
npm install
npm run dev
```

The Vite dev server starts at the default address `http://localhost:5173`.

`source_code/frontend/src/api/client.ts` currently has `USE_MOCK = false`, so the frontend calls the Spring Boot API at `http://localhost:8080/api`. `src/api/mock.ts` remains as inactive demo data; the `admin`, `trainer`, `member`, and `newbie` demo logins in that file are not valid against the live backend. Use accounts stored in PostgreSQL instead.

Additional npm scripts: `npm run build`, `npm run lint`, and `npm run preview`.

## REST API Summary

All routes are under `/api`. The frontend uses these endpoints directly; the `POST /api/sessions/{id}/accept` and `POST /api/sessions/{id}/decline` routes are older compatibility endpoints, while the frontend uses `PUT /api/sessions/{id}/response`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/change-password` |
| Members | `GET /members`, `GET /members/{id}`, `POST /members`, `PUT /members/{id}`, `PUT /members/{id}/plan`, `POST /members/{id}/renew`, `PUT /members/{id}/status`, `PUT /members/{id}/password`, `POST /members/{id}/pay` |
| Trainers | `GET /trainers`, `GET /trainers/{id}`, `POST /trainers`, `PUT /trainers/{id}`, `PUT /trainers/{id}/status`, `PUT /trainers/{id}/password`, `GET /trainers/{id}/slots?date=` |
| Sessions | `GET /sessions`, `GET /sessions/member/{memberId}`, `GET /sessions/trainer/{trainerId}`, `POST /sessions`, `PUT /sessions/{id}/response`, `PUT /sessions/{id}/reassignment-response`, `PUT /sessions/{id}/complete`, `PUT /sessions/{id}/no-show`, `PUT /sessions/{id}/trainer-absent`, `PUT /sessions/{id}/cancel`, `PUT /sessions/{id}/attendance`, `POST /sessions/{id}/accept`, `POST /sessions/{id}/decline`, `PUT /sessions/{id}/reassign` |
| Payments | `GET /payments?memberId=`, `POST /payments` |
| Reports | `GET /reports/summary` |
| Pulse | `GET /pulse/members` |
| FairSlot | `GET /fairslot/waitlist`, `POST /fairslot/waitlist`, `DELETE /fairslot/waitlist/{id}`, `POST /fairslot/waitlist/{id}/claim`, `GET /fairslot/alternatives`, `GET /fairslot/insights` |

Session responses include `status`, `declineReason`, `completionNote`, `notHeldReason`, `cancellationReason`, `trainerStatus`, `trainerStatusOverridden`, and `overrideReason` where applicable.

## Current Limitations

- REST endpoints do not enforce authentication or role-based authorization. The UI separates roles, but API callers can supply member, trainer, and session IDs directly.
- CORS is open to all origins; configure it for production use.
- FairSlot notifications are in-app only; no email, SMS, or push delivery is implemented.
- Trainer schedules are not user-editable. Slots are fixed (`06:00`, `08:00`, `10:00`, `16:00`, `18:00`, `20:00`) with specialty-based capacities.
- Member reschedule and member cancel logic exists in the domain/service layer and legacy console code, but there is no REST route or web UI action for them.
- A legacy console UI exists under `backend/src/main/java/dev/gymmetry/ui/`, but the delivered entry point starts only the Spring Boot web server.
- The seeded `admin123` password does not satisfy the normal password policy because it is created through the seed path.

## UML Diagrams

```
Use Case Diagram -> https://drive.google.com/file/d/1OvcyyGdVhXLmDtI7FNU1ZwnMG2JZRvRe/view?usp=drive_link

Class Diagram -> https://drive.google.com/file/d/1Bu0xiMndS38IwmjBtsm0O_Cn6HSly6CV/view?usp=drive_link

Sequence Diagram -> https://drive.google.com/file/d/1ewgt1jRo30dlitkDIEZ5dQHvy3QE-3Y9/view?usp=drive_link

Activity Diagram -> https://drive.google.com/file/d/1W_8G1LUVu4bOr0dcyuPg8_lI4WfulUnL/view?usp=drive_link
```

All diagram files are stored in the `UML_diagrams/` directory as well.
