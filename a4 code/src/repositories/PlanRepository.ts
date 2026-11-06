import type { SessionPlan } from "../domain/types"

export interface PlanRepository {
  get(id: string): Promise<SessionPlan | undefined>
  list(profileId: string): Promise<SessionPlan[]>
  put(plan: SessionPlan): Promise<void>
  delete(id: string): Promise<void>
  clear(): Promise<void>
}
