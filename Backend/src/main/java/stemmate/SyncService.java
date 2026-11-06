package stemmate;

import java.util.ArrayList;
import java.util.List;

public class SyncService {
    private List<SyncTask> queue = new ArrayList<>();
    private PlanRepository repository = new PlanRepository();

    public void enqueueSync(int planId) {
        SessionPlan plan = repository.getPlan(planId);
        if (plan != null) {
            plan.setSyncStatus("pending");
            repository.savePlanDraft(plan);
            queue.add(new SyncTask(planId));
            System.out.println("[SYNC] Plan " + planId + " added to sync queue.");
        }
    }

    public void processSyncQueue(boolean isOnline) {
        if (!isOnline) {
            System.out.println("[SYNC] Device is OFFLINE. Queue paused. Data safe on disk.");
            return;
        }

        for (SyncTask task : queue) {
            if (task.status.equals("pending") || task.status.equals("failed")) {
                System.out.println("[SYNC] Attempting to sync Plan " + task.planId + "...");

                // Simulate network failure on the first attempt
                boolean networkSuccess = (task.attempts > 0);

                if (networkSuccess) {
                    System.out.println("[SYNC] SUCCESS: Plan " + task.planId + " synced to server.");
                    task.status = "success";

                    SessionPlan plan = repository.getPlan(task.planId);
                    plan.setSyncStatus("synced");
                    repository.savePlanDraft(plan);

                } else {
                    task.attempts++;
                    task.status = "failed";

                    // Member 2 Rule 3.2: Exponential backoff
                    long delaySeconds = (long) Math.pow(2, task.attempts);
                    System.out.println("[SYNC] FAILED. Retrying in " + delaySeconds + " seconds (Attempt " + task.attempts + ")...");

                    try {
                        Thread.sleep(delaySeconds * 1000);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }

                    processSyncQueue(true);
                }
            }
        }
    }
}