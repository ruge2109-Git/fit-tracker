/**
 * Exercise Statistics Page
 * View detailed stats and progress for a specific exercise
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { ArrowLeft, TrendingUp, Weight, Target, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { statsService } from '@/domain/services/stats.service'
import { useAuthStore } from '@/store/auth.store'
import { ExerciseProgress } from '@/types'
import { ROUTES } from '@/lib/constants'
import { ExerciseMedia } from '@/components/exercises/exercise-media'
import { exerciseRepository } from '@/domain/repositories/exercise.repository'
import { Exercise } from '@/types'
import { useTranslations } from 'next-intl'
import { PlateauAlert } from '@/components/exercises/plateau-alert'

export default function ExerciseStatsPage() {
  const params = useParams()
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const t = useTranslations('exercises')
  const tCommon = useTranslations('common')
  const tWorkouts = useTranslations('workouts')
  const exerciseId = params.id as string
  
  const [progress, setProgress] = useState<ExerciseProgress | null>(null)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user && exerciseId) {
      loadStats()
      loadExercise()
    }
  }, [user, exerciseId])

  const loadStats = async () => {
    if (!user) return
    
    setIsLoading(true)
    const result = await statsService.getExerciseProgress(user.id, exerciseId)
    
    if (result.data) {
      setProgress(result.data)
    }
    setIsLoading(false)
  }

  const loadExercise = async () => {
    const result = await exerciseRepository.findById(exerciseId)
    if (result.data) {
      setExercise(result.data)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!progress || progress.dates.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back') || 'Back'}
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {t('noDataYet') || 'No data yet for this exercise'}
          </p>
          <Button onClick={() => router.push(ROUTES.NEW_WORKOUT)}>
            {tWorkouts('logWorkout') || 'Log a Workout'}
          </Button>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = progress.dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: progress.weights[index],
    reps: progress.reps[index],
    volume: progress.volume[index],
  }))

  // Calculate stats
  const maxWeight = Math.max(...progress.weights)
  const maxReps = Math.max(...progress.reps)
  const maxVolume = Math.max(...progress.volume)
  const avgWeight = Math.round(progress.weights.reduce((a, b) => a + b, 0) / progress.weights.length)
  const avgReps = Math.round(progress.reps.reduce((a, b) => a + b, 0) / progress.reps.length)
  const totalSets = progress.dates.length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back') || 'Back'}
        </Button>
      </div>

      {/* Plateau Alert */}
      <PlateauAlert exerciseId={exerciseId} />

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold">{progress.exercise_name}</h1>
        <p className="text-muted-foreground">{t('exerciseStats') || 'Exercise Statistics & Progress'}</p>
      </div>

      {/* Exercise Media */}
      {exercise && (
        <div className="max-w-2xl">
          <ExerciseMedia exercise={exercise} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('maxWeight') || 'Max Weight'}</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maxWeight} kg</div>
            <p className="text-xs text-muted-foreground">{t('personalRecord') || 'Personal record'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('maxReps') || 'Max Reps'}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maxReps}</div>
            <p className="text-xs text-muted-foreground">{t('bestSet') || 'Best set'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalSets') || 'Total Sets'}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSets}</div>
            <p className="text-xs text-muted-foreground">{t('allTime') || 'All time'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('maxVolume') || 'Max Volume'}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maxVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">kg ({t('weightTimesReps') || 'weight × reps'})</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart - Weight */}
      <Card>
        <CardHeader>
            <CardTitle>{t('weightProgression') || 'Weight Progression'}</CardTitle>
            <CardDescription>{t('weightProgressionDescription') || 'How your lift weight has progressed over time'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Weight (kg)"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Progress Chart - Volume */}
      <Card>
        <CardHeader>
            <CardTitle>{t('volumeProgression') || 'Volume Progression'}</CardTitle>
            <CardDescription>{t('volumeProgressionDescription') || 'Total volume (weight × reps) over time'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Volume (kg)"
                dot={{ fill: 'hsl(var(--chart-2))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Stats */}
      <Card>
        <CardHeader>
            <CardTitle>{t('averageStats') || 'Average Stats'}</CardTitle>
            <CardDescription>{t('averageStatsDescription') || 'Your typical performance for this exercise'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('averageWeight') || 'Average Weight'}</p>
              <p className="text-2xl font-bold">{avgWeight} kg</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('averageReps') || 'Average Reps'}</p>
              <p className="text-2xl font-bold">{avgReps}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

