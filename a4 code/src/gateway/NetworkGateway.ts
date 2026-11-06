import type { SessionPlan } from "../domain/types"

export interface NetworkGateway {
  send(plan: SessionPlan, idempotencyKey: string): Promise<void>
}
