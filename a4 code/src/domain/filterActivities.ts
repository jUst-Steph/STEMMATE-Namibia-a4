import type { Activity, ActivityFilterCriteria } from "./types"

const materialMatches = (activityMaterial: string, selected: string) => {
  const activity = activityMaterial.toLowerCase()
  const choice = selected.toLowerCase()
  if (choice === "paper") return activity.includes("paper")
  if (choice === "plastic bottles") return activity.includes("plastic bottle")
  return activity.includes(choice)
}

export function filterActivities(
  activities: Activity[],
  criteria: ActivityFilterCriteria,
): Activity[] {
  const search = criteria.search?.trim().toLowerCase()
  return activities.filter((activity) => {
    if (
      search &&
      !`${activity.title} ${activity.topic} ${activity.description}`
        .toLowerCase()
        .includes(search)
    )
      return false
    if (criteria.level && activity.level !== criteria.level) return false
    if (criteria.duration === "under-30" && activity.durationMinutes >= 30)
      return false
    if (
      criteria.duration === "30-45" &&
      (activity.durationMinutes < 30 || activity.durationMinutes > 45)
    )
      return false
    if (
      criteria.duration === "45-60" &&
      (activity.durationMinutes < 45 || activity.durationMinutes > 60)
    )
      return false
    if (criteria.duration === "over-60" && activity.durationMinutes <= 60)
      return false
    if (criteria.topics.length && !criteria.topics.includes(activity.topic))
      return false
    if (
      criteria.materials.length &&
      !criteria.materials.some((selected) =>
        activity.materials.some((material) =>
          materialMatches(material, selected),
        ),
      )
    )
      return false
    return true
  })
}
