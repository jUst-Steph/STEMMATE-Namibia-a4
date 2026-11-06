import type { ButtonHTMLAttributes, ReactNode } from "react"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "primary" | "secondary" | "text" | "danger"
}

export function Button({
  children,
  variant = "secondary",
  className = "",
  ...props
}: Props) {
  const variants = {
    primary: "border-teal-700 bg-teal-700 text-white hover:bg-[#0d6460]",
    secondary: "border-[#64748b] bg-white text-[#1e293b] hover:bg-slate-50",
    text: "border-transparent bg-transparent text-teal-800 hover:bg-teal-50",
    danger: "border-[#991b1b] bg-[#991b1b] text-white hover:bg-red-900",
  }
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
