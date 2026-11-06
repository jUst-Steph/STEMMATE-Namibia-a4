import type { ActivityId } from "../domain/types"
import { runTransaction } from "./IndexedDbPlanRepository"

export interface SavedActivityRepository {
  list(profileId: string): Promise<ActivityId[]>
  save(profileId: string, activityId: ActivityId): Promise<void>
  remove(profileId: string, activityId: ActivityId): Promise<void>
  clear(): Promise<void>
}

export class MemorySavedActivityRepository implements SavedActivityRepository {
  private ids = new Set<string>()
  private shouldFail = false
  setFailure(value: boolean) {
    this.shouldFail = value
  }
  private check() {
    if (this.shouldFail) throw new Error("Storage unavailable")
  }
  async list(profileId: string) {
    this.check()
    return [...this.ids]
      .filter((key) => key.startsWith(`${profileId}:`))
      .map((key) => key.split(":")[1] as ActivityId)
  }
  async save(profileId: string, activityId: ActivityId) {
    this.check()
    this.ids.add(`${profileId}:${activityId}`)
  }
  async remove(profileId: string, activityId: ActivityId) {
    this.check()
    this.ids.delete(`${profileId}:${activityId}`)
  }
  async clear() {
    this.check()
    this.ids.clear()
  }
}

interface SavedRow {
  key: string
  profileId: string
  activityId: ActivityId
}

export class IndexedDbSavedActivityRepository
  implements SavedActivityRepository
{
  private shouldFail = false
  setFailure(value: boolean) {
    this.shouldFail = value
  }
  private check() {
    if (this.shouldFail) throw new Error("Simulated storage failure")
  }
  async list(profileId: string) {
    this.check()
    const rows = await runTransaction<SavedRow[]>(
      "activities_saved",
      "readonly",
      (store) => store.getAll(),
    )
    return rows
      .filter((row) => row.profileId === profileId)
      .map((row) => row.activityId)
  }
  async save(profileId: string, activityId: ActivityId) {
    this.check()
    await runTransaction<IDBValidKey>(
      "activities_saved",
      "readwrite",
      (store) =>
        store.put({
          key: `${profileId}:${activityId}`,
          profileId,
          activityId,
        }),
    )
  }
  async remove(profileId: string, activityId: ActivityId) {
    this.check()
    await runTransaction<undefined>("activities_saved", "readwrite", (store) =>
      store.delete(`${profileId}:${activityId}`),
    )
  }
  async clear() {
    this.check()
    await runTransaction<undefined>("activities_saved", "readwrite", (store) =>
      store.clear(),
    )
  }
}
