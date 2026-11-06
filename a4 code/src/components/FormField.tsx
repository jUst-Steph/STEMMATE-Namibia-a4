import type { ReactNode } from "react"

export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <label className="font-bold" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p className="text-slate-600" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="font-bold text-[#991b1b]" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
