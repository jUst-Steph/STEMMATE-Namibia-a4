import type { SyncStatus } from "../domain/types"

type Status = SyncStatus | "AVAILABLE" | "NOT_SAVED"

const labels: Record<Status, string> = {
  DRAFT: "Draft",
  QUEUED: "Waiting to sync",
  SYNCING: "Syncing",
  SYNCED: "Synced",
  FAILED: "Sync failed",
  AVAILABLE: "Available offline",
  NOT_SAVED: "Not saved offline",
}

export function StatusChip({
  status,
  testId,
}: {
  status: Status
  testId?: string
}) {
  const warning = status === "FAILED" || status === "QUEUED"
  const success = status === "SYNCED" || status === "AVAILABLE"
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-bold ${
        warning
          ? "border-amber-700 bg-amber-50 text-amber-900"
          : success
            ? "border-green-700 bg-green-50 text-green-800"
            : "border-slate-500 bg-slate-50 text-slate-800"
      }`}
    >
      <svg
        aria-hidden="true"
        className="size-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        {warning ? (
          <path d="M12 3 2 21h20L12 3Zm0 6v5m0 3v.1" />
        ) : success ? (
          <path d="m5 12 4 4L19 6" />
        ) : (
          <path d="M12 7v5l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
        )}
      </svg>
      {labels[status]}
    </span>
  )
}
