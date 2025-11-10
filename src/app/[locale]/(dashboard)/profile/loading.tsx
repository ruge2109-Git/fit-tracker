import { StatsCardSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton'

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-muted rounded-md animate-pulse" />
          <div className="h-5 w-96 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
      </div>

      {/* User Info Skeleton */}
      <CardSkeleton />

      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Activity Skeleton */}
      <CardSkeleton />
    </div>
  )
}

