CREATE TABLE IF NOT EXISTS users (
    username        VARCHAR(50) PRIMARY KEY,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL,
    person_id       INT NOT NULL,
    account_status  VARCHAR(20) NOT NULL DEFAULT 'ENABLED',
    must_change_pw  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS members (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    plan_name           VARCHAR(50) NOT NULL,
    membership_status   VARCHAR(20) NOT NULL,
    start_date          DATE,
    expiry_date         DATE
);

CREATE TABLE IF NOT EXISTS trainers (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS trainer_specialties (
    trainer_id  INT NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    specialty   VARCHAR(50) NOT NULL,
    PRIMARY KEY (trainer_id, specialty)
);

CREATE TABLE IF NOT EXISTS sessions (
    id                      SERIAL PRIMARY KEY,
    member_id               INT NOT NULL REFERENCES members(id),
    trainer_id              INT NOT NULL REFERENCES trainers(id),
    scheduled_at            TIMESTAMP NOT NULL,
    status                  VARCHAR(20) NOT NULL,
    trainer_status          VARCHAR(20) NOT NULL,
    trainer_overridden      BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason         TEXT,
    decline_reason          TEXT,
    not_held_reason         VARCHAR(30),
    cancellation_reason     VARCHAR(30),
    created_at              TIMESTAMP NOT NULL,
    updated_at              TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id              SERIAL PRIMARY KEY,
    member_id       INT NOT NULL REFERENCES members(id),
    plan_name       VARCHAR(50) NOT NULL,
    amount          NUMERIC(10,2) NOT NULL,
    method          VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    paid_at         TIMESTAMP NOT NULL,
    recorded_by     VARCHAR(100) NOT NULL,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS attendance (
    id              SERIAL PRIMARY KEY,
    member_id       INT NOT NULL REFERENCES members(id),
    trainer_id      INT NOT NULL REFERENCES trainers(id),
    session_id      INT NOT NULL REFERENCES sessions(id),
    recorded_at     TIMESTAMP NOT NULL
);