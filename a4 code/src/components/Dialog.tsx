import { useEffect, useRef } from "react"
import { Button } from "./Button"

export function Dialog({
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  danger = false,
}: {
  title: string
  children: React.ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onClose: () => void
  danger?: boolean
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const focusable = () => [
      ...(dialog?.querySelectorAll<HTMLElement>("button") ?? []),
    ]
    focusable()[0]?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key !== "Tab") return
      const nodes = focusable()
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", keydown)
    return () => {
      document.removeEventListener("keydown", keydown)
      previous?.focus()
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-lg rounded-xl bg-white p-6"
      >
        <h2 id="dialog-title" className="text-[1.375rem] font-bold">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
