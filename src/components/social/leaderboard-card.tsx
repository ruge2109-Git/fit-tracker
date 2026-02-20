'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, TrendingUp, Dumbbell } from 'lucide-react'
import { LeaderboardEntry } from '@/domain/services/stats.service'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface LeaderboardCardProps {
  data: LeaderboardEntry[]
  isLoading?: boolean
}

export function LeaderboardCard({ data, isLoading }: LeaderboardCardProps) {
  const t = useTranslations('social')

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-none bg-accent/5 animate-pulse">
        <div className="h-48 w-full" />
      </Card>
    )
  }

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-gradient-to-b from-accent/10 to-background/50 border border-white/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              {t('weeklyLeaderboard') || 'Ranking Semanal'}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
              {t('volumeCompetition') || 'Competición por Volumen Total (kg)'}
            </CardDescription>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-6 space-y-3">
        {data.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-40">
              {t('noParticipants') || 'No hay participantes esta semana'}
            </p>
          </div>
        ) : (
          data.map((entry, index) => (
            <div
              key={entry.user_id}
              className={cn(
                "group relative flex items-center justify-between p-4 rounded-[2rem] transition-all border",
                index === 0 
                  ? "bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5" 
                  : "bg-background/40 border-border/5 hover:bg-background/80"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-2xl shadow-sm font-black text-sm italic",
                  index === 0 ? 'bg-amber-500 text-white shadow-amber-500/30' :
                  index === 1 ? 'bg-slate-300 text-slate-700' :
                  index === 2 ? 'bg-orange-400 text-white' :
                  'bg-muted/50 text-muted-foreground'
                )}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-black text-sm tracking-tight uppercase italic group-hover:text-primary transition-colors">
                    {entry.nickname}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                    <Dumbbell className="h-2.5 w-2.5" />
                    {entry.workout_count} {t('workouts') || 'entrenamientos'}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className={cn(
                    "text-xl font-black italic tracking-tighter",
                    index === 0 ? "text-amber-500" : "text-foreground"
                  )}>
                    {entry.total_volume.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase">kg</span>
                </div>
                {index === 0 && (
                  <span className="text-[7px] font-black uppercase text-amber-500 tracking-[0.2em]">
                    LEADER
                  </span>
                )}
              </div>
              
              {/* Highlight bar for first place */}
              {index === 0 && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-amber-500 rounded-r-full" />
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
