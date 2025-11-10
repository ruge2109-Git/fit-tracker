import { WorkoutCardSkeleton } from '@/components/ui/loading-skeleton'

export default function WorkoutsLoading() {
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

      {/* Filters Skeleton */}
      <div className="h-24 bg-muted rounded-lg animate-pulse" />

      {/* Workouts Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <WorkoutCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

