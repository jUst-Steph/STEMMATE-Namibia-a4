import type { Clock } from "../clock"
import type { SessionPlan } from "../domain/types"
import type { NetworkGateway } from "../gateway/NetworkGateway"
import type { PlanRepository } from "../repositories/PlanRepository"

export class SyncService {
  private inFlight = new Map<string, Promise<SessionPlan>>()
  constructor(
    private readonly repository: PlanRepository,
    private readonly gateway: NetworkGateway,
    private readonly clock: Clock,
    private readonly timeoutMs = 8000,
  ) {}

  status(id: string) {
    return this.repository.get(id)
  }

  syncNow(id: string) {
    const current = this.inFlight.get(id)
    if (current) return current
    const request = this.perform(id).finally(() => this.inFlight.delete(id))
    this.inFlight.set(id, request)
    return request
  }

  retry(id: string) {
    return this.syncNow(id)
  }

  private async perform(id: string): Promise<SessionPlan> {
    const plan = await this.repository.get(id)
    if (!plan) throw new Error("Plan not found")
    const syncing: SessionPlan = {
      ...plan,
      status: "SYNCING",
      attempts: plan.attempts + 1,
      updatedAt: this.clock.now().toISOString(),
    }
    await this.repository.put(syncing)
    try {
      await Promise.race([
        this.gateway.send(syncing, syncing.id),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("The sync attempt timed out. Try again.")),
            this.timeoutMs,
          ),
        ),
      ])
      const synced: SessionPlan = {
        ...syncing,
        status: "SYNCED",
        lastError: undefined,
        lastSyncedAt: this.clock.now().toISOString(),
        updatedAt: this.clock.now().toISOString(),
      }
      await this.repository.put(synced)
      return synced
    } catch (error) {
      const failed: SessionPlan = {
        ...syncing,
        status: "FAILED",
        lastError:
          error instanceof Error ? error.message : "The sync attempt failed.",
        updatedAt: this.clock.now().toISOString(),
      }
      await this.repository.put(failed)
      return failed
    }
  }
}
