package stemmate;

public class SyncTask {
    public int planId;
    public int attempts;
    public String status; // "pending", "failed", "success"

    public SyncTask(int planId) {
        this.planId = planId;
        this.attempts = 0;
        this.status = "pending";
    }
}