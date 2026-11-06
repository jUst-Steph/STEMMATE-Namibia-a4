import { describe, expect, it } from "vitest"
import type { SessionPlan } from "../src/domain/types"
import { validateComplete, validateDraft } from "../src/domain/validatePlan"

const plan = (patch: Partial<SessionPlan> = {}): SessionPlan => ({
  id: "plan-1",
  profileId: "facilitator-a",
  name: "",
  date: "2026-11-02",
  totalMinutes: 45,
  activityId: "",
  steps: [],
  materials: [],
  safety: "",
  inclusion: "",
  status: "DRAFT",
  attempts: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...patch,
})

describe("plan validation", () => {
  it("requires only a name to save a draft", () => {
    expect(validateDraft(plan({ name: "A useful draft" }))).toEqual([])
  })

  it("reports every required completion field", () => {
    expect(validateComplete(plan()).map((error) => error.message)).toEqual([
      "Enter a plan name, for example Grade 7 Engineering Session.",
      "Choose an activity.",
      "Add at least one step. Each step needs a short description.",
      "Add a safety note. If there is no special hazard, write that.",
    ])
  })

  it("reports invalid step minutes", () => {
    expect(
      validateComplete(
        plan({
          name: "Plan",
          activityId: "paper-bridge",
          steps: [{ id: "step", text: "Build it", minutes: 0 }],
          safety: "Use care.",
        }),
      ).map((error) => error.message),
    ).toContain("Enter step time in whole minutes, from 1 to 180.")
  })
})
