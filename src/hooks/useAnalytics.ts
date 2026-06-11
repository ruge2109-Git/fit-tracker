/**
 * Analytics Hook
 * Provides workout metrics and analysis
 */

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { workoutService } from '@/domain/services/workout.service'
import { analyticsService, VolumeMetrics, OneRepMax, WorkoutTrend, MuscleBalance } from '@/domain/services/analytics.service'
import { WorkoutWithSets } from '@/types'

interface AnalyticsState {
  loading: boolean
  error?: string
  workouts: WorkoutWithSets[]
  volumeMetrics?: VolumeMetrics
  muscleBalance?: MuscleBalance[]
  oneRepMaxProgression?: OneRepMax[]
  weeklyTrend?: WorkoutTrend[]
  frequencyHeatmap?: Record<string, number>
}

export function useAnalytics() {
  const { user } = useAuthStore()
  const [state, setState] = useState<AnalyticsState>({
    loading: true,
    workouts: [],
  })

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      if (!user) return

      try {
        setState((prev) => ({ ...prev, loading: true }))

        // Fetch all workouts
        const response = await workoutService.getUserWorkouts(user.id)

        if (response.error || !response.data) {
          throw new Error(response.error || 'Failed to fetch workouts')
        }

        // Fetch full details for each workout
        const detailedWorkouts: WorkoutWithSets[] = []
        for (const basicWorkout of response.data) {
          const detailResponse = await workoutService.getWorkout(basicWorkout.id)
          if (detailResponse.data) {
            detailedWorkouts.push(detailResponse.data)
          }
        }

        // Calculate metrics
        const volumeMetrics = analyticsService.calculateVolumeMetrics(detailedWorkouts)
        const muscleBalance = analyticsService.calculateMuscleBalance(detailedWorkouts)
        const oneRepMaxProgression = analyticsService.getOneRepMaxProgression(detailedWorkouts)
        const weeklyTrend = analyticsService.calculateWeeklyTrend(detailedWorkouts)
        const frequencyHeatmap = analyticsService.getFrequencyHeatmap(detailedWorkouts)

        setState({
          loading: false,
          workouts: detailedWorkouts,
          volumeMetrics,
          muscleBalance,
          oneRepMaxProgression,
          weeklyTrend,
          frequencyHeatmap,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to analyze workouts'
        setState({
          loading: false,
          error: message,
          workouts: [],
        })
      }
    }

    fetchAndAnalyze()
  }, [user])

  return state
}
