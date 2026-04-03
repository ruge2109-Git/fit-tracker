'use client'

import { CalendarRange } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTranslations } from 'next-intl'
import { DayOfWeek, Routine } from '@/types'
import { normalizeRestDays } from '@/lib/streak'
import { cn } from '@/lib/utils'

const ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
]

const DAY_TO_SHORT_KEY: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'mondayShort',
  [DayOfWeek.TUESDAY]: 'tuesdayShort',
  [DayOfWeek.WEDNESDAY]: 'wednesdayShort',
  [DayOfWeek.THURSDAY]: 'thursdayShort',
  [DayOfWeek.FRIDAY]: 'fridayShort',
  [DayOfWeek.SATURDAY]: 'saturdayShort',
  [DayOfWeek.SUNDAY]: 'sundayShort',
}

function collectRoutineDays(routines: Routine[]): Set<DayOfWeek> {
  const s = new Set<DayOfWeek>()
  for (const r of routines) {
    if (!r.is_active) continue
    if (!r.scheduled_days?.length) continue
    for (const d of r.scheduled_days) s.add(d)
  }
  return s
}

interface WeeklyScheduleStripProps {
  restDays: DayOfWeek[] | undefined
  routines: Routine[]
}

export function WeeklyScheduleStrip({ restDays, routines }: WeeklyScheduleStripProps) {
  const t = useTranslations('dashboard.weeklySchedule')
  const tRoutines = useTranslations('routines')

  const restSet = normalizeRestDays(restDays as string[] | undefined)
  const routineSet = collectRoutineDays(routines)

  return (
    <Card className="rounded-3xl border-none bg-accent/25 shadow-none overflow-hidden">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarRange className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-black uppercase tracking-tight truncate">{t('title')}</span>
          </div>
        </div>

        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {ORDER.map((day) => {
              const isRest = restSet.has(day)
              const isRoutine = routineSet.has(day) && !isRest
              const short = tRoutines(DAY_TO_SHORT_KEY[day] as 'mondayShort')
              const full = tRoutines(
                day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
              )
              let label = t('badgeFree')
              if (isRest) label = t('badgeRest')
              else if (isRoutine) label = t('badgeRoutine')

              return (
                <Tooltip key={day}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl py-2 px-0.5 sm:px-1 text-center transition-colors',
                        // Descanso (racha): ámbar + borde discontinuo — no confundir con “libre”
                        isRest &&
                          'bg-amber-500/12 text-amber-950 dark:text-amber-100 border border-dashed border-amber-500/45',
                        !isRest &&
                          isRoutine &&
                          'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-sm',
                        // Día libre (sin rutina fija): verde muy suave — contraste con descanso
                        !isRest &&
                          !isRoutine &&
                          'bg-emerald-500/8 text-emerald-900 dark:text-emerald-100 border border-emerald-600/25'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[8px] sm:text-[9px] font-black uppercase leading-none mb-1',
                          isRest && 'text-amber-800/90 dark:text-amber-200',
                          !isRest && isRoutine && 'text-primary',
                          !isRest && !isRoutine && 'text-emerald-800/85 dark:text-emerald-200'
                        )}
                      >
                        {short}
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-black uppercase leading-none truncate max-w-full">
                        {label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[11px] max-w-[200px]">
                    <span className="font-bold">{full}</span>
                    <span className="block text-muted-foreground mt-0.5">{label}</span>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </TooltipProvider>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-border/10 text-[9px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-foreground/80">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-primary/45 ring-1 ring-primary/35"
              aria-hidden
            />
            {t('legendRoutine')}
          </span>
          <span className="flex items-center gap-1.5 text-amber-950/80 dark:text-amber-200/90">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-dashed border-amber-500/60 bg-amber-500/25"
              aria-hidden
            />
            {t('legendRest')}
          </span>
          <span className="flex items-center gap-1.5 text-emerald-900/85 dark:text-emerald-200/90">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-emerald-600/35 bg-emerald-500/15"
              aria-hidden
            />
            {t('legendFree')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
