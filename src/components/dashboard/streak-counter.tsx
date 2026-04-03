'use client'

import React, { useEffect, useState } from 'react'
import { statsService } from '@/domain/services/stats.service'
import { Flame, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { MAX_STREAK_RECOVERY_USES } from '@/lib/streak'

interface StreakCounterProps {
  userId: string
}

type StreakState = {
  current: number
  isAtRisk: boolean
  recoveryCreditsRemaining: number
  canRecoverStreak: boolean
}

export function StreakCounter({ userId }: StreakCounterProps) {
  const t = useTranslations('dashboard.streak')
  const [streak, setStreak] = useState<StreakState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    loadStreak()
  }, [userId])

  const loadStreak = async () => {
    const res = await statsService.getCurrentStreak(userId)
    if (res.data) setStreak(res.data)
    setIsLoading(false)
  }

  const handleRecover = async () => {
    setRecovering(true)
    try {
      const response = await fetch('/api/streak/recover', { method: 'POST' })
      if (!response.ok) {
        toast.error(t('recoverError'))
        return
      }
      toast.success(t('recoverSuccess'))
      await loadStreak()
    } finally {
      setRecovering(false)
    }
  }

  if (isLoading || !streak) return null

  const isZeroState = streak.current === 0
  const showRecover = isZeroState && streak.canRecoverStreak

  return (
    <Card className={cn(
      "rounded-3xl border-none shadow-sm transition-all animate-in zoom-in-95 duration-500",
      showRecover ? "bg-primary/5" : isZeroState ? "bg-accent/5" : (streak.isAtRisk ? "bg-amber-500/10" : "bg-orange-500/10")
    )}>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-700",
            showRecover ? "bg-primary/15" : isZeroState ? "bg-muted/20" : (streak.isAtRisk ? "bg-amber-500/20 animate-pulse" : "bg-orange-500/20")
          )}>
            <Flame className={cn(
              "h-6 w-6 transition-all",
              showRecover ? "text-primary fill-primary/30" : isZeroState ? "text-muted-foreground/30" : (streak.isAtRisk ? "text-amber-500" : "text-orange-500 fill-orange-500")
            )} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-2xl font-black uppercase italic tracking-tighter",
                isZeroState && "text-muted-foreground/40"
              )}>
                {streak.current} {t('label')}
              </span>
              {streak.isAtRisk && !isZeroState && (
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {showRecover
                ? t('captionRecover')
                : isZeroState
                  ? t('empty')
                  : t('caption')}
            </p>
            {showRecover && (
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                {t('recoverCredits', { remaining: streak.recoveryCreditsRemaining, max: MAX_STREAK_RECOVERY_USES })}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {streak.isAtRisk && !isZeroState && (
            <div className="text-right">
              <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 leading-tight uppercase">
                {t('atRiskShort')}<br/>{t('atRisk').split('. ')[1]}
              </p>
            </div>
          )}
          {showRecover && (
            <Button
              type="button"
              size="sm"
              className="rounded-xl font-bold uppercase text-[10px] tracking-wide"
              disabled={recovering}
              onClick={handleRecover}
            >
              {recovering ? '…' : t('recover')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
