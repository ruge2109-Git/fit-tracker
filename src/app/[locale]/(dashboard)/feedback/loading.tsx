import { CardSkeleton } from '@/components/ui/loading-skeleton'

export default function FeedbackLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="h-8 w-64 bg-muted rounded-md animate-pulse mx-auto" />
        <div className="h-5 w-96 bg-muted rounded-md animate-pulse mx-auto" />
      </div>
      <CardSkeleton />
    </div>
  )
}

