'use client'

import React, { useMemo } from 'react'
import { 
  format, 
  eachDayOfInterval, 
  subDays, 
  startOfToday, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  eachWeekOfInterval,
  isToday,
  parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ConsistencyHeatmapProps {
  data: Record<string, number> // date string (YYYY-MM-DD) -> volume
  className?: string
}

export function ConsistencyHeatmap({ data, className }: ConsistencyHeatmapProps) {
  const today = startOfToday()
  const oneYearAgo = subDays(today, 364) // 365 days including today

  // Generate all days in the last year
  const days = useMemo(() => {
    return eachDayOfInterval({ start: oneYearAgo, end: today })
  }, [oneYearAgo, today])

  // Group days by week (for the grid columns)
  // We want columns of 7 days (rows)
  const weeks = useMemo(() => {
    const startDate = startOfWeek(oneYearAgo, { weekStartsOn: 1 }) // Start on Monday
    const endDate = endOfWeek(today, { weekStartsOn: 1 })
    const interval = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 })
    
    return interval.map(weekStart => {
      const weekEnd = subDays(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000), 1)
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    })
  }, [oneYearAgo, today])

  // Get max volume for color scaling (clamped to avoid outliers ruining the visualization)
  const maxVolume = useMemo(() => {
    const values = Object.values(data)
    if (values.length === 0) return 0
    // Use the 90th percentile instead of max to handle outliers
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

  // Month labels positioning
  const monthLabels = useMemo(() => {
    const months: { label: string; index: number }[] = []
    let currentMonth = -1
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0]
      const month = firstDayOfWeek.getMonth()
      if (month !== currentMonth) {
        months.push({
          label: format(firstDayOfWeek, 'MMM', { locale: es }),
          index: weekIndex
        })
        currentMonth = month
      }
    })
    
    return months
  }, [weeks])

  return (
    <div className={cn("flex flex-col space-y-2 select-none", className)}>
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
          {/* Month labels */}
          <div className="flex h-4 mb-1">
            <div className="w-8 shrink-0" /> {/* Spacer for day labels */}
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
            {/* Day labels */}
            <div className="flex flex-col justify-between w-8 pr-2 shrink-0 py-1">
              <span className="text-[9px] text-muted-foreground font-medium">L</span>
              <span className="text-[9px] text-muted-foreground font-medium">M</span>
              <span className="text-[9px] text-muted-foreground font-medium">V</span>
            </div>

            {/* Grid */}
            <TooltipProvider delayDuration={0}>
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIdx) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const volume = data[dateStr] || 0
                      const isTodayDay = isToday(day)
                      const isOutOfRange = day < oneYearAgo || day > today

                      return (
                        <Tooltip key={dateStr}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "w-[10px] h-[10px] rounded-[2px] border transition-colors",
                                isOutOfRange ? "opacity-0 invisible" : getColorClass(volume),
                                isTodayDay && "ring-1 ring-ring ring-offset-1 ring-offset-background"
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[11px] p-2">
                             <div className="font-bold">{format(day, 'd MMMM, yyyy', { locale: es })}</div>
                             <div className="text-muted-foreground">
                               {volume > 0 
                                 ? `Volumen: ${volume.toLocaleString()} kg` 
                                 : "Sin entrenamiento"}
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
