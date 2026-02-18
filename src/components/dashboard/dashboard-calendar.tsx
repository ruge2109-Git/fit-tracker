/**
 * Dashboard Calendar Component
 * Displays completed workouts and scheduled routines in a calendar format
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, CalendarDays, CalendarRange } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Workout, Routine, DayOfWeek } from '@/types'
import { formatDuration } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface DashboardCalendarProps {
  workouts: Workout[]
  routines: Routine[]
}

interface CalendarEvent {
  type: 'completed' | 'scheduled'
  workout?: Workout
  routine?: Routine
  date: Date
}

export function DashboardCalendar({ workouts, routines }: DashboardCalendarProps) {
  const router = useNavigationRouter()
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const isMobile = useIsMobile()
  
  // Initialize view mode based on screen size (synchronous check)
  const getInitialViewMode = (): 'month' | 'week' | 'day' => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768 ? 'day' : 'month'
    }
    return 'month'
  }
  
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>(getInitialViewMode)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentDay, setCurrentDay] = useState(new Date())

  const dateLocale = locale === 'es' ? es : enUS

  // Get active routines with scheduled days
  const activeRoutines = useMemo(() => {
    return routines.filter(r => r.is_active && r.scheduled_days && r.scheduled_days.length > 0)
  }, [routines])

  // Map day names to day indices (0 = Sunday, 1 = Monday, etc.)
  const dayNameToIndex: Record<string, number> = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  }

  // Generate scheduled events for the current month
  const scheduledEvents = useMemo(() => {
    const events: CalendarEvent[] = []
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    activeRoutines.forEach(routine => {
      if (!routine.scheduled_days) return

      routine.scheduled_days.forEach(dayName => {
        const dayIndex = dayNameToIndex[dayName.toLowerCase()]
        
        monthDays.forEach(date => {
          const dateDayIndex = getDay(date) // 0 = Sunday, 1 = Monday, etc.
          if (dateDayIndex === dayIndex) {
            events.push({
              type: 'scheduled',
              routine,
              date,
            })
          }
        })
      })
    })

    return events
  }, [activeRoutines, currentMonth])

  // Group workouts by date
  // Parse dates carefully to avoid timezone issues
  const completedEvents = useMemo(() => {
    return workouts.map(workout => {
      // Extract date part directly to avoid timezone conversion
      let dateStr = workout.date
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]
      }
      // Create date at noon to avoid timezone shifts
      const date = new Date(dateStr + 'T12:00:00')
      return {
        type: 'completed' as const,
        workout,
        date,
      }
    })
  }, [workouts])

  // Combine all events
  const allEvents = useMemo(() => {
    const eventsMap: Record<string, CalendarEvent[]> = {}
    
    // Add completed workouts
    completedEvents.forEach(event => {
      const dateKey = format(event.date, 'yyyy-MM-dd')
      if (!eventsMap[dateKey]) {
        eventsMap[dateKey] = []
      }
      eventsMap[dateKey].push(event)
    })

    // Add scheduled routines
    scheduledEvents.forEach(event => {
      const dateKey = format(event.date, 'yyyy-MM-dd')
      if (!eventsMap[dateKey]) {
        eventsMap[dateKey] = []
      }
      // Only add if there's no completed workout for that day
      if (!eventsMap[dateKey].some(e => e.type === 'completed')) {
        eventsMap[dateKey].push(event)
      }
    })

    return eventsMap
  }, [completedEvents, scheduledEvents])

  // Get calendar days - monthly, weekly or daily view
  const calendarDays = useMemo(() => {
    if (viewMode === 'day') {
      // Daily view - single day
      return [currentDay]
    } else if (viewMode === 'week') {
      // Weekly view
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }) // Sunday
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 }) // Saturday
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    } else {
      // Monthly view for desktop
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
      
      // Add padding days from previous/next month (Sunday = 0)
      const firstDayOfWeek = getDay(monthStart) // 0 = Sunday, 1 = Monday, etc.
      const paddingStart = firstDayOfWeek // Sunday = 0, so no padding if month starts on Sunday
      
      const prevMonthEnd = new Date(monthStart)
      prevMonthEnd.setDate(0) // Last day of previous month
      
      const paddingDays: Date[] = []
      for (let i = paddingStart - 1; i >= 0; i--) {
        paddingDays.push(new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), prevMonthEnd.getDate() - i))
      }
      
      const nextMonthStart = new Date(monthEnd)
      nextMonthStart.setDate(nextMonthStart.getDate() + 1)
      const daysNeeded = 42 - (paddingDays.length + days.length) // 6 weeks * 7 days
      const paddingEnd: Date[] = []
      for (let i = 0; i < daysNeeded; i++) {
        paddingEnd.push(new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), i + 1))
      }
      
      return [...paddingDays, ...days, ...paddingEnd]
    }
  }, [currentMonth, currentWeek, currentDay, viewMode])

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1))
  }

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1))
  }

  const handlePreviousDay = () => {
    setCurrentDay(subDays(currentDay, 1))
  }

  const handleNextDay = () => {
    setCurrentDay(addDays(currentDay, 1))
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setCurrentWeek(today)
    setCurrentDay(today)
  }

  const handleViewChange = (value: string) => {
    setViewMode(value as 'month' | 'week' | 'day')
    const today = new Date()
    setCurrentMonth(today)
    setCurrentWeek(today)
    setCurrentDay(today)
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return allEvents[dateKey] || []
  }

  const weekDays = locale === 'es' 
    ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-4">
      {/* Calendar Header - Refined & Minimal */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2 px-1">
          <Tabs value={viewMode} onValueChange={handleViewChange} className="bg-accent/20 p-1 rounded-full">
            <TabsList className="bg-transparent h-8 gap-1">
              <TabsTrigger value="month" className="rounded-full h-7 text-[10px] uppercase font-bold px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {t('month')}
              </TabsTrigger>
              <TabsTrigger value="week" className="rounded-full h-7 text-[10px] uppercase font-bold px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {t('week')}
              </TabsTrigger>
              <TabsTrigger value="day" className="rounded-full h-7 text-[10px] uppercase font-bold px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {t('day')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="ghost" size="sm" onClick={handleToday} className="text-[10px] uppercase font-bold text-primary hover:bg-primary/5 rounded-full px-4">
            {t('today')}
          </Button>
        </div>

        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
            {viewMode === 'day'
              ? format(currentDay, 'MMMM d, yyyy', { locale: dateLocale })
              : viewMode === 'week'
              ? `${format(startOfWeek(currentWeek, { weekStartsOn: 0 }), 'd MMM', { locale: dateLocale })} - ${format(endOfWeek(currentWeek, { weekStartsOn: 0 }), 'd MMM', { locale: dateLocale })}`
              : format(currentMonth, 'MMMM yyyy', { locale: dateLocale })
            }
          </h2>
          <div className="flex items-center bg-accent/20 rounded-full p-1 border border-accent/10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full hover:bg-background"
              onClick={viewMode === 'day' ? handlePreviousDay : viewMode === 'week' ? handlePreviousWeek : handlePreviousMonth} 
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-3 bg-accent/30 mx-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full hover:bg-background"
              onClick={viewMode === 'day' ? handleNextDay : viewMode === 'week' ? handleNextWeek : handleNextMonth} 
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Modernized */}
      <div className="bg-background rounded-[2.5rem] p-2 md:p-6 border border-accent/20 shadow-xl shadow-accent/5">
        <CardContent className={cn("p-0", isMobile && "p-0")}>
          {viewMode === 'day' ? (
            /* Day View - Mobile Focused Agenda */
            <div className="space-y-4 px-2">
              <div className="flex flex-col items-center py-4">
                <div className="text-primary font-bold text-4xl mb-1">{format(currentDay, 'd')}</div>
                <div className="text-muted-foreground font-semibold uppercase tracking-[0.2em] text-[9px]">
                  {format(currentDay, 'EEEE', { locale: dateLocale })}
                </div>
              </div>

              {(() => {
                const events = getEventsForDate(currentDay)
                const hasEvents = events.length > 0
                const completedWorkout = events.find(e => e.type === 'completed')?.workout
                const scheduledRoutines = events.filter(e => e.type === 'scheduled').map(e => e.routine!)

                return (
                  <div className="space-y-3 min-h-[200px]">
                    {hasEvents ? (
                      <>
                        {completedWorkout && (
                          <div
                            className="bg-green-500/10 border border-green-500/20 rounded-[2rem] p-5 flex items-center gap-4 active:scale-95 transition-transform"
                            onClick={() => router.push(ROUTES.WORKOUT_DETAIL(completedWorkout.id))}
                          >
                            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter mb-0.5">
                                {t('completed') || 'Completed'}
                              </p>
                              <h3 className="font-extrabold text-base leading-tight">
                                {completedWorkout.routine_name || tCommon('workout')}
                              </h3>
                              <p className="text-xs font-medium text-muted-foreground">{formatDuration(completedWorkout.duration)}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-green-500/50" />
                          </div>
                        )}
                        {scheduledRoutines.map((routine) => (
                          <div
                            key={routine.id}
                            className="bg-blue-500/10 border border-blue-500/20 rounded-[2rem] p-5 flex items-center gap-4 active:scale-95 transition-transform"
                            onClick={() => router.push(ROUTES.WORKOUT_FROM_ROUTINE(routine.id))}
                          >
                            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                              <Clock className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mb-0.5">
                                {t('scheduled') || 'Scheduled'}
                              </p>
                              <h3 className="font-extrabold text-base leading-tight">{routine.name}</h3>
                              <p className="text-xs font-medium text-muted-foreground">
                                {routine.description || (tCommon('readyToTrain') || 'Ready?')}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-blue-500/50" />
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 opacity-40">
                        <CalendarIcon className="h-12 w-12 mb-2" />
                        <p className="text-sm font-bold">{t('noEvents')}</p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          ) : (
            <>
              {/* Week Days Header - Cleaner */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {weekDays.map((day, index) => (
                  <div key={index} className="text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Days - No border, just circles and spacing */}
              <div className="grid grid-cols-7 gap-y-4 gap-x-1">
                {calendarDays.map((date, index) => {
                  const events = getEventsForDate(date)
                  const isCurrentMonth = viewMode === 'month' ? isSameMonth(date, currentMonth) : true
                  const isToday = isSameDay(date, new Date())
                  const hasEvents = events.length > 0
                  const hasCompleted = events.some(e => e.type === 'completed')
                  const hasScheduled = events.some(e => e.type === 'scheduled')

                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex flex-col items-center justify-start min-h-[60px] relative',
                        !isCurrentMonth && 'opacity-20'
                      )}
                      onClick={() => {
                        if (isMobile) {
                          setCurrentDay(date)
                          setViewMode('day')
                        } else if (hasEvents) {
                          // Desktop behavior
                        }
                      }}
                    >
                      <div className={cn(
                        'h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all relative z-10',
                        isToday ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'hover:bg-accent',
                        !isToday && hasEvents && 'text-foreground'
                      )}>
                        {format(date, 'd')}
                      </div>
                      
                      {/* Event Dot Indicators (Native Flutter Style) */}
                      <div className="flex gap-0.5 mt-1.5 h-1.5 justify-center">
                        {hasCompleted && (
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        )}
                        {hasScheduled && !hasCompleted && (
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        )}
                      </div>

                      {/* View detail pill on wider screens (Desktop) */}
                      {!isMobile && viewMode !== 'month' && hasEvents && (
                         <div className="mt-2 w-full space-y-1 px-1">
                            {events.map((e, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  "text-[10px] font-bold px-2 py-1 rounded-lg truncate",
                                  e.type === 'completed' ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"
                                )}
                              >
                                {e.type === 'completed' ? (e.workout?.routine_name || 'Workout') : (e.routine?.name)}
                              </div>
                            ))}
                         </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </div>

      {/* Legend - Floating Style */}
      <div className="flex items-center justify-center gap-6 py-2">
        <div className="flex items-center gap-1.5 bg-accent/30 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>{t('completed')}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-accent/30 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>{t('scheduled')}</span>
        </div>
      </div>
    </div>
  )
}

