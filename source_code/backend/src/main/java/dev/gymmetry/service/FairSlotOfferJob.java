package dev.gymmetry.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FairSlotOfferJob {

    private final Gym gym;

    public FairSlotOfferJob(Gym gym) {
        this.gym = gym;
    }

    @Scheduled(cron = "0 */15 * * * *")
    public void expireOffers() {
        int expired = gym.expireWaitlistOffers();
        if (expired > 0) {
            System.out.println("  ✓ FairSlot expired " + expired
                    + " waitlist offer" + (expired == 1 ? "" : "s"));
        }
    }
}
