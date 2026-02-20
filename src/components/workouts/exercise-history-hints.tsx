'use client'

import React, { useEffect, useState } from 'react'
import { statsService } from '@/domain/services/stats.service'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { History, Sparkles } from 'lucide-react'

interface ExerciseHistoryHintsProps {
  userId: string
  exerciseId: string
}

export function ExerciseHistoryHints({ userId, exerciseId }: ExerciseHistoryHintsProps) {
  const [data, setData] = useState<{ weight: number; reps: number; date: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLastPerf()
  }, [userId, exerciseId])

  const loadLastPerf = async () => {
    const res = await statsService.getLastPerformance(userId, exerciseId)
    if (res.data) setData(res.data)
    setIsLoading(false)
  }

  if (isLoading || !data) return null

  const daysAgo = formatDistanceToNow(new Date(data.date), { addSuffix: true, locale: es })
  const suggestedWeight = data.weight + 2.5

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
        <History className="h-3 w-3" />
        <span>Último: <span className="text-foreground">{data.weight}kg × {data.reps}</span> — {daysAgo}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-tight">
        <Sparkles className="h-3 w-3" />
        <span>Sugerido: <span className="underline decoration-primary/30 underline-offset-2">{suggestedWeight}kg</span></span>
      </div>
    </div>
  )
}
