package dev.gymmetry.domain;

import java.time.LocalDateTime;

public class AttendanceRecord {

    private final int id;
    private final Member member;
    private final Trainer trainer;
    private final Session session;
    private final LocalDateTime recordedAt;

    public AttendanceRecord(int id, Member member, Trainer trainer, Session session) {
        if (member == null || trainer == null || session == null)
            throw new IllegalArgumentException("Member, trainer, session required");
        this.id = id;
        this.member = member;
        this.trainer = trainer;
        this.session = session;
        this.recordedAt = LocalDateTime.now();
    }

    public int getId() { return id; }
    public Member getMember() { return member; }
    public Trainer getTrainer() { return trainer; }
    public Session getSession() { return session; }
    public LocalDateTime getRecordedAt() { return recordedAt; }

    @Override
    public String toString() {
        return String.format("Attendance[id=%d, member=%s, trainer=%s, at=%s]",
                id, member.getName(), trainer.getName(), recordedAt);
    }
}