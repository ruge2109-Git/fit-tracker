/**
 * Workouts List Page
 * Displays all user workouts with filtering
 */

'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Plus, Search, Filter, X, Calendar, Sparkles, Clock, List, CalendarDays, ArrowUpDown, Dumbbell } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkoutCard } from '@/components/workouts/workout-card'
import { WorkoutCardSkeleton } from '@/components/ui/loading-skeleton'
import { WorkoutCalendarView } from '@/components/workouts/workout-calendar-view'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { SavedFiltersManager } from '@/components/filters/saved-filters-manager'
import { cn } from '@/lib/utils'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { RoutineWithExercises } from '@/types'

export default function WorkoutsPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const { workouts, loadWorkouts, isLoading } = useWorkoutStore()
  const t = useTranslations('workouts')
  const tCommon = useTranslations('common')
  const tRoutines = useTranslations('routines')
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [minDuration, setMinDuration] = useState('')
  const [maxDuration, setMaxDuration] = useState('')

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'duration-desc' | 'duration-asc'>('date-desc')
  
  // Routines for calendar
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])

  useEffect(() => {
    if (user) {
      // Load workouts
      loadWorkouts(user.id)
      
      // Load routines for calendar
      routineRepository.findByUserId(user.id).then(result => {
        if (result.data) {
          setRoutines(result.data)
        }
      })
    }
  }, [user, loadWorkouts])


  // Filter and sort workouts based on criteria
  const filteredWorkouts = useMemo(() => {
    let filtered = [...workouts]

    // Search filter (notes)
    if (searchTerm) {
      filtered = filtered.filter(workout =>
        workout.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(workout => workout.date >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(workout => workout.date <= endDate)
    }

    // Duration filter
    if (minDuration) {
      filtered = filtered.filter(workout => workout.duration >= parseInt(minDuration))
    }
    if (maxDuration) {
      filtered = filtered.filter(workout => workout.duration <= parseInt(maxDuration))
    }

    // Sort workouts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'duration-desc':
          return b.duration - a.duration
        case 'duration-asc':
          return a.duration - b.duration
        default:
          return 0
      }
    })

    return filtered
  }, [workouts, searchTerm, startDate, endDate, sortBy])


  const clearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
  }

  const applySavedFilter = (filters: Record<string, any>) => {
    setSearchTerm(filters.searchTerm || '')
    setStartDate(filters.startDate || '')
    setEndDate(filters.endDate || '')
  }

  const getCurrentFilters = () => ({
    searchTerm,
    startDate,
    endDate,
  })

  const hasActiveFilters = Boolean(searchTerm || startDate || endDate)

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-1 duration-400 px-4 sm:px-0">
      {/* Header - Compact & Styled */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60 italic mb-1">
            {t('title') || 'My Workouts'}
          </h1>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground/90">
             {t('subtitle') || 'History'}
          </h2>
        </div>
        <Button 
          onClick={() => router.push(ROUTES.NEW_WORKOUT)}
          size="sm"
          className="h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-primary text-white shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all px-6 w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          {t('newWorkout') || 'New Workout'}
        </Button>
      </div>

      {/* Filters Bar - Clean & Integrated */}
      <div className="flex flex-col gap-4">
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder={t('searchPlaceholder') || "Search notes..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 rounded-xl border-accent/10 bg-accent/5 focus:bg-background transition-all text-xs"
                />
            </div>
            
             <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                    "h-10 w-10 rounded-xl transition-all", 
                    showFilters ? "shadow-md shadow-primary/20" : "border-accent/10 bg-accent/5 hover:bg-accent/10"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
              </Button>

              <div className="flex bg-accent/5 p-1 rounded-xl h-10">
                 <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                     className={cn(
                        "h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        viewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-transparent"
                    )}
                 >
                    <List className="h-3.5 w-3.5" />
                 </Button>
                 <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className={cn(
                        "h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        viewMode === 'calendar' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-transparent"
                    )}
                 >
                    <CalendarDays className="h-3.5 w-3.5" />
                 </Button>
              </div>
          </div>

          {/* Expanded Filters */}
           {showFilters && (
              <Card className="rounded-2xl border-none bg-accent/5 shadow-inner animate-in slide-in-from-top-2 duration-200">
                <CardContent className="p-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold pl-1">From Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 rounded-lg border-accent/10 bg-background text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold pl-1">To Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9 rounded-lg border-accent/10 bg-background text-xs"
                      />
                    </div>
                    {/* Add Duration filters similarly if needed, kept simple for now */}
                     <div className="flex items-end pb-0.5">
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9 w-full text-muted-foreground hover:text-destructive transition-colors">
                                <X className="h-3.5 w-3.5 mr-2" />
                                {t('clearFilters')}
                            </Button>
                        )}
                     </div>
                  </div>
                </CardContent>
              </Card>
            )}
      </div>

     
      {/* Content Area */}
      {viewMode === 'calendar' ? (
        <WorkoutCalendarView workouts={filteredWorkouts} routines={routines} />
      ) : (
        <>
          {workouts.length === 0 && isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-300">
              {Array.from({ length: 8 }).map((_, i) => (
                 <div key={i} className="h-32 rounded-2xl bg-accent/5 animate-pulse" />
              ))}
            </div>
          ) : filteredWorkouts.length === 0 ? (
            <div className="text-center py-16 opacity-60">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Dumbbell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {workouts.length === 0 ? t('noWorkouts') : t('noWorkoutsMatchFilters')}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredWorkouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

