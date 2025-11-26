/**
 * Usage Statistics Component
 * Displays detailed usage statistics for the application
 */

'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Calendar, TrendingUp, Activity, Award, Clock, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { calculateUsageStats, getUsageStats, resetUsageStats, UsageStats } from '@/lib/data/usage-stats'
import { useWorkoutStore } from '@/store/workout.store'
import { useExerciseStore } from '@/store/exercise.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { useAuthStore } from '@/store/auth.store'
import { Routine } from '@/types'
import { formatDate, formatDuration } from '@/lib/utils'
import { logger } from '@/lib/logger'

export function UsageStatsComponent() {
  const t = useTranslations('usageStats')
  const tCommon = useTranslations('common')
  const { user } = useAuthStore()
  const { workouts } = useWorkoutStore()
  const { exercises } = useExerciseStore()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadRoutines()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      // Always calculate stats, even if there's no data
      // This ensures isLoading is set to false
      calculateAndSetStats()
    }
  }, [user, workouts, exercises, routines])

  const loadRoutines = async () => {
    if (!user) return
    try {
      const result = await routineRepository.findByUserId(user.id)
      if (result.data) {
        setRoutines(result.data)
      } else {
        // Set empty array if no routines found
        setRoutines([])
      }
    } catch (error) {
      logger.error('Error loading routines for stats', error as Error, 'UsageStats')
      // Set empty array on error to allow stats calculation to proceed
      setRoutines([])
    }
  }

  const calculateAndSetStats = () => {
    try {
      // Load workouts with sets for accurate stats
      const workoutsWithSets = workouts.map((w) => ({ ...w, sets: [] })) // Simplified for now
      const calculatedStats = calculateUsageStats(workoutsWithSets, exercises, routines)
      setStats(calculatedStats)
    } catch (error) {
      logger.error('Error calculating usage stats', error as Error, 'UsageStats')
      // Set stats to null on error, but still show "no data" instead of loading
      setStats(null)
    } finally {
      // Always set loading to false, even if there's an error or no data
      setIsLoading(false)
    }
  }

  const handleResetStats = () => {
    resetUsageStats()
    setStats(null)
    setResetDialogOpen(false)
    toast.success(tCommon('reset') || 'Statistics reset')
    // Recalculate stats
    if (user && workouts.length > 0) {
      calculateAndSetStats()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('title') || 'Usage Statistics'}
          </CardTitle>
          <CardDescription>{t('description') || 'Detailed statistics of your activity'}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{tCommon('loading') || 'Loading...'}</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('title') || 'Usage Statistics'}
          </CardTitle>
          <CardDescription>{t('description') || 'Detailed statistics of your activity'}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">{t('noData') || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('title') || 'Usage Statistics'}
            </CardTitle>
            <CardDescription>{t('description') || 'Detailed statistics of your activity'}</CardDescription>
          </div>
          <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {t('resetStats') || 'Reset Statistics'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('resetStats') || 'Reset Statistics'}</DialogTitle>
                <DialogDescription>{t('resetConfirm') || 'Are you sure?'}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button variant="destructive" onClick={handleResetStats}>
                  {tCommon('reset')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('totalSessions') || 'Total Sessions'}</p>
            </div>
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('lastSession') || 'Last Session'}</p>
            </div>
            <p className="text-sm font-medium">
              {stats.lastSessionDate ? formatDate(stats.lastSessionDate, 'PP') : '-'}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('currentStreak') || 'Current Streak'}</p>
            </div>
            <p className="text-2xl font-bold">
              {stats.currentStreak} <span className="text-sm font-normal">{t('days') || 'days'}</span>
            </p>
          </div>
        </div>

        {/* Workout Stats */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('workouts') || 'Workouts'}
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('totalWorkouts') || 'Total'}</p>
              <p className="text-xl font-bold">{stats.totalWorkouts}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('totalTime') || 'Total Time'}</p>
              <p className="text-xl font-bold">{formatDuration(stats.totalWorkoutTime)}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('averageDuration') || 'Average'}</p>
              <p className="text-xl font-bold">{formatDuration(Math.round(stats.averageWorkoutDuration))}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('workoutsThisWeek') || 'This Week'}</p>
              <p className="text-xl font-bold">{stats.workoutsThisWeek}</p>
            </div>
          </div>
        </div>

        {/* Exercise Stats */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            {t('exercises') || 'Exercises'}
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('totalExercises') || 'Total Exercises'}</p>
              <p className="text-xl font-bold">{stats.totalExercises}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('uniqueExercises') || 'Unique Used'}</p>
              <p className="text-xl font-bold">{stats.uniqueExercisesUsed}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('mostTrainedMuscle') || 'Most Trained'}</p>
              <p className="text-lg font-bold capitalize">
                {stats.mostTrainedMuscleGroup?.replace('_', ' ') || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('activity') || 'Activity'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('firstWorkout') || 'First Workout'}</p>
              <p className="text-sm font-medium">
                {stats.firstWorkoutDate ? formatDate(stats.firstWorkoutDate, 'PP') : '-'}
              </p>
              {stats.daysSinceFirstWorkout > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.daysSinceFirstWorkout} {t('daysSinceFirst') || 'days ago'}
                </p>
              )}
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('lastWorkout') || 'Last Workout'}</p>
              <p className="text-sm font-medium">
                {stats.lastWorkoutDate ? formatDate(stats.lastWorkoutDate, 'PP') : '-'}
              </p>
              {stats.daysSinceLastWorkout > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.daysSinceLastWorkout} {t('daysSinceLast') || 'days ago'}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

