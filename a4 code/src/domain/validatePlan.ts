import type { SessionPlan, ValidationError } from "./types"

const nameError: ValidationError = {
  field: "plan-name",
  message: "Enter a plan name, for example Grade 7 Engineering Session.",
}

export function validateDraft(plan: SessionPlan): ValidationError[] {
  return plan.name.trim() ? [] : [nameError]
}

export function validateComplete(plan: SessionPlan): ValidationError[] {
  const errors = validateDraft(plan)
  if (!plan.activityId)
    errors.push({ field: "activity", message: "Choose an activity." })
  if (!plan.steps.length || plan.steps.some((step) => !step.text.trim()))
    errors.push({
      field: "steps",
      message: "Add at least one step. Each step needs a short description.",
    })
  if (
    plan.steps.some(
      (step) =>
        !Number.isInteger(Number(step.minutes)) ||
        Number(step.minutes) < 1 ||
        Number(step.minutes) > 180,
    )
  )
    errors.push({
      field: "steps",
      message: "Enter step time in whole minutes, from 1 to 180.",
    })
  if (!plan.safety.trim())
    errors.push({
      field: "safety",
      message: "Add a safety note. If there is no special hazard, write that.",
    })
  return errors
}
