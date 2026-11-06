import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "./components/Button"
import { Dialog } from "./components/Dialog"
import { FormField } from "./components/FormField"
import { LiveRegion } from "./components/LiveRegion"
import { ScreenHeading } from "./components/ScreenHeading"
import { StatusChip } from "./components/StatusChip"
import { systemClock } from "./clock"
import { activities } from "./data/activities"
import type {
  Activity,
  ActivityFilterCriteria,
  ActivityId,
  PlanStep,
  SessionPlan,
  ValidationError,
} from "./domain/types"
import {
  MockNetworkGateway,
  type MockResult,
} from "./gateway/MockNetworkGateway"
import {
  IndexedDbPlanRepository,
  openDatabase,
} from "./repositories/IndexedDbPlanRepository"
import { MemoryPlanRepository } from "./repositories/MemoryPlanRepository"
import type { PlanRepository } from "./repositories/PlanRepository"
import {
  IndexedDbSavedActivityRepository,
  MemorySavedActivityRepository,
  type SavedActivityRepository,
} from "./repositories/SavedActivityRepository"
import { ActivityService } from "./services/ActivityService"
import { PlanService } from "./services/PlanService"
import { SettingsService, type TextSize } from "./services/SettingsService"
import { SyncService } from "./services/SyncService"

const PROFILE_ID = "facilitator-a"
const PROFILE_NAME = "Facilitator A"
const emptyFilters: ActivityFilterCriteria = {
  level: "",
  duration: undefined,
  topics: [],
  materials: [],
}

interface Runtime {
  planService: PlanService
  activityService: ActivityService
  syncService: SyncService
  settings: SettingsService
  gateway: MockNetworkGateway
  planRepository: PlanRepository
  setStorageFailure(value: boolean): void
  persistent: boolean
}

function createRuntime(persistent: boolean): Runtime {
  const planRepository = persistent
    ? new IndexedDbPlanRepository()
    : new MemoryPlanRepository()
  const activityRepository: SavedActivityRepository = persistent
    ? new IndexedDbSavedActivityRepository()
    : new MemorySavedActivityRepository()
  const gateway = new MockNetworkGateway()
  return {
    planService: new PlanService(planRepository, systemClock),
    activityService: new ActivityService(activities, activityRepository),
    syncService: new SyncService(planRepository, gateway, systemClock, 8000),
    settings: new SettingsService(persistent),
    gateway,
    planRepository,
    persistent,
    setStorageFailure(value) {
      if ("setFailure" in planRepository) {
        ;(planRepository as IndexedDbPlanRepository).setFailure(value)
      }
      if ("setFailure" in activityRepository) {
        ;(activityRepository as IndexedDbSavedActivityRepository | MemorySavedActivityRepository).setFailure(
          value,
        )
      }
    },
  }
}

function activityDefaults(
  activity: Activity,
): Pick<SessionPlan, "activityId" | "totalMinutes" | "steps" | "materials" | "safety" | "inclusion"> {
  const baseMinutes = Math.max(
    1,
    Math.floor(activity.durationMinutes / activity.steps.length),
  )
  return {
    activityId: activity.id,
    totalMinutes: activity.durationMinutes,
    steps: activity.steps.map((text, index) => ({
      id: crypto.randomUUID(),
      text,
      minutes:
        index === activity.steps.length - 1
          ? activity.durationMinutes - baseMinutes * (activity.steps.length - 1)
          : baseMinutes,
    })),
    materials: [...activity.materials],
    safety: activity.safety,
    inclusion: activity.inclusion,
  }
}

async function seedDemo(runtime: Runtime, force = false) {
  const alreadySeeded = await runtime.settings.get("demo-seeded", false)
  if (alreadySeeded && !force) return
  const existing = await runtime.planService.list(PROFILE_ID)
  if (!existing.length) {
    const paper = activities[0]
    const water = activities[1]
    const draft: SessionPlan = {
      ...runtime.planService.create(PROFILE_ID, paper.id),
      ...activityDefaults(paper),
      name: "Grade 7 Engineering Session",
      status: "DRAFT",
    }
    const synced: SessionPlan = {
      ...runtime.planService.create(PROFILE_ID, water.id),
      ...activityDefaults(water),
      name: "Grade 8 Environmental Session",
      status: "SYNCED",
      lastSyncedAt: "2026-11-02T10:30:00.000Z",
    }
    await runtime.planService.persist(draft)
    await runtime.planService.persist(synced)
  }
  const saved = await runtime.activityService.savedIds(PROFILE_ID)
  if (!saved.includes("simple-circuits"))
    await runtime.activityService.saveOffline(PROFILE_ID, "simple-circuits")
  await runtime.settings.set("demo-seeded", true)
}

function Icon({
  name,
  className = "size-5",
}: {
  name: "home" | "book" | "plans" | "more" | "online" | "offline" | "check" | "warning" | "download"
  className?: string
}) {
  const path = {
    home: <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z" />,
    book: (
      <path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4V4Zm16 0h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5V4Z" />
    ),
    plans: <path d="M8 4h8M9 2h6v4H9V2ZM5 4H3v18h18V4h-2M7 11h10M7 16h7" />,
    more: <path d="M5 12h.1M12 12h.1M19 12h.1" />,
    online: (
      <path d="M5 12.5a10 10 0 0 1 14 0M8 16a6 6 0 0 1 8 0m-4 4h.1M2 9a14 14 0 0 1 20 0" />
    ),
    offline: (
      <path d="m3 3 18 18M5 12.5a10 10 0 0 1 3-2M12 8a10 10 0 0 1 7 4.5M8 16a6 6 0 0 1 5-1.4M12 20h.1M2 9a14 14 0 0 1 3-2.5M9 4.5A14 14 0 0 1 22 9" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    warning: <path d="M12 3 2 21h20L12 3Zm0 6v5m0 3v.1" />,
    download: <path d="M12 3v12m-4-4 4 4 4-4M4 19v2h16v-2" />,
  }[name]
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  )
}

function routeFromHash() {
  return window.location.hash.slice(1) || "/"
}

function go(path: string) {
  window.location.hash = path
}

function Screen({
  title,
  children,
  className = "",
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    document.title = `${title}, STEMMate Namibia`
    heading.current?.focus()
  }, [title])
  return (
    <div className={`screen grid gap-6 ${className}`}>
      <ScreenHeading ref={heading}>{title}</ScreenHeading>
      {children}
    </div>
  )
}

function activeSection(route: string) {
  if (route.startsWith("/activities") || route === "/saved") return "activities"
  if (route.startsWith("/plans")) return "plans"
  if (route.startsWith("/more")) return "more"
  return "home"
}

function Shell({
  route,
  online,
  plans,
  savedCount,
  storageAvailable,
  announcement,
  children,
}: {
  route: string
  online: boolean
  plans: SessionPlan[]
  savedCount: number
  storageAvailable: boolean
  announcement: string
  children: React.ReactNode
}) {
  const drafts = plans.filter((plan) => plan.status === "DRAFT").length
  const queued = plans.filter((plan) =>
    ["QUEUED", "FAILED", "SYNCING"].includes(plan.status),
  ).length
  const nav = [
    { id: "home", label: "Home", path: "/", icon: "home" as const },
    {
      id: "activities",
      label: "Activities",
      path: "/activities",
      icon: "book" as const,
    },
    { id: "plans", label: "Plans", path: "/plans", icon: "plans" as const },
    { id: "more", label: "More", path: "/more", icon: "more" as const },
  ]
  const current = activeSection(route)
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <LiveRegion>{announcement}</LiveRegion>
      <header className="border-b border-slate-300 bg-white px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => go("/")}
            className="min-h-11 rounded-lg text-left text-xl font-bold text-teal-800"
          >
            STEMMate Namibia
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <span
              data-testid="offline-badge"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-500 px-3 font-bold"
            >
              <Icon name={online ? "online" : "offline"} />
              {online ? "Online" : "Offline"}
            </span>
            <span className="font-bold">{PROFILE_NAME}</span>
          </div>
        </div>
      </header>
      <div
        data-testid="device-status"
        role="status"
        className="device-strip px-4 py-4 md:px-6"
      >
        <div className="mx-auto flex max-w-6xl items-start gap-3">
          <Icon name="check" className="mt-0.5 size-6 shrink-0" />
          <p className="font-bold">
            Saved on this device: {savedCount} activities, {drafts}{" "}
            {drafts === 1 ? "draft" : "drafts"}, {queued} waiting to sync
          </p>
        </div>
      </div>
      {!storageAvailable && (
        <div
          role="alert"
          className="border-b border-amber-700 bg-amber-50 px-4 py-3 text-amber-950 md:px-6"
        >
          <p className="mx-auto max-w-6xl font-bold">
            Storage is not available in this browser. Your work will be lost
            when you close this page.
          </p>
        </div>
      )}
      <div className="app-layout mx-auto w-full max-w-6xl">
        <nav
          className="main-nav border-slate-300 bg-white"
          aria-label="Main navigation"
        >
          <ul className="grid grid-cols-4 md:grid-cols-1">
            {nav.map((item) => (
              <li key={item.id}>
                <button
                  className={`flex min-h-14 w-full items-center justify-center gap-2 px-2 py-2 font-bold md:justify-start md:px-5 ${
                    current === item.id
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-700"
                  }`}
                  aria-current={current === item.id ? "page" : undefined}
                  onClick={() => go(item.path)}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main-content" className="min-w-0 px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </>
  )
}

function ActivityCard({
  activity,
  saved,
}: {
  activity: Activity
  saved: boolean
}) {
  return (
    <li>
      <article
        data-testid={`activity-card-${activity.id}`}
        className="quiet-card grid gap-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[1.375rem] font-bold">{activity.title}</h2>
            <p className="mt-1 text-slate-600">
              {activity.level}, {activity.durationMinutes} minutes,{" "}
              {activity.topic}
            </p>
          </div>
          <StatusChip status={saved ? "AVAILABLE" : "NOT_SAVED"} />
        </div>
        <p>{activity.description}</p>
        <p>
          <strong>Materials:</strong> {activity.materials.join(", ")}
        </p>
        <div>
          <Button onClick={() => go(`/activities/${activity.id}`)}>
            View activity
          </Button>
        </div>
      </article>
    </li>
  )
}

function Home({ plans }: { plans: SessionPlan[] }) {
  const draft = plans.find((plan) => plan.status === "DRAFT")
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  return (
    <Screen title="Home">
      <p className="text-xl">
        {greeting}, {PROFILE_NAME}.
      </p>
      {draft && (
        <section className="rounded-xl border-2 border-teal-700 bg-teal-50 p-5">
          <h2 className="text-[1.375rem] font-bold">Continue your draft</h2>
          <p className="mt-2">{draft.name}</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => go(`/plans/${draft.id}/edit`)}
          >
            Continue editing
          </Button>
        </section>
      )}
      <ul className="grid gap-4 lg:grid-cols-3">
        {[
          [
            "Find an activity",
            "Browse practical STEM activities.",
            "/activities",
          ],
          ["My session plans", "Create, edit and complete plans.", "/plans"],
          ["Saved offline", "Open activities stored on this device.", "/saved"],
        ].map(([title, copy, path]) => (
          <li key={title}>
            <article className="quiet-card h-full">
              <h2 className="text-[1.375rem] font-bold">{title}</h2>
              <p className="my-3 text-slate-600">{copy}</p>
              <Button onClick={() => go(path)}>Open</Button>
            </article>
          </li>
        ))}
      </ul>
    </Screen>
  )
}

function ActivityLibrary({
  service,
  savedIds,
  filters,
  setFilters,
}: {
  service: ActivityService
  savedIds: ActivityId[]
  filters: ActivityFilterCriteria
  setFilters: (filters: ActivityFilterCriteria) => void
}) {
  const [search, setSearch] = useState(filters.search ?? "")
  const criteria = { ...filters, search }
  const results = service.filter(criteria)
  const activeCount =
    Number(Boolean(filters.level)) +
    Number(Boolean(filters.duration)) +
    filters.topics.length +
    filters.materials.length
  const active = activeCount > 0 || Boolean(search)
  const showAll = () => {
    setSearch("")
    setFilters(emptyFilters)
  }
  return (
    <Screen title="Activity library">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <FormField id="activity-search" label="Search activities">
          <input
            id="activity-search"
            data-testid="search-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="For example, bridge"
          />
        </FormField>
        <Button onClick={() => go("/activities/filters")}>
          Filters{activeCount ? ` (${activeCount})` : ""}
        </Button>
      </div>
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Active filters">
          {[
            filters.level,
            filters.duration,
            ...filters.topics,
            ...filters.materials,
          ]
            .filter(Boolean)
            .map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-2 rounded-full border border-slate-500 bg-white pl-3"
              >
                {value}
                <button
                  className="min-h-11 min-w-11 rounded-full font-bold"
                  aria-label={`Remove ${value} filter`}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      level: filters.level === value ? "" : filters.level,
                      duration:
                        filters.duration === value
                          ? undefined
                          : filters.duration,
                      topics: filters.topics.filter((item) => item !== value),
                      materials: filters.materials.filter(
                        (item) => item !== value,
                      ),
                    })
                  }
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p data-testid="results-count" role="status" className="font-bold">
          {results.length} {results.length === 1 ? "activity" : "activities"}
        </p>
        {active && (
          <Button variant="text" onClick={showAll}>
            Show all activities
          </Button>
        )}
      </div>
      {results.length ? (
        <ul className="grid gap-4">
          {results.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              saved={savedIds.includes(activity.id)}
            />
          ))}
        </ul>
      ) : (
        <section className="quiet-card text-center">
          <h2 className="text-[1.375rem] font-bold">No activities found</h2>
          <p className="mx-auto my-3 max-w-prose">
            No activities found. Try changing your filters or your available
            materials.
          </p>
          <Button onClick={() => go("/activities/filters")}>
            Change filters
          </Button>
        </section>
      )}
    </Screen>
  )
}

function Filters({
  initial,
  onApply,
}: {
  initial: ActivityFilterCriteria
  onApply: (value: ActivityFilterCriteria) => void
}) {
  const [value, setValue] = useState(initial)
  const toggle = (key: "topics" | "materials", item: string) =>
    setValue({
      ...value,
      [key]: value[key].includes(item)
        ? value[key].filter((current) => current !== item)
        : [...value[key], item],
    })
  return (
    <Screen title="Filter activities">
      <div className="quiet-card grid gap-7">
        <fieldset>
          <legend>Level</legend>
          {["Grade 5–6", "Grade 7", "Grade 7–8", "Grade 9–10"].map((item) => (
            <label className="option" key={item}>
              <input
                type="radio"
                name="level"
                checked={value.level === item}
                onChange={() => setValue({ ...value, level: item })}
              />
              {item}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Duration</legend>
          {[
            ["under-30", "Under 30 min"],
            ["30-45", "30–45 min"],
            ["45-60", "45–60 min"],
            ["over-60", "Over 60 min"],
          ].map(([id, label]) => (
            <label className="option" key={id}>
              <input
                type="radio"
                name="duration"
                checked={value.duration === id}
                onChange={() =>
                  setValue({
                    ...value,
                    duration: id as ActivityFilterCriteria["duration"],
                  })
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Topic</legend>
          {[
            "Physics",
            "Biology",
            "Chemistry",
            "Engineering",
            "Environmental Science",
          ].map((item) => (
            <label className="option" key={item}>
              <input
                type="checkbox"
                checked={value.topics.includes(item)}
                onChange={() => toggle("topics", item)}
              />
              {item}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Available materials</legend>
          <p className="mb-2 text-slate-600">
            Shows activities that use any of these materials.
          </p>
          {["Paper", "Tape", "Cardboard", "Plastic bottles", "Water"].map(
            (item) => (
              <label className="option" key={item}>
                <input
                  type="checkbox"
                  checked={value.materials.includes(item)}
                  onChange={() => toggle("materials", item)}
                />
                {item}
              </label>
            ),
          )}
        </fieldset>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          data-testid="filter-clear"
          onClick={() => setValue(emptyFilters)}
        >
          Clear filters
        </Button>
        <Button
          data-testid="filter-apply"
          variant="primary"
          onClick={() => {
            onApply(value)
            go("/activities")
          }}
        >
          Apply filters
        </Button>
      </div>
    </Screen>
  )
}

function ActivityDetails({
  activity,
  saved,
  service,
  refresh,
}: {
  activity: Activity
  saved: boolean
  service: ActivityService
  refresh: () => Promise<void>
}) {
  const [error, setError] = useState(false)
  const save = async () => {
    const result = await service.saveOffline(PROFILE_ID, activity.id)
    if (!result.ok) return setError(true)
    await refresh()
    go(`/activities/${activity.id}/saved`)
  }
  const remove = async () => {
    const result = await service.removeOffline(PROFILE_ID, activity.id)
    if (!result.ok) return setError(true)
    await refresh()
  }
  return (
    <Screen title={activity.title}>
      <div className="flex flex-wrap gap-3">
        <StatusChip
          testId="saved-status"
          status={saved ? "AVAILABLE" : "NOT_SAVED"}
        />
        <span className="font-bold">
          {activity.level}, {activity.durationMinutes} minutes, {activity.topic}
        </span>
      </div>
      {error && (
        <div role="alert" className="error-box">
          <p className="font-bold">
            Unable to save offline. Nothing was changed. Try again.
          </p>
          <Button className="mt-3" onClick={saved ? remove : save}>
            Retry
          </Button>
        </div>
      )}
      {[
        ["Description", <p>{activity.description}</p>],
        [
          "Materials",
          <ul className="list-disc pl-6">
            {activity.materials.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>,
        ],
        ["Preparation", <p>{activity.preparation}</p>],
        [
          "Steps",
          <ol className="list-decimal space-y-2 pl-6">
            {activity.steps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>,
        ],
        [
          "Safety",
          <p className="flex items-start gap-2">
            <Icon name="warning" className="mt-1 size-5 shrink-0" />
            {activity.safety}
          </p>,
        ],
        ["Inclusion", <p>{activity.inclusion}</p>],
      ].map(([title, content]) => (
        <section className="quiet-card" key={title as string}>
          <h2 className="mb-3 text-[1.375rem] font-bold">{title}</h2>
          {content}
        </section>
      ))}
      <div className="flex flex-wrap gap-3">
        {saved ? (
          <Button data-testid="save-offline" onClick={remove}>
            Remove offline copy
          </Button>
        ) : (
          <Button data-testid="save-offline" variant="primary" onClick={save}>
            Save offline
          </Button>
        )}
        <Button onClick={() => go(`/plans/new?activity=${activity.id}`)}>
          Start a plan with this activity
        </Button>
        <Button variant="text" onClick={() => go("/activities")}>
          Back to activities
        </Button>
      </div>
    </Screen>
  )
}

function ActivitySaved({ activity }: { activity: Activity }) {
  return (
    <Screen title="Activity saved">
      <section className="quiet-card text-center">
        <Icon name="check" className="mx-auto mb-4 size-12 text-green-800" />
        <p className="text-xl">
          Activity saved. {activity.title} is now available offline on this
          device.
        </p>
        <div className="mt-4">
          <StatusChip status="AVAILABLE" />
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => go("/saved")}>
          View saved activities
        </Button>
        <Button onClick={() => go("/activities")}>Back to activities</Button>
      </div>
    </Screen>
  )
}

function SavedActivities({
  ids,
  service,
  refresh,
}: {
  ids: ActivityId[]
  service: ActivityService
  refresh: () => Promise<void>
}) {
  const saved = activities.filter((activity) => ids.includes(activity.id))
  return (
    <Screen title="Saved offline">
      {saved.length ? (
        <ul className="grid gap-4">
          {saved.map((activity) => (
            <li key={activity.id}>
              <article className="quiet-card">
                <h2 className="text-[1.375rem] font-bold">{activity.title}</h2>
                <p className="my-3">{activity.description}</p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => go(`/activities/${activity.id}`)}>
                    Open activity
                  </Button>
                  <Button
                    variant="text"
                    onClick={async () => {
                      await service.removeOffline(PROFILE_ID, activity.id)
                      await refresh()
                    }}
                  >
                    Remove offline copy
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <section className="quiet-card">
          <p>
            No activities saved yet. Open an activity and choose Save offline.
          </p>
          <Button className="mt-4" onClick={() => go("/activities")}>
            Find an activity
          </Button>
        </section>
      )}
    </Screen>
  )
}

function PlanList({
  plans,
  service,
  refresh,
}: {
  plans: SessionPlan[]
  service: PlanService
  refresh: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState<SessionPlan>()
  return (
    <Screen title="My session plans">
      <div>
        <Button variant="primary" onClick={() => go("/plans/new")}>
          Create session plan
        </Button>
      </div>
      {plans.length ? (
        <ul className="grid gap-4">
          {plans.map((plan) => {
            const activity = activities.find(
              (item) => item.id === plan.activityId,
            )
            return (
              <li key={plan.id}>
                <article className="quiet-card grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-[1.375rem] font-bold">{plan.name}</h2>
                    <StatusChip status={plan.status} />
                  </div>
                  <p>
                    {activity?.title ?? "No activity selected"},{" "}
                    {plan.date || "No date"}, {plan.totalMinutes} minutes
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => go(`/plans/${plan.id}`)}>
                      Open
                    </Button>
                    <Button
                      data-testid="delete-plan"
                      variant="text"
                      onClick={() => setDeleting(plan)}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      ) : (
        <section className="quiet-card">
          <p>No session plans are saved on this device.</p>
          <Button className="mt-4" onClick={() => go("/plans/new")}>
            Create session plan
          </Button>
        </section>
      )}
      {deleting && (
        <Dialog
          title="Delete this plan from this device?"
          confirmLabel="Delete plan"
          cancelLabel="Keep plan"
          danger
          onClose={() => setDeleting(undefined)}
          onConfirm={async () => {
            await service.delete(deleting.id)
            setDeleting(undefined)
            await refresh()
          }}
        >
          <p>This cannot be undone.</p>
        </Dialog>
      )}
    </Screen>
  )
}

function ErrorSummary({ errors }: { errors: ValidationError[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (errors.length) ref.current?.focus()
  }, [errors])
  if (!errors.length) return null
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="error-box">
      <h2 className="text-[1.375rem] font-bold">
        Check the plan and try again
      </h2>
      <p className="mt-2">
        Your work is still on screen. Fix the following fields, then choose the
        action again.
      </p>
      <ul className="mt-3 list-disc pl-6">
        {errors.map((error, index) => (
          <li key={`${error.field}-${index}`}>
            <a className="font-bold underline" href={`#${error.field}`}>
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlanEditor({
  initial,
  service,
  refresh,
}: {
  initial: SessionPlan
  service: PlanService
  refresh: () => Promise<void>
}) {
  const [plan, setPlan] = useState(initial)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [saveStatus, setSaveStatus] = useState("")
  const [newMaterial, setNewMaterial] = useState("")
  const [pendingActivity, setPendingActivity] = useState<Activity>()
  const latest = useRef(plan)
  latest.current = plan

  const save = useCallback(
    async (draft: SessionPlan, navigate = false) => {
      setSaveStatus("Saving…")
      const result = await service.saveDraft(draft)
      if (!result.ok) {
        if (result.type === "validation") {
          if (navigate) setErrors(result.errors)
          setSaveStatus("")
        } else {
          setSaveStatus(
            "Not saved. Storage is not available. Your changes are still on screen.",
          )
        }
        return false
      }
      setSaveStatus(
        `Draft saved on this device at ${new Date(
          result.value.updatedAt,
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      )
      await refresh()
      if (navigate) go(`/plans/${result.value.id}/draft-saved`)
      return true
    },
    [refresh, service],
  )

  useEffect(() => {
    if (!plan.name.trim()) return
    const timer = window.setTimeout(() => void save(plan), 1000)
    return () => window.clearTimeout(timer)
  }, [plan, save])

  useEffect(
    () => () => {
      if (latest.current.name.trim())
        void service.saveDraft(latest.current).then(() => refresh())
    },
    [refresh, service],
  )

  const updateStep = (index: number, patch: Partial<PlanStep>) =>
    setPlan({
      ...plan,
      steps: plan.steps.map((step, position) =>
        position === index ? { ...step, ...patch } : step,
      ),
    })
  const fieldError = (field: string) =>
    errors.find((error) => error.field === field)?.message
  const activityChange = (id: string) => {
    const activity = activities.find((item) => item.id === id)
    if (!activity) return
    if (
      plan.activityId &&
      (plan.steps.length || plan.materials.length || plan.safety)
    ) {
      setPendingActivity(activity)
    } else {
      setPlan({ ...plan, ...activityDefaults(activity) })
    }
  }
  const complete = async () => {
    const result = await service.complete(plan)
    if (!result.ok) {
      if (result.type === "validation") setErrors(result.errors)
      else
        setSaveStatus(
          "Not saved. Storage is not available. Your changes are still on screen.",
        )
      return
    }
    await refresh()
    go(`/plans/${result.value.id}/waiting`)
  }
  return (
    <Screen title={initial.name ? "Edit session plan" : "Create session plan"}>
      <ErrorSummary errors={errors} />
      <div className="quiet-card grid gap-6">
        <FormField
          id="plan-name"
          label="Plan name"
          error={fieldError("plan-name")}
        >
          <input
            id="plan-name"
            data-testid="plan-name"
            value={plan.name}
            aria-invalid={Boolean(fieldError("plan-name"))}
            aria-describedby={
              fieldError("plan-name") ? "plan-name-error" : undefined
            }
            onChange={(event) => setPlan({ ...plan, name: event.target.value })}
          />
        </FormField>
        <FormField id="date" label="Date">
          <input
            id="date"
            type="date"
            value={plan.date}
            onChange={(event) => setPlan({ ...plan, date: event.target.value })}
          />
        </FormField>
        <FormField id="total-time" label="Total time (minutes)">
          <input
            id="total-time"
            type="number"
            min="1"
            max="180"
            value={plan.totalMinutes}
            onChange={(event) =>
              setPlan({ ...plan, totalMinutes: Number(event.target.value) })
            }
          />
        </FormField>
        <FormField
          id="activity"
          label="Activity"
          error={fieldError("activity")}
        >
          <select
            id="activity"
            value={plan.activityId}
            aria-invalid={Boolean(fieldError("activity"))}
            aria-describedby={
              fieldError("activity") ? "activity-error" : undefined
            }
            onChange={(event) => activityChange(event.target.value)}
          >
            <option value="">Choose an activity</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.title}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <section id="steps" className="quiet-card">
        <h2 className="text-[1.375rem] font-bold">Steps</h2>
        {fieldError("steps") && (
          <p id="steps-error" className="mt-2 font-bold text-[#991b1b]">
            {fieldError("steps")}
          </p>
        )}
        <ol className="mt-4 grid gap-5">
          {plan.steps.map((step, index) => (
            <li
              key={step.id}
              data-testid={`plan-step-${index + 1}`}
              className="rounded-lg border border-slate-400 p-4"
            >
              <p className="mb-3 font-bold">Step {index + 1}</p>
              <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                <FormField
                  id={`step-${index}-text`}
                  label={`Step ${index + 1} description`}
                >
                  <input
                    id={`step-${index}-text`}
                    value={step.text}
                    onChange={(event) =>
                      updateStep(index, { text: event.target.value })
                    }
                  />
                </FormField>
                <FormField id={`step-${index}-minutes`} label="Minutes">
                  <input
                    id={`step-${index}-minutes`}
                    type="number"
                    min="1"
                    max="180"
                    value={step.minutes}
                    onChange={(event) =>
                      updateStep(index, { minutes: Number(event.target.value) })
                    }
                  />
                </FormField>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  aria-label={`Move step ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => {
                    const steps = [...plan.steps]
                    ;[steps[index - 1], steps[index]] = [
                      steps[index],
                      steps[index - 1],
                    ]
                    setPlan({ ...plan, steps })
                  }}
                >
                  Move up
                </Button>
                <Button
                  aria-label={`Move step ${index + 1} down`}
                  disabled={index === plan.steps.length - 1}
                  onClick={() => {
                    const steps = [...plan.steps]
                    ;[steps[index], steps[index + 1]] = [
                      steps[index + 1],
                      steps[index],
                    ]
                    setPlan({ ...plan, steps })
                  }}
                >
                  Move down
                </Button>
                <Button
                  variant="text"
                  aria-label={`Remove step ${index + 1}`}
                  onClick={() =>
                    setPlan({
                      ...plan,
                      steps: plan.steps.filter(
                        (_, position) => position !== index,
                      ),
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ol>
        <Button
          data-testid="add-step"
          className="mt-4"
          onClick={() =>
            setPlan({
              ...plan,
              steps: [
                ...plan.steps,
                { id: crypto.randomUUID(), text: "", minutes: 5 },
              ],
            })
          }
        >
          Add step
        </Button>
        <p className="mt-4 font-bold" role="status">
          Steps total{" "}
          {plan.steps.reduce((sum, step) => sum + Number(step.minutes || 0), 0)}{" "}
          of {plan.totalMinutes} minutes.
        </p>
      </section>
      <section className="quiet-card">
        <h2 className="text-[1.375rem] font-bold">Materials</h2>
        <ul className="my-4 grid gap-2">
          {plan.materials.map((material, index) => (
            <li
              key={`${material}-${index}`}
              className="flex items-center justify-between gap-3"
            >
              <span>{material}</span>
              <Button
                variant="text"
                aria-label={`Remove ${material}`}
                onClick={() =>
                  setPlan({
                    ...plan,
                    materials: plan.materials.filter(
                      (_, position) => position !== index,
                    ),
                  })
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-3">
          <FormField id="new-material" label="Add material">
            <input
              id="new-material"
              value={newMaterial}
              onChange={(event) => setNewMaterial(event.target.value)}
            />
          </FormField>
          <Button
            onClick={() => {
              if (!newMaterial.trim()) return
              setPlan({
                ...plan,
                materials: [...plan.materials, newMaterial.trim()],
              })
              setNewMaterial("")
            }}
          >
            Add material
          </Button>
        </div>
      </section>
      <div className="quiet-card grid gap-6">
        <FormField id="safety" label="Safety" error={fieldError("safety")}>
          <textarea
            id="safety"
            rows={4}
            value={plan.safety}
            aria-invalid={Boolean(fieldError("safety"))}
            aria-describedby={fieldError("safety") ? "safety-error" : undefined}
            onChange={(event) =>
              setPlan({ ...plan, safety: event.target.value })
            }
          />
        </FormField>
        <FormField id="inclusion" label="Inclusion">
          <textarea
            id="inclusion"
            rows={4}
            value={plan.inclusion}
            onChange={(event) =>
              setPlan({ ...plan, inclusion: event.target.value })
            }
          />
        </FormField>
      </div>
      <p role="status" className="font-bold">
        {saveStatus}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button data-testid="save-draft" onClick={() => void save(plan, true)}>
          Save draft
        </Button>
        <Button
          data-testid="complete-plan"
          variant="primary"
          onClick={complete}
        >
          Complete plan
        </Button>
      </div>
      {pendingActivity && (
        <Dialog
          title="Replace activity details?"
          confirmLabel="Replace"
          cancelLabel="Keep mine"
          onClose={() => {
            setPlan({ ...plan, activityId: pendingActivity.id })
            setPendingActivity(undefined)
          }}
          onConfirm={() => {
            setPlan({ ...plan, ...activityDefaults(pendingActivity) })
            setPendingActivity(undefined)
          }}
        >
          <p>
            Replace the steps, materials, safety and inclusion with this
            activity&apos;s defaults?
          </p>
        </Dialog>
      )}
    </Screen>
  )
}

function PlanPreview({ plan }: { plan: SessionPlan }) {
  const activity = activities.find((item) => item.id === plan.activityId)
  return (
    <div className="grid gap-5">
      <section className="quiet-card">
        <p>
          <strong>Activity:</strong> {activity?.title ?? "Not selected"}
        </p>
        <p>
          <strong>Date:</strong> {plan.date || "Not set"}
        </p>
        <p>
          <strong>Total time:</strong> {plan.totalMinutes} minutes
        </p>
      </section>
      <section className="quiet-card">
        <h2 className="text-[1.375rem] font-bold">Steps</h2>
        <ol className="mt-3 list-decimal space-y-3 pl-6">
          {plan.steps.map((step) => (
            <li key={step.id}>
              {step.text} <strong>({step.minutes} minutes)</strong>
            </li>
          ))}
        </ol>
      </section>
      <section className="quiet-card">
        <h2 className="text-[1.375rem] font-bold">Materials</h2>
        <ul className="mt-3 list-disc pl-6">
          {plan.materials.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="quiet-card">
        <h2 className="text-[1.375rem] font-bold">Safety</h2>
        <p className="mt-2">{plan.safety || "Not added"}</p>
      </section>
      <section className="quiet-card">
        <h2 className="text-[1.375rem] font-bold">Inclusion</h2>
        <p className="mt-2">{plan.inclusion || "Not added"}</p>
      </section>
    </div>
  )
}

function DraftSaved({ plan }: { plan: SessionPlan }) {
  return (
    <Screen title="Draft saved">
      <div>
        <StatusChip status="DRAFT" testId="plan-status" />
      </div>
      <p className="text-xl">
        Draft saved on this device. It stays available if you go offline or
        close the app.
      </p>
      <PlanPreview plan={plan} />
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => go(`/plans/${plan.id}/edit`)}>
          Continue editing
        </Button>
        <Button onClick={() => go(`/plans/${plan.id}/edit`)}>
          Complete plan
        </Button>
      </div>
    </Screen>
  )
}

function Waiting({
  plan,
  onSync,
}: {
  plan: SessionPlan
  onSync: (retry: boolean) => Promise<void>
}) {
  return (
    <Screen title="Waiting to sync">
      <StatusChip status={plan.status} testId="plan-status" />
      <p className="text-xl">Plan completed. Saved on this device.</p>
      <p>It will be sent when a connection is available.</p>
      <div className="flex flex-wrap gap-3">
        <Button
          data-testid="sync-now"
          variant="primary"
          aria-busy={plan.status === "SYNCING"}
          disabled={plan.status === "SYNCING"}
          onClick={() => void onSync(false)}
        >
          {plan.status === "SYNCING" ? "Syncing…" : "Sync now"}
        </Button>
        <Button onClick={() => go(`/plans/${plan.id}`)}>View plan</Button>
        <Button variant="text" onClick={() => go("/plans")}>
          Back to my plans
        </Button>
      </div>
    </Screen>
  )
}

function SyncFailed({
  plan,
  onSync,
}: {
  plan: SessionPlan
  onSync: (retry: boolean) => Promise<void>
}) {
  return (
    <Screen title="Sync failed">
      <Icon name="warning" className="size-12 text-[#991b1b]" />
      <p className="text-xl">Your session plan could not be sent.</p>
      <p className="font-bold">
        Your plan is still safely saved on this device.
      </p>
      <StatusChip status={plan.status} testId="sync-status" />
      <p>
        <strong>Reason:</strong> {plan.lastError}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          data-testid="retry-sync"
          variant="primary"
          aria-busy={plan.status === "SYNCING"}
          disabled={plan.status === "SYNCING"}
          onClick={() => void onSync(true)}
        >
          {plan.status === "SYNCING" ? "Syncing…" : "Retry sync"}
        </Button>
        <Button onClick={() => go(`/plans/${plan.id}/edit`)}>
          Continue working
        </Button>
      </div>
    </Screen>
  )
}

function SyncSuccess({ plan }: { plan: SessionPlan }) {
  return (
    <Screen title="Successfully synced">
      <Icon name="check" className="size-12 text-green-800" />
      <p className="text-xl">{plan.name}</p>
      <StatusChip status="SYNCED" testId="sync-status" />
      <p>
        Last synced:{" "}
        {plan.lastSyncedAt
          ? new Date(plan.lastSyncedAt).toLocaleString()
          : "Not available"}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => go(`/plans/${plan.id}`)}>
          View plan
        </Button>
        <Button onClick={() => go("/")}>Back to home</Button>
      </div>
    </Screen>
  )
}

function PlanDetails({
  plan,
  onSync,
}: {
  plan: SessionPlan
  onSync: (retry: boolean) => Promise<void>
}) {
  return (
    <Screen title={plan.name || "Session plan"}>
      <div className="quiet-card">
        <h2 className="mb-3 text-[1.375rem] font-bold">Plan status</h2>
        <StatusChip status={plan.status} testId="plan-status" />
        {plan.status === "SYNCED" && plan.lastSyncedAt && (
          <p className="mt-3">
            Last synced: {new Date(plan.lastSyncedAt).toLocaleString()}
          </p>
        )}
        <div className="mt-4">
          {plan.status === "DRAFT" && (
            <Button onClick={() => go(`/plans/${plan.id}/edit`)}>
              Continue editing
            </Button>
          )}
          {plan.status === "QUEUED" && (
            <Button
              data-testid="sync-now"
              variant="primary"
              onClick={() => void onSync(false)}
            >
              Sync now
            </Button>
          )}
          {plan.status === "FAILED" && (
            <Button
              data-testid="retry-sync"
              variant="primary"
              onClick={() => void onSync(true)}
            >
              Retry sync
            </Button>
          )}
          {plan.status === "SYNCING" && (
            <Button disabled aria-busy="true">
              Syncing…
            </Button>
          )}
        </div>
      </div>
      <PlanPreview plan={plan} />
    </Screen>
  )
}

function More({
  plans,
  textSize,
  onTextSize,
  controls,
  reset,
  deleteAll,
}: {
  plans: SessionPlan[]
  textSize: TextSize
  onTextSize: (size: TextSize) => void
  controls: React.ReactNode
  reset: () => Promise<void>
  deleteAll: () => Promise<void>
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const exportPlans = () => {
    const blob = new Blob([JSON.stringify(plans, null, 2)], {
      type: "application/json",
    })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "stemmate-plans.json"
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return (
    <Screen title="More">
      <section className="quiet-card">
        <h2 className="text-[1.375rem] font-bold">Accessibility</h2>
        <fieldset className="mt-4">
          <legend>Text size</legend>
          {[
            ["normal", "Normal"],
            ["large", "Large"],
            ["extra-large", "Extra large"],
          ].map(([value, label]) => (
            <label className="option" key={value}>
              <input
                type="radio"
                name="text-size"
                checked={textSize === value}
                onChange={() => onTextSize(value as TextSize)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <p className="mt-4">
          Use Tab and Shift+Tab to move between controls. Press Enter or Space
          to activate buttons. Use arrow keys in radio groups.
        </p>
      </section>
      <section className="quiet-card">
        <h2 className="text-[1.375rem] font-bold">About STEMMate</h2>
        <p className="mt-3">Version v1.1.</p>
        <p className="mt-2">
          All activities and plans use synthetic data. No pupil information is
          collected. Prototype, not a production system.
        </p>
        <p className="mt-2 font-bold">
          Anyone using this device can open these plans.
        </p>
      </section>
      <section className="quiet-card">
        <h2 className="text-[1.375rem] font-bold">Data on this device</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={exportPlans}>Export my plans</Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete all data on this device
          </Button>
        </div>
      </section>
      {controls}
      {confirmDelete && (
        <Dialog
          title="Delete all data on this device?"
          confirmLabel="Delete all data"
          cancelLabel="Keep my data"
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteAll()
            setConfirmDelete(false)
          }}
        >
          <p>
            All saved activities, plans and settings will be removed. This
            cannot be undone.
          </p>
        </Dialog>
      )}
      <Button data-testid="reset-demo" variant="text" onClick={reset}>
        Reset demo data
      </Button>
    </Screen>
  )
}

export default function App() {
  const [runtime, setRuntime] = useState<Runtime>()
  const [route, setRoute] = useState(routeFromHash)
  const [plans, setPlans] = useState<SessionPlan[]>([])
  const [savedIds, setSavedIds] = useState<ActivityId[]>([])
  const [filters, setFilters] = useState<ActivityFilterCriteria>(emptyFilters)
  const [online, setOnline] = useState(false)
  const [connectionMode, setConnectionMode] = useState<"guided" | "manual">(
    "guided",
  )
  const [nextResult, setNextResult] = useState<MockResult>("succeed")
  const [simulateStorage, setSimulateStorage] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const [textSize, setTextSize] = useState<TextSize>("normal")
  const [guidedFailureUsed, setGuidedFailureUsed] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      let persistent = typeof indexedDB !== "undefined"
      if (persistent) {
        try {
          const db = await openDatabase()
          db.close()
        } catch {
          persistent = false
        }
      }
      const created = createRuntime(persistent)
      await seedDemo(created)
      const size = await created.settings.get<TextSize>("text-size", "normal")
      if (active) {
        setTextSize(size)
        setRuntime(created)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!runtime) return
    setPlans(await runtime.planService.list(PROFILE_ID))
    setSavedIds(await runtime.activityService.savedIds(PROFILE_ID))
  }, [runtime])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onHash = () => {
      setRoute(routeFromHash())
      setAnnouncement("Screen changed")
    }
    window.addEventListener("hashchange", onHash)
    const network = () => {
      if (connectionMode === "manual") setOnline(navigator.onLine)
    }
    window.addEventListener("online", network)
    window.addEventListener("offline", network)
    return () => {
      window.removeEventListener("hashchange", onHash)
      window.removeEventListener("online", network)
      window.removeEventListener("offline", network)
    }
  }, [connectionMode])

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize
  }, [textSize])

  const planId = route.match(/^\/plans\/([^/?]+)/)?.[1]
  const currentPlan = plans.find((plan) => plan.id === planId)
  const activityId = route.match(/^\/activities\/([^/?]+)/)?.[1]
  const currentActivity = activities.find(
    (activity) => activity.id === activityId,
  )

  const sync = async (plan: SessionPlan, retry: boolean) => {
    if (!runtime) return
    if (connectionMode === "guided") {
      if (retry) {
        setOnline(true)
        setAnnouncement("Connection restored")
        runtime.gateway.setResult("succeed")
        setGuidedFailureUsed(true)
      } else if (!guidedFailureUsed) {
        setOnline(false)
        runtime.gateway.setResult("fail")
        setGuidedFailureUsed(true)
      } else {
        setOnline(true)
        runtime.gateway.setResult("succeed")
      }
    } else {
      runtime.gateway.setResult(online ? nextResult : "fail")
    }
    const pending = {
      ...plan,
      status: "SYNCING" as const,
    }
    setPlans((current) =>
      current.map((item) => (item.id === plan.id ? pending : item)),
    )
    const result = retry
      ? await runtime.syncService.retry(plan.id)
      : await runtime.syncService.syncNow(plan.id)
    await refresh()
    go(
      result.status === "SYNCED"
        ? `/plans/${result.id}/synced`
        : `/plans/${result.id}/sync-failed`,
    )
  }

  const query = route.split("?")[1]
  const selectedForNew = new URLSearchParams(query ?? "").get("activity")
  const newPlan = useMemo(() => {
    if (!runtime) return undefined
    const blank = runtime.planService.create(
      PROFILE_ID,
      selectedForNew as ActivityId || "",
    )
    const activity = activities.find((item) => item.id === selectedForNew)
    return activity ? { ...blank, ...activityDefaults(activity) } : blank
    // New object should only be created when the new-plan route changes.
  }, [runtime, selectedForNew, route.startsWith("/plans/new")])

  if (!runtime)
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p role="status" className="font-bold">
          Loading STEMMate Namibia…
        </p>
      </main>
    )

  let content: React.ReactNode
  if (route === "/") content = <Home plans={plans} />
  else if (route === "/activities")
    content = (
      <ActivityLibrary
        service={runtime.activityService}
        savedIds={savedIds}
        filters={filters}
        setFilters={setFilters}
      />
    )
  else if (route === "/activities/filters")
    content = <Filters initial={filters} onApply={setFilters} />
  else if (currentActivity && route.endsWith("/saved"))
    content = <ActivitySaved activity={currentActivity} />
  else if (currentActivity)
    content = (
      <ActivityDetails
        activity={currentActivity}
        saved={savedIds.includes(currentActivity.id)}
        service={runtime.activityService}
        refresh={refresh}
      />
    )
  else if (route === "/saved")
    content = (
      <SavedActivities
        ids={savedIds}
        service={runtime.activityService}
        refresh={refresh}
      />
    )
  else if (route === "/plans")
    content = (
      <PlanList plans={plans} service={runtime.planService} refresh={refresh} />
    )
  else if (route.startsWith("/plans/new") && newPlan)
    content = (
      <PlanEditor
        key={newPlan.id}
        initial={newPlan}
        service={runtime.planService}
        refresh={refresh}
      />
    )
  else if (currentPlan && route.endsWith("/edit"))
    content = (
      <PlanEditor
        key={currentPlan.id}
        initial={currentPlan}
        service={runtime.planService}
        refresh={refresh}
      />
    )
  else if (currentPlan && route.endsWith("/draft-saved"))
    content = <DraftSaved plan={currentPlan} />
  else if (currentPlan && route.endsWith("/waiting"))
    content = (
      <Waiting
        plan={currentPlan}
        onSync={(retry) => sync(currentPlan, retry)}
      />
    )
  else if (currentPlan && route.endsWith("/sync-failed"))
    content = (
      <SyncFailed
        plan={currentPlan}
        onSync={(retry) => sync(currentPlan, retry)}
      />
    )
  else if (currentPlan && route.endsWith("/synced"))
    content = <SyncSuccess plan={currentPlan} />
  else if (currentPlan)
    content = (
      <PlanDetails
        plan={currentPlan}
        onSync={(retry) => sync(currentPlan, retry)}
      />
    )
  else if (route === "/more")
    content = (
      <More
        plans={plans}
        textSize={textSize}
        onTextSize={(size) => {
          setTextSize(size)
          void runtime.settings.set("text-size", size)
        }}
        deleteAll={async () => {
          runtime.setStorageFailure(false)
          setSimulateStorage(false)
          await runtime.planService.clear()
          await runtime.activityService.clear()
          await runtime.settings.clear()
          await runtime.settings.set("demo-seeded", true)
          await refresh()
        }}
        reset={async () => {
          runtime.setStorageFailure(false)
          setSimulateStorage(false)
          await runtime.planService.clear()
          await runtime.activityService.clear()
          await runtime.settings.clear()
          await seedDemo(runtime, true)
          setOnline(false)
          setGuidedFailureUsed(false)
          await refresh()
          go("/")
        }}
        controls={
          <details className="quiet-card">
            <summary className="min-h-11 cursor-pointer text-[1.375rem] font-bold">
              Prototype controls: not part of the product
            </summary>
            <div className="mt-5 grid gap-6">
              <fieldset>
                <legend>Connection mode</legend>
                {[
                  ["guided", "Guided demo"],
                  ["manual", "Manual"],
                ].map(([value, label]) => (
                  <label className="option" key={value}>
                    <input
                      type="radio"
                      name="connection-mode"
                      checked={connectionMode === value}
                      onChange={() =>
                        setConnectionMode(value as "guided" | "manual")
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Connection</legend>
                {[
                  [true, "Online"],
                  [false, "Offline"],
                ].map(([value, label]) => (
                  <label className="option" key={label as string}>
                    <input
                      type="radio"
                      name="connection"
                      checked={online === value}
                      onChange={() => setOnline(value as boolean)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Next sync result</legend>
                {[
                  ["succeed", "Succeed"],
                  ["fail", "Fail"],
                  ["timeout", "Time out"],
                ].map(([value, label]) => (
                  <label className="option" key={value}>
                    <input
                      type="radio"
                      name="sync-result"
                      checked={nextResult === value}
                      onChange={() => setNextResult(value as MockResult)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <label className="option">
                <input
                  type="checkbox"
                  checked={simulateStorage}
                  onChange={(event) => {
                    setSimulateStorage(event.target.checked)
                    runtime.setStorageFailure(event.target.checked)
                  }}
                />
                Simulate storage failure
              </label>
            </div>
          </details>
        }
      />
    )
  else
    content = (
      <Screen title="Page not found">
        <p>This page is not available.</p>
        <Button onClick={() => go("/")}>Back to home</Button>
      </Screen>
    )

  return (
    <Shell
      route={route}
      online={online}
      plans={plans}
      savedCount={savedIds.length}
      storageAvailable={runtime.persistent && !simulateStorage}
      announcement={announcement}
    >
      {content}
    </Shell>
  )
}
