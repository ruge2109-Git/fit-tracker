/**
 * Workouts List Page
 * Displays all user workouts with filtering
 */

'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Plus, Search, Filter, X, Calendar, Sparkles, Clock, List, CalendarDays, ArrowUpDown } from 'lucide-react'
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

  useEffect(() => {
    if (user) {
      // Load immediately without blocking
      loadWorkouts(user.id)
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
  }, [workouts, searchTerm, startDate, endDate, minDuration, maxDuration, sortBy])


  const clearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setMinDuration('')
    setMaxDuration('')
  }

  const applySavedFilter = (filters: Record<string, any>) => {
    setSearchTerm(filters.searchTerm || '')
    setStartDate(filters.startDate || '')
    setEndDate(filters.endDate || '')
    setMinDuration(filters.minDuration || '')
    setMaxDuration(filters.maxDuration || '')
  }

  const getCurrentFilters = () => ({
    searchTerm,
    startDate,
    endDate,
    minDuration,
    maxDuration,
  })

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
        <Button 
          size="sm" 
          className="w-full sm:w-auto"
          onClick={() => router.push(ROUTES.NEW_WORKOUT)}
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('newWorkout') || 'New Workout'}</span>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <SavedFiltersManager
                type="workout"
                currentFilters={getCurrentFilters()}
                onApplyFilter={applySavedFilter}
              />
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

      {/* View Mode Toggle and Sort */}
      <div className="flex items-center justify-between gap-4">
        {viewMode === 'list' && (
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-[180px]" aria-label={t('sortBy') || 'Sort by'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">{t('sortByDateDesc') || 'Date (Newest)'}</SelectItem>
                <SelectItem value="date-asc">{t('sortByDateAsc') || 'Date (Oldest)'}</SelectItem>
                <SelectItem value="duration-desc">{t('sortByDurationDesc') || 'Duration (Longest)'}</SelectItem>
                <SelectItem value="duration-asc">{t('sortByDurationAsc') || 'Duration (Shortest)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
            <TabsList>
              <TabsTrigger value="list" aria-label={t('listView') || 'List view'}>
                <List className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('list') || 'List'}</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" aria-label={t('calendarView') || 'Calendar view'}>
                <CalendarDays className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('calendar') || 'Calendar'}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Workouts Content */}
      {viewMode === 'calendar' ? (
        <WorkoutCalendarView workouts={filteredWorkouts} />
      ) : (
        <>
          {workouts.length === 0 && isLoading ? (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
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
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
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

