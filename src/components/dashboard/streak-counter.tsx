'use client'

import React, { useEffect, useState } from 'react'
import { statsService } from '@/domain/services/stats.service'
import { Flame, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface StreakCounterProps {
  userId: string
}

export function StreakCounter({ userId }: StreakCounterProps) {
  const t = useTranslations('dashboard.streak')
  const [streak, setStreak] = useState<{ current: number, isAtRisk: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStreak()
  }, [userId])

  const loadStreak = async () => {
    const res = await statsService.getCurrentStreak(userId)
    if (res.data) setStreak(res.data)
    setIsLoading(false)
  }

  if (isLoading || !streak) return null

  const isZeroState = streak.current === 0

  return (
    <Card className={cn(
      "rounded-3xl border-none shadow-sm transition-all animate-in zoom-in-95 duration-500",
      isZeroState ? "bg-accent/5" : (streak.isAtRisk ? "bg-amber-500/10" : "bg-orange-500/10")
    )}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-700",
            isZeroState ? "bg-muted/20" : (streak.isAtRisk ? "bg-amber-500/20 animate-pulse" : "bg-orange-500/20")
          )}>
            <Flame className={cn(
              "h-6 w-6 transition-all",
              isZeroState ? "text-muted-foreground/30" : (streak.isAtRisk ? "text-amber-500" : "text-orange-500 fill-orange-500")
            )} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-2xl font-black uppercase italic tracking-tighter",
                isZeroState && "text-muted-foreground/40"
              )}>
                {streak.current} {t('label')}
              </span>
              {streak.isAtRisk && !isZeroState && (
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {isZeroState ? t('empty') : t('caption')}
            </p>
          </div>
        </div>

        {streak.isAtRisk && !isZeroState && (
          <div className="text-right">
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 leading-tight uppercase">
              {t('atRiskShort')}<br/>{t('atRisk').split('. ')[1]}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
