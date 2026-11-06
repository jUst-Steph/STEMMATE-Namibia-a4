package stemmate;

import java.io.Serializable;
import java.util.Date;

public class SessionPlan implements Serializable {
    private static final long serialVersionUID = 1L;

    private int id;
    private String title;
    private String activityName;
    private String syncStatus; // "draft", "pending", "synced"
    private long lastModified;

    public SessionPlan(int id, String title, String activityName) {
        this.id = id;
        this.title = title;
        this.activityName = activityName;
        this.syncStatus = "draft";
        this.lastModified = new Date().getTime();
    }

    public int getId() { return id; }
    public String getTitle() { return title; }
    public String getSyncStatus() { return syncStatus; }

    public void setSyncStatus(String syncStatus) {
        this.syncStatus = syncStatus;
        this.lastModified = new Date().getTime();
    }
}