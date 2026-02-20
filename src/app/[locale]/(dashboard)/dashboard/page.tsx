/**
 * Dashboard Page
 * Overview of user's fitness progress and statistics
 */

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Activity, TrendingUp, Calendar, Target, Dumbbell, Clock } from 'lucide-react'
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
const ConsistencyHeatmap = dynamic(() => import('@/components/charts/consistency-heatmap').then(mod => ({ default: mod.ConsistencyHeatmap })), {
  ssr: false,
})
const PeriodComparison = dynamic(() => import('@/components/dashboard/period-comparison').then(mod => ({ default: mod.PeriodComparison })), {
  ssr: false,
})
const AiReportBanner = dynamic(() => import('@/components/dashboard/ai-report-banner').then(mod => ({ default: mod.AiReportBanner })), {
  ssr: false,
})
const QuickStartRoutines = dynamic(() => import('@/components/dashboard/quick-start-routines').then(mod => ({ default: mod.QuickStartRoutines })), {
  ssr: false,
})
const StreakCounter = dynamic(() => import('@/components/dashboard/streak-counter').then(mod => ({ default: mod.StreakCounter })), {
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

function EmptyChartCard({ title, message }: { title: string; message: string }) {
  return (
    <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground/70">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-2 opacity-50">
        <Dumbbell className="h-8 w-8 text-muted-foreground/40 stroke-[1.5px]" />
        <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">{message}</p>
      </CardContent>
    </Card>
  )
}

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
  const [dailyVolume, setDailyVolume] = useState<Record<string, number>>({})
  const [suggestedHour, setSuggestedHour] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

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
      statsService.getDailyVolumeForYear(user.id),
      statsService.getAdaptiveReminderHour(user.id),
    ]).then(([
      statsResult,
      volumeResult,
      muscleResult,
      exercisesResult,
      recordsResult,
      totalVolumeResult,
      dailyVolumeResult,
      hourResult,
    ]) => {
      // Update state as data arrives
      if (statsResult.data) setStats(statsResult.data)
      if (volumeResult.data) setVolumeData(volumeResult.data)
      if (muscleResult.data) setMuscleDistribution(muscleResult.data)
      if (exercisesResult.data) setTopExercises(exercisesResult.data)
      if (recordsResult.data) setPersonalRecords(recordsResult.data)
      if (totalVolumeResult.data) setTotalVolume(totalVolumeResult.data)
      if (dailyVolumeResult.data) setDailyVolume(dailyVolumeResult.data)
      if (hourResult.data) setSuggestedHour(hourResult.data.suggestedHour)
    }).finally(() => {
      setIsLoaded(true)
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
    <div className="space-y-6 pb-10">
      {/* Header - More App-like */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
            {t('welcomeBack', { name: user?.name?.split(' ')[0] || '' })}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">
            {t('fitnessOverview')}
          </p>
        </div>
        <div className="hidden md:block">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCompact}
                >
                  {isCompact ? <LayoutGrid className="h-5 w-5" /> : <LayoutList className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isCompact ? tCommon('expandView') : tCommon('compactView')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Stats - Horizontal Scroll on Mobile (Flutter-like) */}
      <div className="flex overflow-x-auto pb-4 gap-3 -mx-4 px-4 scrollbar-hide no-scrollbar md:grid md:grid-cols-5 md:pb-0 md:mx-0 md:px-0">
        {!isLoaded && !stats && totalVolume === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[140px] md:min-w-0">
              <StatsCardSkeleton />
            </div>
          ))
        ) : (
          <>
            <StatCard 
              title={t('totalWorkouts')} 
              value={stats?.total_workouts || 0} 
              icon={<Activity className="h-4 w-4" />}
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <StatCard 
              title={t('totalVolume')} 
              value={`${(totalVolume / 1000).toFixed(1)}k`} 
              unit="kg"
              icon={<Dumbbell className="h-4 w-4" />}
              color="text-purple-500"
              bg="bg-purple-500/10"
            />
            <StatCard 
              title={t('totalTime')} 
              value={formatDuration(stats?.total_duration || 0)} 
              icon={<Calendar className="h-4 w-4" />}
              color="text-orange-500"
              bg="bg-orange-500/10"
            />
            <StatCard 
              title={t('totalSets')} 
              value={stats?.total_sets || 0} 
              icon={<TrendingUp className="h-4 w-4" />}
              color="text-green-500"
              bg="bg-green-500/10"
            />
            <StatCard 
              title={t('avgDuration')} 
              value={formatDuration(stats?.average_duration || 0)} 
              icon={<Target className="h-4 w-4" />}
              color="text-pink-500"
              bg="bg-pink-500/10"
            />
          </>
        )}
      </div>

      {/* Quick Actions (Floating-like style) */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <Button 
          onClick={() => router.push(ROUTES.NEW_WORKOUT)} 
          className="h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-0.5"
        >
          <Activity className="h-5 w-5" />
          <span className="text-xs font-bold">{t('logWorkout')}</span>
        </Button>
        <Button 
          variant="secondary"
          onClick={() => router.push(ROUTES.NEW_ROUTINE)} 
          className="h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5"
        >
          <Dumbbell className="h-5 w-5" />
          <span className="text-xs font-bold">{tCommon('create') || 'Create'}</span>
        </Button>
      </div>

      {/* Quick Start Routines */}
      {user && <QuickStartRoutines userId={user.id} />}

      {/* Streak Counter */}
      {user && <StreakCounter userId={user.id} />}

      {suggestedHour !== null && (
        <div className="px-1">
          <p className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {t('reminder', { hour: suggestedHour })}
          </p>
        </div>
      )}

      {/* AI Summary Banner */}
      <AiReportBanner />

      {/* Main Content Grid */}
      <div className="grid gap-6">
        {/* Calendar Section */}
        <Card className="rounded-3xl border-none bg-accent/30 shadow-none overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('trainingCalendar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardCalendar workouts={workouts} routines={routines} />
          </CardContent>
        </Card>

        {/* Consistency Heatmap */}
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden p-6 md:p-8 bg-card flex flex-col items-center">
            <ConsistencyHeatmap data={dailyVolume} className="w-full max-w-4xl mx-auto" />
        </Card>

        {/* Period Comparison */}
        {user && <PeriodComparison userId={user.id} />}

        {/* Charts - Two columns on desktop, single on mobile */}
        <div className="grid gap-4 md:grid-cols-2">
          {!isLoaded && volumeData.length === 0
            ? <ChartSkeleton />
            : volumeData.length === 0
              ? <EmptyChartCard title="Volumen Semanal" message="Registra entrenamientos para ver tu progreso de volumen." />
              : <VolumeChart data={volumeData} />}
          {!isLoaded && Object.keys(muscleDistribution).length === 0
            ? <ChartSkeleton />
            : Object.keys(muscleDistribution).length === 0
              ? <EmptyChartCard title="Distribución Muscular" message="Completa entrenamientos para ver qué músculos trabajas más." />
              : <MuscleGroupChart data={muscleDistribution} />}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {!isLoaded && topExercises.length === 0
            ? <ChartSkeleton />
            : topExercises.length === 0
              ? <EmptyChartCard title="Ejercicios Frecuentes" message="Después de algunos entrenamientos verás tus ejercicios más frecuentes." />
              : <TopExercisesChart data={topExercises} />}
          {!isLoaded && personalRecords.length === 0
            ? <CardSkeleton />
            : personalRecords.length === 0
              ? <EmptyChartCard title="Récords Personales" message="Tus mejores levantamientos aparecerán aquí cuando registres entrenamientos." />
              : <PersonalRecordsList data={personalRecords} />}
        </div>

        {/* Recent Workouts Card */}
        <Card className="rounded-3xl border-none shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">{t('recentWorkouts')}</CardTitle>
              <CardDescription className="text-xs">{t('last5Sessions')}</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary font-bold hidden md:flex" 
              onClick={() => router.push(ROUTES.WORKOUTS)}
            >
              {tCommon('viewAll') || 'View All'}
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {recentWorkouts.length === 0 ? (
              <div className="text-center py-10 bg-accent/10 rounded-2xl mx-4 mb-4">
                <p className="text-sm text-muted-foreground">{t('noWorkoutsYet')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl hover:bg-accent/40 transition-all active:scale-[0.98] cursor-pointer mx-2"
                    onClick={() => router.push(ROUTES.WORKOUT_DETAIL(workout.id))}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {new Date(workout.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </p>
                        {workout.notes ? (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{workout.notes}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{tCommon('workout') || 'Workout'}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatDuration(workout.duration)}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                        {tCommon('view') || 'View'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, unit, icon, color, bg }: { title: string, value: string | number, unit?: string, icon: React.ReactNode, color: string, bg: string }) {
  return (
    <div className="min-w-[140px] flex-shrink-0 bg-background border border-accent/20 rounded-2xl p-4 shadow-sm md:min-w-0 md:flex-1">
      <div className={`${bg} ${color} h-8 w-8 rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-tight mb-0.5">{title}</p>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg md:text-xl font-black">{value}</span>
        {unit && <span className="text-[10px] font-bold text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}


