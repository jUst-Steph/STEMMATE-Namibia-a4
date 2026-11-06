import type { SessionPlan } from "../domain/types"
import type { PlanRepository } from "./PlanRepository"

export class MemoryPlanRepository implements PlanRepository {
  private plans = new Map<string, SessionPlan>()
  private shouldFail = false

  setFailure(value: boolean) {
    this.shouldFail = value
  }

  private check() {
    if (this.shouldFail) throw new Error("Storage unavailable")
  }

  async get(id: string) {
    this.check()
    const plan = this.plans.get(id)
    return plan ? structuredClone(plan) : undefined
  }

  async list(profileId: string) {
    this.check()
    return [...this.plans.values()]
      .filter((plan) => plan.profileId === profileId)
      .map((plan) => structuredClone(plan))
  }

  async put(plan: SessionPlan) {
    this.check()
    this.plans.set(plan.id, structuredClone(plan))
  }

  async delete(id: string) {
    this.check()
    this.plans.delete(id)
  }

  async clear() {
    this.check()
    this.plans.clear()
  }
}
