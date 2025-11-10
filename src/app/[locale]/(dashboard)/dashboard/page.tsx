/**
 * Dashboard Page
 * Overview of user's fitness progress and statistics
 */

'use client'

import { useEffect, useState } from 'react'
import { Activity, TrendingUp, Calendar, Target, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { statsService, VolumeByWeek, ExerciseFrequency, PersonalRecord } from '@/domain/services/stats.service'
import { WorkoutStats, MuscleGroup } from '@/types'
import { formatDuration } from '@/lib/utils'
import { VolumeChart } from '@/components/charts/volume-chart'
import { MuscleGroupChart } from '@/components/charts/muscle-group-chart'
import { TopExercisesChart } from '@/components/charts/top-exercises-chart'
import { PersonalRecordsList } from '@/components/charts/personal-records-list'
import { ChartSkeleton, StatsCardSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { workouts, loadWorkouts } = useWorkoutStore()
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [volumeData, setVolumeData] = useState<VolumeByWeek[]>([])
  const [muscleDistribution, setMuscleDistribution] = useState<Record<MuscleGroup, number>>({} as Record<MuscleGroup, number>)
  const [topExercises, setTopExercises] = useState<ExerciseFrequency[]>([])
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [totalVolume, setTotalVolume] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      // Start loading immediately without blocking
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    // Don't set loading to true - show content immediately
    // Load workouts first (usually faster)
    loadWorkouts(user.id)
    
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
  }

  const recentWorkouts = workouts.slice(0, 5)
  const hasData = stats || volumeData.length > 0 || topExercises.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Here's your fitness overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_workouts || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVolume.toLocaleString()} kg</div>
                <p className="text-xs text-muted-foreground">Weight × Reps</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(stats?.total_duration || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Time training</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_sets || 0}</div>
                <p className="text-xs text-muted-foreground">Sets completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(stats?.average_duration || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Per workout</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your last 5 training sessions</CardDescription>
            </div>
            <Button onClick={() => router.push(ROUTES.NEW_WORKOUT)} size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Log Workout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No workouts yet. Start tracking your fitness journey!
              </p>
              <Button onClick={() => router.push(ROUTES.NEW_WORKOUT)}>
                <Activity className="h-4 w-4 mr-2" />
                Log Your First Workout
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
                    <p className="text-xs text-muted-foreground">Click to view</p>
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

