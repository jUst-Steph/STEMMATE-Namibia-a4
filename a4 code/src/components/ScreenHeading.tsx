import { forwardRef } from "react"

export const ScreenHeading = forwardRef<HTMLHeadingElement, {
  children: React.ReactNode
}>(({ children }, ref) => (
  <h1
    ref={ref}
    tabIndex={-1}
    className="text-[1.875rem] font-bold leading-tight"
  >
    {children}
  </h1>
))
