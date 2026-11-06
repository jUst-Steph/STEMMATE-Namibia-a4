import type { Clock } from "../clock"
import type {
  ActivityId,
  SessionPlan,
  StorageResult,
  ValidationError,
} from "../domain/types"
import { validateComplete, validateDraft } from "../domain/validatePlan"
import type { PlanRepository } from "../repositories/PlanRepository"

interface PlanSuccess {
  ok: true
  value: SessionPlan
}

interface PlanValidationFailure {
  ok: false
  type: 'validation'
  errors: ValidationError[]
}

interface PlanStorageFailure {
  ok: false
  type: 'storage'
  input: SessionPlan
}

export type PlanActionResult =
  | PlanSuccess
  | PlanValidationFailure
  | PlanStorageFailure

export class PlanService {
  constructor(
    private readonly repository: PlanRepository,
    private readonly clock: Clock,
  ) {}

  create(profileId: string, activityId: ActivityId | "" = ""): SessionPlan {
    const now = this.clock.now().toISOString()
    return {
      id: crypto.randomUUID(),
      profileId,
      name: "",
      date: "2026-11-02",
      totalMinutes: 45,
      activityId,
      steps: [],
      materials: [],
      safety: "",
      inclusion: "",
      status: "DRAFT",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    }
  }

  async get(id: string) {
    try {
      return await this.repository.get(id)
    } catch {
      return undefined
    }
  }

  async list(profileId: string) {
    try {
      const plans = await this.repository.list(profileId)
      return plans.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    } catch {
      return []
    }
  }

  async saveDraft(plan: SessionPlan): Promise<PlanActionResult> {
    const errors = validateDraft(plan)
    if (errors.length) return { ok: false, type: "validation", errors }
    const saved = {
      ...plan,
      status: "DRAFT" as const,
      updatedAt: this.clock.now().toISOString(),
    }
    try {
      await this.repository.put(saved)
      return { ok: true, value: saved }
    } catch {
      return { ok: false, type: "storage", input: plan }
    }
  }

  async complete(plan: SessionPlan): Promise<PlanActionResult> {
    const errors = validateComplete(plan)
    if (errors.length) return { ok: false, type: "validation", errors }
    const saved = {
      ...plan,
      status: "QUEUED" as const,
      lastError: undefined,
      updatedAt: this.clock.now().toISOString(),
    }
    try {
      await this.repository.put(saved)
      return { ok: true, value: saved }
    } catch {
      return { ok: false, type: "storage", input: plan }
    }
  }

  async delete(id: string): Promise<StorageResult<string>> {
    try {
      await this.repository.delete(id)
      return { ok: true, value: id }
    } catch {
      return { ok: false, error: "storage", input: id }
    }
  }

  async persist(plan: SessionPlan) {
    await this.repository.put(plan)
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
