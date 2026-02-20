'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Award, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface OneRepMaxData {
  exercise_name: string
  one_rm: number
  date: string
}

interface OneRepMaxDisplayProps {
  data: OneRepMaxData[]
}

export function OneRepMaxDisplay({ data }: OneRepMaxDisplayProps) {
  const t = useTranslations('profile')

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-3xl border-none bg-accent/5">
        <CardHeader>
          <CardTitle className="text-lg font-bold uppercase tracking-tighter italic">{t('oneRmTitle')}</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
            {t('oneRmSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-[10px] font-bold text-muted-foreground py-8 uppercase tracking-[0.2em] opacity-30">
            {t('oneRmEmpty')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold uppercase tracking-tighter italic">{t('oneRmTitle')}</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              {t('oneRmSubtitle')}
            </CardDescription>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item, index) => (
          <div key={item.exercise_name} className="relative group">
            <div className="flex items-center justify-between p-4 bg-background/40 rounded-2xl transition-all hover:bg-background/80 border border-border/5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/5 text-primary text-[10px] font-black italic shadow-sm border border-primary/10">
                  {index + 1}
                </div>
                <div>
                  <p className="font-bold text-sm leading-none mb-1 uppercase tracking-tight italic">{item.exercise_name}</p>
                  <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                    <Calendar className="h-2.5 w-2.5" />
                    {formatDate(item.date, 'd MMM yyyy')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xl font-black italic tracking-tighter">{item.one_rm}</span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase">kg</span>
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <Award className="h-2.5 w-2.5 text-amber-500" />
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">
                    {t('personalBest')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
