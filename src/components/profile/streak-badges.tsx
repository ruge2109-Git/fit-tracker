'use client'

import React, { useEffect, useState } from 'react'
import { statsService } from '@/domain/services/stats.service'
import { Flame, Award, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface StreakBadgesProps {
  userId: string
}

export function StreakBadges({ userId }: StreakBadgesProps) {
  const t = useTranslations('profile')
  const [streak, setStreak] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStreak()
  }, [userId])

  const loadStreak = async () => {
    const res = await statsService.getCurrentStreak(userId)
    if (res.data) setStreak(res.data.current)
    setIsLoading(false)
  }

  const badges = [
    { threshold: 100, label: t('badge100'), days: 100, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { threshold: 30, label: t('badge30'), days: 30, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { threshold: 7, label: t('badge7'), days: 7, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ]

  if (isLoading) return null

  return (
    <Card className="rounded-3xl border-none shadow-none bg-accent/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter italic">
          <Award className="h-5 w-5 text-primary" />
          {t('streakAchievements')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {badges.map((badge) => {
            const isUnlocked = streak >= badge.threshold
            return (
              <div 
                key={badge.threshold}
                className={cn(
                  "relative flex flex-col items-center p-5 rounded-3xl transition-all border border-border/5",
                  isUnlocked ? "bg-background/80 shadow-sm" : "bg-muted/10 grayscale opacity-40 shadow-none"
                )}
              >
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-all",
                  isUnlocked ? badge.bg : "bg-muted/20"
                )}>
                  {badge.threshold === 100 ? (
                    <ShieldCheck className={cn("h-7 w-7 transition-all", isUnlocked ? badge.color : "text-muted-foreground")} />
                  ) : (
                    <Flame className={cn("h-7 w-7 transition-all", isUnlocked ? badge.color + " fill-current" : "text-muted-foreground")} />
                  )}
                </div>
                <p className={cn("text-[10px] font-black uppercase text-center mb-1 tracking-tight leading-none", isUnlocked ? "text-foreground" : "text-muted-foreground")}>
                  {badge.label}
                </p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                  {badge.days} {t('days')}
                </p>
                {!isUnlocked && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[7px] font-black uppercase bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground/50 border border-border/5">
                      {t('locked')}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
