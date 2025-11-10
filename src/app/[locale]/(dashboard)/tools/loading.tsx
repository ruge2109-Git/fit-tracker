import { CardSkeleton } from '@/components/ui/loading-skeleton'

export default function ToolsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-64 bg-muted rounded-md animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded-md animate-pulse" />
      </div>

      {/* Tools Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Info Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 mt-8">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

