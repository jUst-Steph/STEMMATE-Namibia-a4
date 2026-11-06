import { describe, expect, it } from "vitest"
import { activities } from "../src/data/activities"
import { filterActivities } from "../src/domain/filterActivities"
import type { Activity, ActivityFilterCriteria } from "../src/domain/types"

const criteria = (
  patch: Partial<ActivityFilterCriteria>,
): ActivityFilterCriteria => ({
  topics: [],
  materials: [],
  ...patch,
})

describe("filterActivities", () => {
  it("returns only exact Grade 7 activities", () => {
    expect(
      filterActivities(activities, criteria({ level: "Grade 7" })).map(
        (activity) => activity.id,
      ),
    ).toEqual(["paper-bridge", "simple-circuits"])
  })

  it("uses exact duration boundaries, including the 45 minute overlap", () => {
    const samples = [20, 30, 45, 60, 70].map(
      (durationMinutes, index) =>
        ({
          ...activities[0],
          id: activities[index % activities.length].id,
          durationMinutes,
        }) satisfies Activity,
    )
    expect(
      filterActivities(samples, criteria({ duration: "under-30" })).map(
        (activity) => activity.durationMinutes,
      ),
    ).toEqual([20])
    expect(
      filterActivities(samples, criteria({ duration: "30-45" })).map(
        (activity) => activity.durationMinutes,
      ),
    ).toEqual([30, 45])
    expect(
      filterActivities(samples, criteria({ duration: "45-60" })).map(
        (activity) => activity.durationMinutes,
      ),
    ).toEqual([45, 60])
    expect(
      filterActivities(samples, criteria({ duration: "over-60" })).map(
        (activity) => activity.durationMinutes,
      ),
    ).toEqual([70])
  })

  it("uses OR logic inside the materials group", () => {
    expect(
      filterActivities(
        activities,
        criteria({ materials: ["Paper", "Water"] }),
      ).map((activity) => activity.id),
    ).toEqual(["paper-bridge", "water-filtration", "plant-growth"])
  })

  it("combines different filter groups with AND", () => {
    expect(
      filterActivities(
        activities,
        criteria({
          level: "Grade 7",
          duration: "45-60",
          topics: ["Engineering"],
          materials: ["Paper", "Tape"],
        }),
      ).map((activity) => activity.id),
    ).toEqual(["paper-bridge"])
  })
})
