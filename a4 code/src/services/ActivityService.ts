import { filterActivities } from "../domain/filterActivities"
import type {
  Activity,
  ActivityFilterCriteria,
  ActivityId,
  StorageResult,
} from "../domain/types"
import type { SavedActivityRepository } from "../repositories/SavedActivityRepository"

export class ActivityService {
  constructor(
    private readonly activities: Activity[],
    private readonly repository: SavedActivityRepository,
  ) {}

  list() {
    return this.activities
  }
  filter(criteria: ActivityFilterCriteria) {
    return filterActivities(this.activities, criteria)
  }
  get(id: string) {
    return this.activities.find((activity) => activity.id === id)
  }
  async savedIds(profileId: string): Promise<ActivityId[]> {
    try {
      return await this.repository.list(profileId)
    } catch {
      return []
    }
  }
  async saveOffline(
    profileId: string,
    activityId: ActivityId,
  ): Promise<StorageResult<ActivityId>> {
    try {
      await this.repository.save(profileId, activityId)
      return { ok: true, value: activityId }
    } catch {
      return { ok: false, error: "storage", input: activityId }
    }
  }
  async removeOffline(
    profileId: string,
    activityId: ActivityId,
  ): Promise<StorageResult<ActivityId>> {
    try {
      await this.repository.remove(profileId, activityId)
      return { ok: true, value: activityId }
    } catch {
      return { ok: false, error: "storage", input: activityId }
    }
  }
  async clear() {
    try {
      await this.repository.clear()
      return true
    } catch {
      return false
    }
  }
}
