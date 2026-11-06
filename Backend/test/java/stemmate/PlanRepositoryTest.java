package stemmate;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class PlanRepositoryTest {

    @Test
    public void testDraftPersistence() {
        PlanRepository repo = new PlanRepository();
        // Using ID 99 to avoid conflicts with Main.java
        SessionPlan plan = new SessionPlan(99, "Test Plan", "Math");
        repo.savePlanDraft(plan);

        SessionPlan loaded = repo.getPlan(99);
        assertNotNull(loaded, "Plan should be found in storage");
        assertEquals("Test Plan", loaded.getTitle(), "Title should match");
    }

    @Test
    public void testInvalidInputRejected() {
        PlanRepository repo = new PlanRepository();
        // Using ID 100 to avoid conflicts
        SessionPlan plan = new SessionPlan(100, "", "Math"); // Empty title
        repo.savePlanDraft(plan);

        SessionPlan loaded = repo.getPlan(100);
        assertNull(loaded, "Plan with empty title should not be saved");
    }
}