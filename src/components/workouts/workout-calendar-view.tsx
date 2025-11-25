/**
 * Workout Calendar View Component
 * Displays workouts in a calendar format
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CalendarDays, CalendarRange } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Workout } from '@/types'
import { formatDuration } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface WorkoutCalendarViewProps {
  workouts: Workout[]
}

export function WorkoutCalendarView({ workouts }: WorkoutCalendarViewProps) {
  const router = useNavigationRouter()
  const t = useTranslations('workouts')
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

  // Group workouts by date
  // Parse date string directly to avoid timezone issues
  const workoutsByDate = useMemo(() => {
    const grouped: Record<string, Workout[]> = {}
    workouts.forEach(workout => {
      // Extract date part directly from string to avoid timezone conversion issues
      // If date is in format "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss", extract just the date part
      let dateKey = workout.date
      if (dateKey.includes('T')) {
        dateKey = dateKey.split('T')[0]
      }
      // Ensure it's in YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        // If not in correct format, parse it carefully
        const date = new Date(workout.date + 'T12:00:00') // Add noon to avoid timezone shifts
        dateKey = format(date, 'yyyy-MM-dd')
      }
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(workout)
    })
    return grouped
  }, [workouts])

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

  const getWorkoutsForDate = (date: Date): Workout[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return workoutsByDate[dateKey] || []
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
                const dayWorkouts = getWorkoutsForDate(currentDay)
                const isToday = isSameDay(currentDay, new Date())
                const hasWorkouts = dayWorkouts.length > 0

                return (
                  <div
                    className={cn(
                      'border rounded-lg p-4 transition-colors min-h-[300px]',
                      isToday && 'ring-2 ring-primary',
                      hasWorkouts && 'bg-primary/5 hover:bg-primary/10 cursor-pointer',
                      !hasWorkouts && 'hover:bg-muted/50'
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
                    {hasWorkouts && (
                      <div className="flex-1 space-y-2 overflow-y-auto">
                        {dayWorkouts.map((workout) => (
                          <div
                            key={workout.id}
                            className={cn(
                              "bg-primary text-primary-foreground rounded px-2 py-1.5 cursor-pointer hover:bg-primary/90 transition-colors text-base"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(ROUTES.WORKOUT_DETAIL(workout.id))
                            }}
                          >
                            <div className="font-medium truncate">{workout.routine_name || tCommon('workout')}</div>
                            {workout.notes && (
                              <div className="text-sm opacity-90 mt-1 line-clamp-2">{workout.notes}</div>
                            )}
                            <div className="text-sm opacity-90 mt-1 flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {formatDuration(workout.duration)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!hasWorkouts && (
                      <div className="text-center text-muted-foreground py-8">
                        {t('noWorkouts') || 'No workouts for this day'}
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
                  const dayWorkouts = getWorkoutsForDate(date)
                  const isCurrentMonth = viewMode === 'month' ? isSameMonth(date, currentMonth) : true
                  const isToday = isSameDay(date, new Date())
                  const hasWorkouts = dayWorkouts.length > 0

                  return (
                    <div
                      key={index}
                      className={cn(
                        'border rounded-lg transition-colors',
                        isMobile ? 'p-1 min-h-[60px]' : viewMode === 'week' ? 'p-2 min-h-[150px]' : 'p-2 min-h-[80px]',
                        !isCurrentMonth && viewMode === 'month' && 'opacity-40',
                        isToday && 'ring-2 ring-primary',
                        hasWorkouts && 'bg-primary/5 hover:bg-primary/10 cursor-pointer',
                        !hasWorkouts && 'hover:bg-muted/50'
                      )}
                  onClick={() => {
                    if (hasWorkouts && dayWorkouts.length === 1) {
                      router.push(ROUTES.WORKOUT_DETAIL(dayWorkouts[0].id))
                    }
                  }}
                  role={hasWorkouts ? 'button' : undefined}
                  tabIndex={hasWorkouts ? 0 : undefined}
                  aria-label={
                    hasWorkouts
                      ? `${format(date, 'd MMMM')}: ${dayWorkouts.length} ${t('workout') || 'workout'}${dayWorkouts.length > 1 ? 's' : ''}`
                      : format(date, 'd MMMM')
                  }
                  onKeyDown={(e) => {
                    if (hasWorkouts && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      if (dayWorkouts.length === 1) {
                        router.push(ROUTES.WORKOUT_DETAIL(dayWorkouts[0].id))
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
                    {hasWorkouts && (
                      <div className={cn("flex-1 space-y-1 overflow-hidden", isMobile && "space-y-0.5")}>
                        {dayWorkouts.slice(0, isMobile ? 2 : viewMode === 'week' ? 3 : 2).map((workout) => (
                          <div
                            key={workout.id}
                            className={cn(
                              "bg-primary text-primary-foreground rounded px-1.5 py-0.5 cursor-pointer hover:bg-primary/90 transition-colors",
                              isMobile ? "text-xs truncate" : viewMode === 'week' ? "text-sm" : "text-xs truncate"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(ROUTES.WORKOUT_DETAIL(workout.id))
                            }}
                          >
                            <span className="truncate block">{workout.routine_name || tCommon('workout')}</span>
                          </div>
                        ))}
                        {dayWorkouts.length > (isMobile ? 2 : viewMode === 'week' ? 3 : 2) && (
                          <div className={cn("text-center text-muted-foreground", isMobile ? "text-xs" : "text-xs")}>
                            +{dayWorkouts.length - (isMobile ? 2 : viewMode === 'week' ? 3 : 2)} {t('more') || 'more'}
                          </div>
                        )}
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
          <div className="w-4 h-4 rounded bg-primary/5" aria-hidden="true" />
          <span>{t('hasWorkouts') || 'Has workouts'}</span>
        </div>
      </div>
    </div>
  )
}

