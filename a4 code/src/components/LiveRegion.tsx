export function LiveRegion({
  children,
  assertive = false,
}: {
  children: React.ReactNode
  assertive?: boolean
}) {
  return (
    <div
      className="sr-only"
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
    >
      {children}
    </div>
  )
}
