import { CardSkeleton } from '@/components/ui/loading-skeleton'

export default function AdminFeedbackLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-64 bg-muted rounded-md animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded-md animate-pulse" />
      </div>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}

