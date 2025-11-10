import { StatsCardSkeleton, ChartSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-64 bg-muted rounded-md animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded-md animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Recent Workouts Skeleton */}
      <CardSkeleton />
    </div>
  )
}

