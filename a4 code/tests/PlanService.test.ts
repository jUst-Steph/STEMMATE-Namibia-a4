import { describe, expect, it } from "vitest"
import type { Clock } from "../src/clock"
import { MemoryPlanRepository } from "../src/repositories/MemoryPlanRepository"
import { PlanService } from "../src/services/PlanService"

const clock: Clock = {
  now: () => new Date("2026-11-02T14:35:00.000Z"),
}

describe("PlanService", () => {
  it("saves and returns an id only after the repository write", async () => {
    const repository = new MemoryPlanRepository()
    const service = new PlanService(repository, clock)
    const input = { ...service.create("facilitator-a"), name: "Draft plan" }
    const result = await service.saveDraft(input)
    expect(result.ok && result.value.id).toBe(input.id)
    expect((await repository.get(input.id))?.name).toBe("Draft plan")
  })

  it("returns a storage failure with the unchanged input", async () => {
    const repository = new MemoryPlanRepository()
    const service = new PlanService(repository, clock)
    const input = { ...service.create("facilitator-a"), name: "Keep this" }
    repository.setFailure(true)
    const result = await service.saveDraft(input)
    expect(result).toMatchObject({ ok: false, type: "storage", input })
  })

  it("completes a plan as queued and keeps it readable", async () => {
    const repository = new MemoryPlanRepository()
    const service = new PlanService(repository, clock)
    const input = {
      ...service.create("facilitator-a", "paper-bridge"),
      name: "Complete plan",
      safety: "Use care.",
      steps: [{ id: "step", text: "Build", minutes: 10 }],
    }
    const result = await service.complete(input)
    expect(result.ok && result.value.status).toBe("QUEUED")
    expect((await service.get(input.id))?.name).toBe("Complete plan")
  })
})
