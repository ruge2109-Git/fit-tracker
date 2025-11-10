import { CardSkeleton } from '@/components/ui/loading-skeleton'

export default function RoutinesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-muted rounded-md animate-pulse" />
          <div className="h-5 w-64 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
      </div>

      {/* Routines Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

