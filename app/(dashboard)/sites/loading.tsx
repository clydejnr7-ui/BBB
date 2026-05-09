export default function SitesLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded-md bg-muted/60" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
