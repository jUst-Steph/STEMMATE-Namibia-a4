import { describe, expect, it } from "vitest"
import type { Clock } from "../src/clock"
import type { SessionPlan } from "../src/domain/types"
import type { NetworkGateway } from "../src/gateway/NetworkGateway"
import { MemoryPlanRepository } from "../src/repositories/MemoryPlanRepository"
import { SyncService } from "../src/services/SyncService"

const clock: Clock = {
  now: () => new Date("2026-11-02T15:00:00.000Z"),
}
const plan: SessionPlan = {
  id: "plan-1",
  profileId: "facilitator-a",
  name: "Plan",
  date: "2026-11-02",
  totalMinutes: 45,
  activityId: "paper-bridge",
  steps: [{ id: "step", text: "Build", minutes: 45 }],
  materials: ["Paper"],
  safety: "Use care.",
  inclusion: "Work in pairs.",
  status: "QUEUED",
  attempts: 0,
  createdAt: "2026-11-02T14:00:00.000Z",
  updatedAt: "2026-11-02T14:00:00.000Z",
}

describe("SyncService", () => {
  it("stores FAILED after a gateway failure", async () => {
    const repository = new MemoryPlanRepository()
    await repository.put(plan)
    const gateway: NetworkGateway = {
      send: async () => {
        throw new Error("No connection")
      },
    }
    await new SyncService(repository, gateway, clock).syncNow(plan.id)
    expect((await repository.get(plan.id))?.status).toBe("FAILED")
  })

  it("stores FAILED after a bounded timeout", async () => {
    const repository = new MemoryPlanRepository()
    await repository.put(plan)
    const gateway: NetworkGateway = {
      send: () => new Promise<void>(() => undefined),
    }
    await new SyncService(repository, gateway, clock, 5).syncNow(plan.id)
    expect((await repository.get(plan.id))?.status).toBe("FAILED")
  })

  it("stores SYNCED with a timestamp after success", async () => {
    const repository = new MemoryPlanRepository()
    await repository.put(plan)
    const gateway: NetworkGateway = { send: async () => undefined }
    await new SyncService(repository, gateway, clock).syncNow(plan.id)
    expect(await repository.get(plan.id)).toMatchObject({
      status: "SYNCED",
      lastSyncedAt: "2026-11-02T15:00:00.000Z",
    })
  })

  it("coalesces two sends with the same idempotency key", async () => {
    const repository = new MemoryPlanRepository()
    await repository.put(plan)
    const keys = new Set<string>()
    const gateway: NetworkGateway = {
      send: async (_plan, key) => {
        keys.add(key)
        await new Promise((resolve) => setTimeout(resolve, 5))
      },
    }
    const service = new SyncService(repository, gateway, clock)
    await Promise.all([service.syncNow(plan.id), service.syncNow(plan.id)])
    expect(keys.size).toBe(1)
  })
})
