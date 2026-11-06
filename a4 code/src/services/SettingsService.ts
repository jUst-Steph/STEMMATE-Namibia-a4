import { runTransaction } from "../repositories/IndexedDbPlanRepository"

export type TextSize = "normal" | "large" | "extra-large"

interface SettingRow {
  key: string
  value: string | boolean
}

export class SettingsService {
  private memory = new Map<string, string | boolean>()
  constructor(private readonly persistent: boolean) {}

  async get<T extends string | boolean,>(key: string, fallback: T): Promise<T> {
    if (!this.persistent) return this.memory.get(key) as T ?? fallback
    try {
      const row = await runTransaction<SettingRow | undefined>(
        "settings",
        "readonly",
        (store) => store.get(key),
      )
      return row?.value as T ?? fallback
    } catch {
      return fallback
    }
  }

  async set(key: string, value: string | boolean) {
    if (!this.persistent) {
      this.memory.set(key, value)
      return
    }
    await runTransaction<IDBValidKey>("settings", "readwrite", (store) =>
      store.put({ key, value }),
    )
  }

  async clear() {
    this.memory.clear()
    if (this.persistent)
      await runTransaction<undefined>("settings", "readwrite", (store) =>
        store.clear(),
      )
  }
}
