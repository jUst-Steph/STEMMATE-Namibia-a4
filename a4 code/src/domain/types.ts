export type ActivityId = "paper-bridge" | "water-filtration" | "simple-circuits" | "plant-growth"

export type SyncStatus = "DRAFT" | "QUEUED" | "SYNCING" | "SYNCED" | "FAILED"

export interface Activity {
  id: ActivityId
  title: string
  level: string
  durationMinutes: number
  topic: string
  materials: string[]
  description: string
  preparation: string
  steps: string[]
  safety: string
  inclusion: string
}

export interface ActivityFilterCriteria {
  search?: string
  level?: string
  duration?: "under-30" | "30-45" | "45-60" | "over-60"
  topics: string[]
  materials: string[]
}

export interface PlanStep {
  id: string
  text: string
  minutes: number
}

export interface SessionPlan {
  id: string
  profileId: string
  name: string
  date: string
  totalMinutes: number
  activityId: ActivityId | ""
  steps: PlanStep[]
  materials: string[]
  safety: string
  inclusion: string
  status: SyncStatus
  lastError?: string
  attempts: number
  lastSyncedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: string
  name: string
  pinHash?: string
}

export interface ValidationError {
  field: string
  message: string
}

interface StorageSuccess<T> {
  ok: true
  value: T
}

interface StorageFailure<T> {
  ok: false
  error: 'storage'
  input: T
}

export type StorageResult<T> = StorageSuccess<T> | StorageFailure<T>
