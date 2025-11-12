/**
 * Workouts List Page
 * Displays all user workouts with filtering
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, X, Calendar } from 'lucide-react'
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

export default function WorkoutsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { workouts, loadWorkouts, isLoading } = useWorkoutStore()
  const t = useTranslations('workouts')
  const tCommon = useTranslations('common')
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [minDuration, setMinDuration] = useState('')
  const [maxDuration, setMaxDuration] = useState('')

  useEffect(() => {
    if (user) {
      // Load immediately without blocking
      loadWorkouts(user.id)
    }
  }, [user, loadWorkouts])

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

  const clearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setMinDuration('')
    setMaxDuration('')
  }

  const hasActiveFilters = searchTerm || startDate || endDate || minDuration || maxDuration

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Workouts</h1>
          <p className="text-muted-foreground">
            {workouts.length} total workout{workouts.length !== 1 ? 's' : ''} 
            {hasActiveFilters && ` (${filteredWorkouts.length} filtered)`}
          </p>
        </div>
        <Button onClick={() => router.push(ROUTES.NEW_WORKOUT)}>
          <Plus className="h-4 w-4 mr-2" />
          New Workout
        </Button>
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

