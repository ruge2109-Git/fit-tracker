/**
 * Recommendations Hook
 * Provides AI-powered workout recommendations
 */

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useTranslations } from 'next-intl'
import { workoutService } from '@/domain/services/workout.service'
import { recommendationsService, Recommendation } from '@/domain/services/recommendations.service'
import { WorkoutWithSets } from '@/types'

interface RecommendationsState {
  loading: boolean
  error?: string
  recommendations: Recommendation[]
}

export function useRecommendations() {
  const { user } = useAuthStore()
  const t = useTranslations('dashboard.recommendations')
  const [state, setState] = useState<RecommendationsState>({
    loading: true,
    recommendations: [],
  })

  useEffect(() => {
    const fetchAndRecommend = async () => {
      if (!user) return

      try {
        setState((prev) => ({ ...prev, loading: true }))

        // Fetch all workouts
        const response = await workoutService.getUserWorkouts(user.id)

        if (response.error || !response.data) {
          throw new Error(response.error || 'Failed to fetch workouts')
        }

        // Fetch full details
        const detailedWorkouts: WorkoutWithSets[] = []
        for (const basicWorkout of response.data) {
          const detailResponse = await workoutService.getWorkout(basicWorkout.id)
          if (detailResponse.data) {
            detailedWorkouts.push(detailResponse.data)
          }
        }

        // Generate recommendations with translations
        const recommendations = await recommendationsService.generateRecommendations(
          detailedWorkouts,
          t
        )

        setState({
          loading: false,
          recommendations,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate recommendations'
        setState({
          loading: false,
          error: message,
          recommendations: [],
        })
      }
    }

    fetchAndRecommend()
  }, [user, t])

  return state
}
