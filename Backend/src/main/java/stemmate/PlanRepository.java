package stemmate;

import java.io.*;
import java.util.HashMap;
import java.util.Map;

public class PlanRepository {
    private static final String FILE_NAME = "local_storage.dat";

    @SuppressWarnings("unchecked")
    private Map<Integer, SessionPlan> loadDB() {
        File file = new File(FILE_NAME);
        if (!file.exists()) return new HashMap<>();

        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(file))) {
            return (Map<Integer, SessionPlan>) ois.readObject();
        } catch (Exception e) {
            System.out.println("[ERROR] Failed to read database: " + e.getMessage());
            return new HashMap<>();
        }
    }

    private void saveDB(Map<Integer, SessionPlan> db) {
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(FILE_NAME))) {
            oos.writeObject(db);
        } catch (IOException e) {
            System.out.println("[ERROR] Failed to save to database: " + e.getMessage());
        }
    }

    public void savePlanDraft(SessionPlan plan) {
        if (plan.getTitle() == null || plan.getTitle().trim().isEmpty()) {
            System.out.println("[VALIDATION ERROR] Plan title cannot be empty. Save aborted.");
            return;
        }

        Map<Integer, SessionPlan> db = loadDB();
        db.put(plan.getId(), plan);
        saveDB(db);
        System.out.println("[STORAGE] Plan '" + plan.getTitle() + "' saved as Draft.");
    }

    public SessionPlan getPlan(int id) {
        return loadDB().get(id);
    }
}