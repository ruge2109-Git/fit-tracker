/**
 * Tools Page
 * Useful fitness tools and calculators
 */

'use client'

import { useEffect, useState } from 'react'
import { Calculator, Timer } from 'lucide-react'
import { RestTimer } from '@/components/tools/rest-timer'
import { OneRMCalculator } from '@/components/tools/one-rm-calculator'
import { CardSkeleton } from '@/components/ui/loading-skeleton'

export default function ToolsPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Show loading briefly to match other pages
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fitness Tools</h1>
        <p className="text-muted-foreground">Useful calculators and timers for your training</p>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <RestTimer />
        <OneRMCalculator />
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 mt-8">
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Rest Timer</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Track your rest periods between sets. Research suggests 1-2 minutes for hypertrophy and 2-5 minutes for strength training.
          </p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">1RM Calculator</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Estimate your one-rep max without actually testing it. Most accurate for 1-10 reps. Use percentages to plan your training intensity.
          </p>
        </div>
      </div>
    </div>
  )
}

