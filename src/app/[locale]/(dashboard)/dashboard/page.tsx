/**
 * Dashboard Page
 * Overview of user's fitness progress and statistics
 */

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Activity, TrendingUp, Calendar, Target, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { statsService, VolumeByWeek, ExerciseFrequency, PersonalRecord } from '@/domain/services/stats.service'
import { WorkoutStats, MuscleGroup } from '@/types'
import { formatDuration } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { ChartSkeleton, StatsCardSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton'

// Lazy load heavy chart components for better initial load performance
const VolumeChart = dynamic(() => import('@/components/charts/volume-chart').then(mod => ({ default: mod.VolumeChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})
const MuscleGroupChart = dynamic(() => import('@/components/charts/muscle-group-chart').then(mod => ({ default: mod.MuscleGroupChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})
const TopExercisesChart = dynamic(() => import('@/components/charts/top-exercises-chart').then(mod => ({ default: mod.TopExercisesChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})
const PersonalRecordsList = dynamic(() => import('@/components/charts/personal-records-list').then(mod => ({ default: mod.PersonalRecordsList })), {
  loading: () => <CardSkeleton />,
  ssr: false,
})

import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useCompactMode } from '@/hooks/use-compact-mode'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { LayoutGrid, LayoutList } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { Routine } from '@/types'

export default function DashboardPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const { workouts, loadWorkouts } = useWorkoutStore()
  const { isCompact, toggleCompact } = useCompactMode()
  const t = useTranslations('dashboard')
  const tWorkouts = useTranslations('workouts')
  const tCommon = useTranslations('common')
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [volumeData, setVolumeData] = useState<VolumeByWeek[]>([])
  const [muscleDistribution, setMuscleDistribution] = useState<Record<MuscleGroup, number>>({} as Record<MuscleGroup, number>)
  const [topExercises, setTopExercises] = useState<ExerciseFrequency[]>([])
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [totalVolume, setTotalVolume] = useState(0)
  const [routines, setRoutines] = useState<Routine[]>([])

  const loadData = useCallback(async () => {
    if (!user) return
    
    // Don't set loading to true - show content immediately
    // Load workouts first (usually faster)
    loadWorkouts(user.id)
    
    // Load routines for calendar
    const routinesResult = await routineRepository.findByUserId(user.id)
    if (routinesResult.data) {
      setRoutines(routinesResult.data)
    }
    
    // Load all stats in parallel without blocking UI
    Promise.all([
      statsService.getUserStats(user.id),
      statsService.getVolumeByWeek(user.id, 8),
      statsService.getMuscleGroupDistribution(user.id),
      statsService.getMostFrequentExercises(user.id, 5),
      statsService.getPersonalRecords(user.id),
      statsService.getTotalVolume(user.id),
    ]).then(([
      statsResult,
      volumeResult,
      muscleResult,
      exercisesResult,
      recordsResult,
      totalVolumeResult,
    ]) => {
      // Update state as data arrives
      if (statsResult.data) setStats(statsResult.data)
      if (volumeResult.data) setVolumeData(volumeResult.data)
      if (muscleResult.data) setMuscleDistribution(muscleResult.data)
      if (exercisesResult.data) setTopExercises(exercisesResult.data)
      if (recordsResult.data) setPersonalRecords(recordsResult.data)
      if (totalVolumeResult.data) setTotalVolume(totalVolumeResult.data)
    })
  }, [user, loadWorkouts])

  useEffect(() => {
    if (user) {
      // Start loading immediately without blocking
      loadData()
    }
  }, [user, loadData])

  const recentWorkouts = useMemo(() => workouts.slice(0, 5), [workouts])
  const hasData = useMemo(() => stats || volumeData.length > 0 || topExercises.length > 0, [stats, volumeData, topExercises])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className={`${isCompact ? 'text-2xl' : 'text-4xl'} font-bold mb-2`}>
            {t('welcomeBack', { name: user?.name || '' })}
          </h1>
          <p className="text-muted-foreground">{t('fitnessOverview')}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleCompact}
                aria-label={isCompact ? 'Expand view' : 'Compact view'}
              >
                {isCompact ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <LayoutList className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCompact ? tCommon('expandView') || 'Expand view' : tCommon('compactView') || 'Compact view'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Stats Cards */}
      <div className={`grid gap-4 ${isCompact ? 'md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-2 lg:grid-cols-5'}`}>
        {!stats && totalVolume === 0 ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card className={isCompact ? 'p-3' : ''}>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isCompact ? 'pb-1' : 'pb-2'}`}>
                <CardTitle className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium`}>{t('totalWorkouts')}</CardTitle>
                <Activity className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
              </CardHeader>
              <CardContent className={isCompact ? 'pt-1' : ''}>
                <div className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold`}>{stats?.total_workouts || 0}</div>
                {!isCompact && <p className="text-xs text-muted-foreground">{t('allTime')}</p>}
              </CardContent>
            </Card>

            <Card className={isCompact ? 'p-3' : ''}>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isCompact ? 'pb-1' : 'pb-2'}`}>
                <CardTitle className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium`}>{t('totalVolume')}</CardTitle>
                <Dumbbell className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
              </CardHeader>
              <CardContent className={isCompact ? 'pt-1' : ''}>
                <div className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold`}>{totalVolume.toLocaleString()} kg</div>
                {!isCompact && <p className="text-xs text-muted-foreground">{t('weightTimesReps')}</p>}
              </CardContent>
            </Card>

            <Card className={isCompact ? 'p-3' : ''}>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isCompact ? 'pb-1' : 'pb-2'}`}>
                <CardTitle className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium`}>{t('totalDuration')}</CardTitle>
                <Calendar className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
              </CardHeader>
              <CardContent className={isCompact ? 'pt-1' : ''}>
                <div className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold`}>
                  {formatDuration(stats?.total_duration || 0)}
                </div>
                {!isCompact && <p className="text-xs text-muted-foreground">{t('timeTraining')}</p>}
              </CardContent>
            </Card>

            <Card className={isCompact ? 'p-3' : ''}>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isCompact ? 'pb-1' : 'pb-2'}`}>
                <CardTitle className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium`}>{t('totalSets')}</CardTitle>
                <TrendingUp className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
              </CardHeader>
              <CardContent className={isCompact ? 'pt-1' : ''}>
                <div className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold`}>{stats?.total_sets || 0}</div>
                {!isCompact && <p className="text-xs text-muted-foreground">{t('setsCompleted')}</p>}
              </CardContent>
            </Card>

            <Card className={isCompact ? 'p-3' : ''}>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isCompact ? 'pb-1' : 'pb-2'}`}>
                <CardTitle className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium`}>{t('avgDuration')}</CardTitle>
                <Target className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
              </CardHeader>
              <CardContent className={isCompact ? 'pt-1' : ''}>
                <div className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold`}>
                  {formatDuration(stats?.average_duration || 0)}
                </div>
                {!isCompact && <p className="text-xs text-muted-foreground">{t('perWorkout')}</p>}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Calendar Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('trainingCalendar') || 'Training Calendar'}</CardTitle>
          <CardDescription>{t('calendarDescription') || 'View your completed workouts and scheduled routines'}</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardCalendar workouts={workouts} routines={routines} />
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {volumeData.length === 0 ? (
          <ChartSkeleton />
        ) : (
          <VolumeChart data={volumeData} />
        )}
        {Object.keys(muscleDistribution).length === 0 ? (
          <ChartSkeleton />
        ) : (
          <MuscleGroupChart data={muscleDistribution} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {topExercises.length === 0 ? (
          <ChartSkeleton />
        ) : (
          <TopExercisesChart data={topExercises} />
        )}
        {personalRecords.length === 0 ? (
          <ChartSkeleton />
        ) : (
          <PersonalRecordsList data={personalRecords} />
        )}
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>{t('recentWorkouts')}</CardTitle>
              <CardDescription>{t('last5Sessions')}</CardDescription>
            </div>
            <Button onClick={() => router.push(ROUTES.NEW_WORKOUT)} size="sm" className="w-full sm:w-auto shrink-0">
              <Activity className="h-4 w-4 mr-2" />
              {t('logWorkout')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {t('noWorkoutsYet')}
              </p>
              <Button onClick={() => router.push(ROUTES.NEW_WORKOUT)}>
                <Activity className="h-4 w-4 mr-2" />
                {t('logFirstWorkout')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => router.push(ROUTES.WORKOUT_DETAIL(workout.id))}
                >
                  <div>
                    <p className="font-medium">{new Date(workout.date).toLocaleDateString()}</p>
                    {workout.notes && (
                      <p className="text-sm text-muted-foreground">{workout.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDuration(workout.duration)}</p>
                    <p className="text-xs text-muted-foreground">{t('clickToView')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

