'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  addCalendarDays,
  formatColombiaDayMonth,
  getTodayColombia,
  getWeekStartMondayColombia,
} from '@/lib/datetime/colombia'

interface ConsistencyHeatmapProps {
  data: Record<string, number> // date string (YYYY-MM-DD) -> volume
  className?: string
}

export function ConsistencyHeatmap({ data, className }: ConsistencyHeatmapProps) {
  const todayStr = getTodayColombia()
  const oneYearAgoStr = addCalendarDays(todayStr, -364)

  const weeks = useMemo(() => {
    const gridStartStr = getWeekStartMondayColombia(oneYearAgoStr)
    const lastWeekMondayStr = getWeekStartMondayColombia(todayStr)
    const weeksOut: string[][] = []
    let weekStart = gridStartStr
    while (weekStart <= lastWeekMondayStr) {
      const weekDays: string[] = []
      for (let i = 0; i < 7; i++) {
        weekDays.push(addCalendarDays(weekStart, i))
      }
      weeksOut.push(weekDays)
      weekStart = addCalendarDays(weekStart, 7)
    }
    return weeksOut
  }, [todayStr, oneYearAgoStr])

  const maxVolume = useMemo(() => {
    const values = Object.values(data)
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || sorted[sorted.length - 1]
    return p90 || 1
  }, [data])

  const getColorClass = (volume: number) => {
    if (volume === 0) return 'bg-muted/30 border-transparent'
    const intensity = volume / maxVolume
    if (intensity < 0.25) return 'bg-primary/20 border-primary/10'
    if (intensity < 0.5) return 'bg-primary/40 border-primary/20'
    if (intensity < 0.75) return 'bg-primary/70 border-primary/40'
    return 'bg-primary border-primary/60'
  }

  const monthLabels = useMemo(() => {
    const months: { label: string; index: number }[] = []
    let currentMonthKey = ''

    weeks.forEach((week, weekIndex) => {
      const firstDayStr = week[0]
      const monthKey = firstDayStr.slice(0, 7)
      if (monthKey !== currentMonthKey) {
        months.push({
          label: formatColombiaDayMonth(firstDayStr, 'es', { month: 'short' }),
          index: weekIndex,
        })
        currentMonthKey = monthKey
      }
    })

    return months
  }, [weeks])

  return (
    <div className={cn('flex flex-col space-y-2 select-none', className)}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-foreground">Consistencia de Entrenamiento</h3>
        <div className="flex items-center space-x-1 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
          <span>Menos</span>
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/70" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>Más</span>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-2 scrollbar-hide">
        <div className="inline-flex flex-col min-w-full">
          <div className="flex h-4 mb-1">
            <div className="w-8 shrink-0" />
            <div className="flex flex-1 relative">
              {monthLabels.map((m, i) => (
                <div
                  key={`${m.label}-${i}`}
                  className="absolute text-[10px] text-muted-foreground font-medium"
                  style={{ left: `${m.index * 13}px` }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex">
            <div className="flex flex-col justify-between w-8 pr-2 shrink-0 py-1">
              <span className="text-[9px] text-muted-foreground font-medium">L</span>
              <span className="text-[9px] text-muted-foreground font-medium">M</span>
              <span className="text-[9px] text-muted-foreground font-medium">V</span>
            </div>

            <TooltipProvider delayDuration={0}>
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((dateStr) => {
                      const volume = data[dateStr] || 0
                      const isTodayDay = dateStr === todayStr
                      const isOutOfRange = dateStr < oneYearAgoStr || dateStr > todayStr

                      return (
                        <Tooltip key={dateStr}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'w-[10px] h-[10px] rounded-[2px] border transition-colors',
                                isOutOfRange ? 'opacity-0 invisible' : getColorClass(volume),
                                isTodayDay && 'ring-1 ring-ring ring-offset-1 ring-offset-background'
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[11px] p-2">
                            <div className="font-bold">
                              {formatColombiaDayMonth(dateStr, 'es', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-muted-foreground">
                              {volume > 0
                                ? `Volumen: ${volume.toLocaleString()} kg`
                                : 'Sin entrenamiento'}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  )
}
