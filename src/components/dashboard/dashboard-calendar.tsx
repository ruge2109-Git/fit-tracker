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
  const completedEvents = useMemo(() => {
    return workouts.map(workout => ({
      type: 'completed' as const,
      workout,
      date: new Date(workout.date),
    }))
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
      {/* Calendar Header */}
      <div className="space-y-4">
        {/* View Mode Selector */}
        <div className="flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={handleViewChange} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">{t('month') || 'Month'}</span>
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4" />
                <span className="hidden sm:inline">{t('week') || 'Week'}</span>
              </TabsTrigger>
              <TabsTrigger value="day" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('day') || 'Day'}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Date Header and Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl sm:text-2xl font-bold">
              {viewMode === 'day'
                ? format(currentDay, 'EEEE, d MMMM yyyy', { locale: dateLocale })
                : viewMode === 'week'
                ? `${format(startOfWeek(currentWeek, { weekStartsOn: 0 }), 'd MMM', { locale: dateLocale })} - ${format(endOfWeek(currentWeek, { weekStartsOn: 0 }), 'd MMM yyyy', { locale: dateLocale })}`
                : format(currentMonth, 'MMMM yyyy', { locale: dateLocale })
              }
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday} aria-label={t('today') || 'Go to today'}>
              {t('today') || 'Today'}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={
                viewMode === 'day' ? handlePreviousDay :
                viewMode === 'week' ? handlePreviousWeek :
                handlePreviousMonth
              } 
              aria-label={
                viewMode === 'day' ? (t('previousDay') || 'Previous day') :
                viewMode === 'week' ? (t('previousWeek') || 'Previous week') :
                (t('previousMonth') || 'Previous month')
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={
                viewMode === 'day' ? handleNextDay :
                viewMode === 'week' ? handleNextWeek :
                handleNextMonth
              } 
              aria-label={
                viewMode === 'day' ? (t('nextDay') || 'Next day') :
                viewMode === 'week' ? (t('nextWeek') || 'Next week') :
                (t('nextMonth') || 'Next month')
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className={cn("p-4", isMobile && "p-2")}>
          {viewMode === 'day' ? (
            /* Day View - Single Day */
            <div className="space-y-2">
              <div className="text-center text-sm font-medium text-muted-foreground py-1">
                {format(currentDay, 'EEEE', { locale: dateLocale })}
              </div>
              {(() => {
                const events = getEventsForDate(currentDay)
                const isToday = isSameDay(currentDay, new Date())
                const hasEvents = events.length > 0
                const completedWorkout = events.find(e => e.type === 'completed')?.workout
                const scheduledRoutines = events.filter(e => e.type === 'scheduled').map(e => e.routine!)

                return (
                  <div
                    className={cn(
                      'border rounded-lg p-4 transition-colors min-h-[300px]',
                      isToday && 'ring-2 ring-primary',
                      hasEvents && 'bg-primary/5 hover:bg-primary/10',
                      !hasEvents && 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold">
                        {format(currentDay, 'd')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(currentDay, 'MMMM yyyy', { locale: dateLocale })}
                      </div>
                    </div>
                    {hasEvents && (
                      <div className="flex-1 space-y-2 overflow-y-auto">
                        {/* Completed Workout */}
                        {completedWorkout && (
                          <div
                            className={cn(
                              "text-white rounded px-2 py-1.5 flex items-start gap-2 bg-green-600 cursor-pointer hover:bg-green-700 transition-colors text-base"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(ROUTES.WORKOUT_DETAIL(completedWorkout.id))
                            }}
                          >
                            <CheckCircle2 className="flex-shrink-0 mt-0.5 h-4 w-4" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{completedWorkout.routine_name || tCommon('workout')}</div>
                              {completedWorkout.notes && (
                                <div className="text-sm opacity-90 mt-1 line-clamp-2">{completedWorkout.notes}</div>
                              )}
                              <div className="text-sm opacity-90 mt-1">{formatDuration(completedWorkout.duration)}</div>
                            </div>
                          </div>
                        )}
                        {/* Scheduled Routines */}
                        {scheduledRoutines.map((routine, idx) => (
                          <div
                            key={routine.id}
                            className={cn(
                              "text-white rounded px-2 py-1.5 flex items-start gap-2 bg-blue-600 cursor-pointer hover:bg-blue-700 transition-colors text-base"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(ROUTES.WORKOUT_FROM_ROUTINE(routine.id))
                            }}
                          >
                            <Clock className="flex-shrink-0 mt-0.5 h-4 w-4" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{routine.name}</div>
                              {routine.description && (
                                <div className="text-sm opacity-90 mt-1 line-clamp-2">{routine.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!hasEvents && (
                      <div className="text-center text-muted-foreground py-8">
                        {t('noEvents') || 'No events for this day'}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          ) : (
            <>
              {/* Week Days Header */}
              <div className={cn("grid grid-cols-7 gap-1 mb-2", isMobile && "gap-0.5 mb-1")}>
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "text-center font-medium text-muted-foreground",
                      isMobile ? "text-xs py-1" : "text-sm py-2"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className={cn("grid grid-cols-7 gap-1", isMobile && "gap-0.5")}>
                {calendarDays.map((date, index) => {
                  const events = getEventsForDate(date)
                  const isCurrentMonth = viewMode === 'month' ? isSameMonth(date, currentMonth) : true
                  const isToday = isSameDay(date, new Date())
                  const hasEvents = events.length > 0
                  const completedWorkout = events.find(e => e.type === 'completed')?.workout
                  const scheduledRoutines = events.filter(e => e.type === 'scheduled').map(e => e.routine!)

                  return (
                    <div
                      key={index}
                      className={cn(
                        'border rounded-lg transition-colors',
                        isMobile ? 'p-1 min-h-[60px]' : viewMode === 'week' ? 'p-2 min-h-[150px]' : 'p-2 min-h-[100px]',
                        !isCurrentMonth && viewMode === 'month' && 'opacity-40',
                        isToday && 'ring-2 ring-primary',
                        hasEvents && 'bg-primary/5 hover:bg-primary/10',
                        !hasEvents && 'hover:bg-muted/50'
                      )}
                  onClick={() => {
                    if (completedWorkout) {
                      router.push(ROUTES.WORKOUT_DETAIL(completedWorkout.id))
                    } else if (scheduledRoutines.length > 0) {
                      // Navigate to routines page or create workout from routine
                      router.push(ROUTES.ROUTINES)
                    }
                  }}
                  role={hasEvents ? 'button' : undefined}
                  tabIndex={hasEvents ? 0 : undefined}
                  aria-label={
                    hasEvents
                      ? `${format(date, 'd MMMM')}: ${completedWorkout ? t('completed') || 'Completed' : scheduledRoutines.length + ' ' + (t('scheduled') || 'scheduled')}`
                      : format(date, 'd MMMM')
                  }
                  onKeyDown={(e) => {
                    if (hasEvents && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      if (completedWorkout) {
                        router.push(ROUTES.WORKOUT_DETAIL(completedWorkout.id))
                      } else if (scheduledRoutines.length > 0) {
                        router.push(ROUTES.ROUTINES)
                      }
                    }
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        isToday && 'text-primary font-bold'
                      )}
                    >
                      {format(date, 'd')}
                    </div>
                    {hasEvents && (
                      <div className={cn("flex-1 space-y-1 overflow-hidden", isMobile && "space-y-0.5")}>
                        {/* Completed Workout */}
                        {completedWorkout && (
                          <div
                            className={cn(
                              "text-white rounded px-1.5 py-0.5 flex items-center gap-1 bg-green-600 cursor-pointer hover:bg-green-700 transition-colors",
                              isMobile ? "text-xs" : viewMode === 'week' ? "text-sm" : "text-xs truncate"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(ROUTES.WORKOUT_DETAIL(completedWorkout.id))
                            }}
                          >
                            <CheckCircle2 className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
                            <span className="truncate">{completedWorkout.routine_name || tCommon('workout')}</span>
                          </div>
                        )}
                        {/* Scheduled Routines */}
                        {scheduledRoutines.map((routine, idx) => (
                          <div
                            key={routine.id}
                            className={cn(
                              "text-white rounded px-1.5 py-0.5 flex items-center gap-1 bg-blue-600 cursor-pointer hover:bg-blue-700 transition-colors",
                              isMobile ? "text-xs" : viewMode === 'week' ? "text-sm" : "text-xs truncate"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(ROUTES.WORKOUT_FROM_ROUTINE(routine.id))
                            }}
                          >
                            <Clock className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
                            <span className="truncate">{routine.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground" role="list" aria-label={t('legend') || 'Calendar legend'}>
        <div className="flex items-center gap-2" role="listitem">
          <div className="w-4 h-4 rounded border-2 border-primary" aria-hidden="true" />
          <span>{t('today') || 'Today'}</span>
        </div>
        <div className="flex items-center gap-2" role="listitem">
          <div className="w-4 h-4 rounded bg-green-600" aria-hidden="true" />
          <span>{t('completed') || 'Completed'}</span>
        </div>
        <div className="flex items-center gap-2" role="listitem">
          <div className="w-4 h-4 rounded bg-blue-600" aria-hidden="true" />
          <span>{t('scheduled') || 'Scheduled'}</span>
        </div>
      </div>
    </div>
  )
}

