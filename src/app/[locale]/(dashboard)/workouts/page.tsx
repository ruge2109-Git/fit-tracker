/**
 * Workouts List Page
 * Displays all user workouts with filtering
 */

'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Plus, Search, Filter, X, Calendar, Sparkles, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { WorkoutCard } from '@/components/workouts/workout-card'
import { WorkoutCardSkeleton } from '@/components/ui/loading-skeleton'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { Routine } from '@/types'
import { toast } from 'sonner'

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

  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [startMode, setStartMode] = useState<'routine' | 'free'>('routine')
  const [routineSearch, setRoutineSearch] = useState('')
  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([])
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false)

  useEffect(() => {
    if (user) {
      // Load immediately without blocking
      loadWorkouts(user.id)
    }
  }, [user, loadWorkouts])

  const loadAvailableRoutines = useCallback(async () => {
    if (!user) return
    setIsLoadingRoutines(true)
    const result = await routineRepository.findByUserId(user.id)
    if (result.data) {
      setAvailableRoutines(result.data)
    } else if (result.error) {
      toast.error(tRoutines('failedToLoad') || 'Failed to load routine')
    }
    setIsLoadingRoutines(false)
  }, [user, tRoutines])

  useEffect(() => {
    if (startDialogOpen && user && availableRoutines.length === 0 && !isLoadingRoutines) {
      loadAvailableRoutines()
    }
  }, [startDialogOpen, user, availableRoutines.length, isLoadingRoutines, loadAvailableRoutines])

  // Filter workouts based on criteria
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

    return filtered
  }, [workouts, searchTerm, startDate, endDate, minDuration, maxDuration])

  const filteredRoutines = useMemo(() => {
    if (!routineSearch) return availableRoutines
    return availableRoutines.filter((routine) =>
      `${routine.name} ${routine.description || ''}`.toLowerCase().includes(routineSearch.toLowerCase()),
    )
  }, [availableRoutines, routineSearch])

  const handleStartRoutineWorkout = (routineId: string) => {
    setStartDialogOpen(false)
    router.push(ROUTES.WORKOUT_FROM_ROUTINE(routineId))
  }

  const handleStartFreeWorkout = () => {
    setStartDialogOpen(false)
    router.push(ROUTES.NEW_WORKOUT)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setMinDuration('')
    setMaxDuration('')
  }

  const hasActiveFilters = searchTerm || startDate || endDate || minDuration || maxDuration

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('title') || 'My Workouts'}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('subtitle') || 'Track your training sessions'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {hasActiveFilters
              ? `${filteredWorkouts.length}/${workouts.length} ${tCommon('workouts').toLowerCase()}`
              : `${workouts.length} ${tCommon('workouts').toLowerCase()}`}
          </p>
        </div>
        <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('newWorkout') || 'New Workout'}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            <DialogDescription className="sr-only">
              {t('quickStartDescription') || 'Choose a routine template or start a free session.'}
            </DialogDescription>
            <div className="flex flex-col md:flex-row">
              <div className="bg-primary/5 p-6 md:w-5/12 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary text-primary-foreground p-2">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-primary/80">
                      {t('newWorkout') || 'New Workout'}
                    </p>
                    <h3 className="text-lg font-semibold">{t('createWorkout') || 'Create Workout'}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('quickStartDescription') || 'Choose a routine template or start a free session.'}
                </p>
                <div className="rounded-xl border border-dashed border-primary/30 p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{t('startFromRoutine') || 'Start from a routine'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{t('freeWorkout') || 'Free workout'}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 space-y-4">
                <DialogHeader className="pb-2">
                  <DialogTitle>{t('newWorkout') || 'New Workout'}</DialogTitle>
                  <DialogDescription>
                    {t('quickStartDescription') || 'Choose how you want to train today'}
                  </DialogDescription>
                </DialogHeader>
                <Tabs value={startMode} onValueChange={(value) => setStartMode(value as 'routine' | 'free')}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="routine">{t('startFromRoutine') || 'Use a routine'}</TabsTrigger>
                    <TabsTrigger value="free">{t('freeWorkout') || 'Free workout'}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="routine" className="space-y-4 pt-4">
                    <Input
                      placeholder={t('searchRoutinePlaceholder') || 'Search routine by name'}
                      value={routineSearch}
                      onChange={(e) => setRoutineSearch(e.target.value)}
                    />
                    <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                      {isLoadingRoutines ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
                        </div>
                      ) : filteredRoutines.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                          {availableRoutines.length === 0
                            ? tRoutines('noRoutines') || 'No routines yet'
                            : t('noRoutinesMatchSearch') || 'No routines match your search'}
                        </div>
                      ) : (
                        filteredRoutines.map((routine) => (
                          <button
                            key={routine.id}
                            type="button"
                            onClick={() => handleStartRoutineWorkout(routine.id)}
                            className="w-full rounded-xl border border-muted bg-background p-4 text-left transition hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold">{routine.name}</p>
                                {routine.description && (
                                  <p className="text-sm text-muted-foreground">{routine.description}</p>
                                )}
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                <p>
                                  {(routine.scheduled_days?.length || 0)} {tRoutines('days') || 'days'}
                                </p>
                                {routine.is_active && (
                                  <p className="font-medium text-emerald-600">
                                    {tCommon('active') || 'Active'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="free" className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      {t('freeWorkoutDescription') ||
                        'Start a blank workout, add exercises on the fly, and track each set manually.'}
                    </p>
                    <Button className="w-full" onClick={handleStartFreeWorkout}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t('startFreeWorkout') || 'Start free workout'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs">
                    {[searchTerm, startDate, endDate, minDuration, maxDuration].filter(Boolean).length}
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    From Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    To Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minDuration">Min Duration (min)</Label>
                  <Input
                    id="minDuration"
                    type="number"
                    placeholder="e.g. 30"
                    value={minDuration}
                    onChange={(e) => setMinDuration(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDuration">Max Duration (min)</Label>
                  <Input
                    id="maxDuration"
                    type="number"
                    placeholder="e.g. 120"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workouts Grid */}
      {workouts.length === 0 && isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
          {Array.from({ length: 6 }).map((_, i) => (
            <WorkoutCardSkeleton key={i} />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t('noWorkouts') || 'No workouts yet'}</p>
          <Button onClick={() => router.push(ROUTES.NEW_WORKOUT)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('createFirst') || 'Create Your First Workout'}
          </Button>
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {t('noWorkoutsMatchFilters') || 'No workouts match your filters'}
          </p>
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            {t('clearFilters') || 'Clear Filters'}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      )}
    </div>
  )
}

