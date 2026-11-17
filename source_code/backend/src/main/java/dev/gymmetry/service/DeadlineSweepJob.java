package dev.gymmetry.service;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DeadlineSweepJob {

    private final Gym gym;

    public DeadlineSweepJob(Gym gym) {
        this.gym = gym;
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void sweepAtMidnight() {
        sweep();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void sweepOnStartup() {
        sweep();
    }

    private void sweep() {
        int flagged = gym.sweepMissedDeadlines();
        if (flagged > 0) {
            System.out.println("  ✓ Deadline sweep flagged " + flagged
                    + " session" + (flagged == 1 ? "" : "s") + " as not held");
        }
    }
}
