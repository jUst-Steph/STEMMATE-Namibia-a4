import type { SessionPlan } from "../domain/types"
import type { PlanRepository } from "./PlanRepository"

export const DB_NAME = "stemmate-namibia-v1-1"
export const DB_VERSION = 1

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Storage failed"))
  })
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("plans"))
        db.createObjectStore("plans", { keyPath: "id" })
      if (!db.objectStoreNames.contains("activities_saved"))
        db.createObjectStore("activities_saved", { keyPath: "key" })
      if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings", { keyPath: "key" })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Storage failed"))
    request.onblocked = () => reject(new Error("Storage blocked"))
  })
}

export async function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase()
  try {
    return await requestToPromise(
      work(db.transaction(storeName, mode).objectStore(storeName)),
    )
  } finally {
    db.close()
  }
}

export class IndexedDbPlanRepository implements PlanRepository {
  private shouldFail = false

  setFailure(value: boolean) {
    this.shouldFail = value
  }

  private check() {
    if (this.shouldFail) throw new Error("Simulated storage failure")
  }

  async get(id: string) {
    this.check()
    return runTransaction<SessionPlan | undefined>(
      "plans",
      "readonly",
      (store) => store.get(id),
    )
  }

  async list(profileId: string) {
    this.check()
    const plans = await runTransaction<SessionPlan[]>(
      "plans",
      "readonly",
      (store) => store.getAll(),
    )
    return plans.filter((plan) => plan.profileId === profileId)
  }

  async put(plan: SessionPlan) {
    this.check()
    await runTransaction<IDBValidKey>("plans", "readwrite", (store) =>
      store.put(plan),
    )
  }

  async delete(id: string) {
    this.check()
    await runTransaction<undefined>("plans", "readwrite", (store) =>
      store.delete(id),
    )
  }

  async clear() {
    this.check()
    await runTransaction<undefined>("plans", "readwrite", (store) =>
      store.clear(),
    )
  }
}
