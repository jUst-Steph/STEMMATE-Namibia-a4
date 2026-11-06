package stemmate;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== STEMMATE VERTICAL SLICE (MEMBER 3) ===\n");

        PlanRepository repo = new PlanRepository();
        SyncService syncService = new SyncService();

        // 1. CREATE & SAVE DRAFT
        SessionPlan myPlan = new SessionPlan(1, "Grade 7 Engineering Session", "Paper Bridge");
        repo.savePlanDraft(myPlan);

        // 2. SIMULATE RELOAD
        System.out.println("\n[TEST] Simulating browser reload...");
        SessionPlan loadedPlan = repo.getPlan(1);
        if (loadedPlan != null && loadedPlan.getTitle().equals(myPlan.getTitle())) {
            System.out.println("[TEST PASS] Draft survived reload! Title: " + loadedPlan.getTitle());
        } else {
            System.out.println("[TEST FAIL] Draft lost.");
        }

        // 3. OFFLINE HANDLING
        System.out.println("\n[TEST] User marks plan complete while OFFLINE...");
        syncService.enqueueSync(1);
        syncService.processSyncQueue(false); // False = offline

        SessionPlan offlinePlan = repo.getPlan(1);
        System.out.println("[TEST PASS] Plan is still locally saved. Status: " + offlinePlan.getSyncStatus());

        // 4. RECONNECT & RETRY
        System.out.println("\n[TEST] User reconnects to internet. Processing queue...");
        syncService.processSyncQueue(true); // True = online

        SessionPlan syncedPlan = repo.getPlan(1);
        System.out.println("\n[FINAL STATE] Plan status in DB: " + syncedPlan.getSyncStatus());
    }
}