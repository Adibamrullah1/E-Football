export default function PublicLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-secondary/50"></div>
        <div className="space-y-2">
          <div className="h-8 w-48 bg-secondary/50 rounded-lg"></div>
          <div className="h-4 w-32 bg-secondary/50 rounded-lg"></div>
        </div>
      </div>

      {/* Dropdown Skeleton */}
      <div className="h-10 w-48 bg-secondary/50 rounded-xl mb-8"></div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 w-full bg-secondary/50 rounded-2xl border border-border/50"></div>
        ))}
      </div>
    </div>
  )
}
