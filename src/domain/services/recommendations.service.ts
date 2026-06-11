/**
 * AI Recommendations Service
 * Uses OpenAI API to generate personalized workout recommendations
 */

import { WorkoutWithSets, MuscleGroup, Exercise } from '@/types'
import { analyticsService, MuscleBalance } from './analytics.service'
import { logger } from '@/lib/logger'

export interface Recommendation {
  type: 'missing_muscle' | 'strength_progression' | 'frequency' | 'balance'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  suggestedExercises?: string[]
}

class RecommendationsService {
  /**
   * Generate recommendations based on workout history
   */
  async generateRecommendations(
    workouts: WorkoutWithSets[],
    t?: (key: string, options?: any) => string
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    try {
      // Local analysis first (doesn't need API)
      recommendations.push(...this.analyzeLocalData(workouts, t))

      // AI-powered analysis (uses OpenAI)
      const aiRecommendations = await this.getAIRecommendations(workouts, t)
      recommendations.push(...aiRecommendations)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.warn(`Failed to generate AI recommendations: ${message}`, 'RecommendationsService')
    }

    return recommendations.sort((a, b) => {
      const priorityMap = { high: 0, medium: 1, low: 2 }
      return priorityMap[a.priority] - priorityMap[b.priority]
    })
  }

  /**
   * Analyze workout data without AI
   */
  private analyzeLocalData(workouts: WorkoutWithSets[], t?: (key: string, options?: any) => string): Recommendation[] {
    const recommendations: Recommendation[] = []

    if (workouts.length === 0) return recommendations

    const muscleBalance = analyticsService.calculateMuscleBalance(workouts)
    // Sort workouts by date to find the most recent one
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const lastWorkout = new Date(sortedWorkouts[0].date)
    const daysSinceLastWorkout = Math.floor((Date.now() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24))

    // Check for missing muscle groups
    const trainedMuscles = new Set(muscleBalance.map((m) => m.muscleGroup))
    const allMuscles = Object.values(MuscleGroup)

    allMuscles.forEach((muscle) => {
      if (!trainedMuscles.has(muscle)) {
        recommendations.push({
          type: 'missing_muscle',
          title: t ? t('missingMuscle', { muscle }) : `Train ${muscle} more`,
          description: t ? t('missingMuscleDesc', { muscle }) : `You haven't trained ${muscle} recently. Consider adding exercises to maintain balanced development.`,
          priority: 'medium',
          suggestedExercises: this.getSuggestedExercisesForMuscle(muscle),
        })
      }
    })

    // Check muscle balance
    const imbalance = muscleBalance.sort((a, b) => b.tonnage - a.tonnage)
    if (imbalance.length > 0) {
      const weakest = imbalance[imbalance.length - 1]
      const strongest = imbalance[0]
      const ratio = weakest.tonnage / (strongest.tonnage || 1)

      if (ratio < 0.5) {
        recommendations.push({
          type: 'balance',
          title: t ? t('balanceMuscles') : `Balance muscle development`,
          description: t ? t('balanceMusclesDesc', { weak: weakest.muscleGroup, strong: strongest.muscleGroup }) : `${weakest.muscleGroup} volume is significantly lower than ${strongest.muscleGroup}. Consider increasing volume for ${weakest.muscleGroup}.`,
          priority: 'medium',
          suggestedExercises: this.getSuggestedExercisesForMuscle(weakest.muscleGroup),
        })
      }
    }

    // Check frequency
    if (daysSinceLastWorkout > 7) {
      recommendations.push({
        type: 'frequency',
        title: t ? t('getBackToTraining') : `Get back to training`,
        description: t ? t('getBackToTrainingDesc', { days: daysSinceLastWorkout }) : `You haven't trained in ${daysSinceLastWorkout} days. Consistency is key to building strength and muscle.`,
        priority: 'high',
      })
    } else if (workouts.length < 4) {
      recommendations.push({
        type: 'frequency',
        title: t ? t('increaseFrequency') : `Increase training frequency`,
        description: t ? t('increaseFrequencyDesc') : `Training at least 3-4 times per week helps build consistent progress.`,
        priority: 'medium',
      })
    }

    return recommendations
  }

  /**
   * Get AI-powered recommendations using OpenAI
   */
  private async getAIRecommendations(workouts: WorkoutWithSets[], t?: (key: string, options?: any) => string): Promise<Recommendation[]> {
    try {
      const metrics = analyticsService.calculateVolumeMetrics(workouts)
      const oneRMProgression = analyticsService.getOneRepMaxProgression(workouts)

      // Check if strength is progressing
      const avgProgression =
        oneRMProgression.length > 0
          ? oneRMProgression.reduce((sum, x) => sum + x.progression, 0) / oneRMProgression.length
          : 0

      const recommendations: Recommendation[] = []

      if (avgProgression > 10) {
        recommendations.push({
          type: 'strength_progression',
          title: t ? t('strengthProgressing') : `Strength is improving!`,
          description: t ? t('strengthProgressingDesc', { percent: avgProgression.toFixed(1) }) : `Your one-rep max estimates have increased by ${avgProgression.toFixed(1)}% on average. Keep up the progressive overload!`,
          priority: 'low',
        })
      } else if (avgProgression > 0 && avgProgression < 5) {
        recommendations.push({
          type: 'strength_progression',
          title: t ? t('increaseWeightGradually') : `Increase weight gradually`,
          description: t ? t('increaseWeightGraduallyDesc') : `Your strength is improving slowly. Try increasing weight by 5-10% when you can comfortably complete all reps.`,
          priority: 'medium',
        })
      } else if (avgProgression <= 0) {
        recommendations.push({
          type: 'strength_progression',
          title: t ? t('breakThroughPlateau') : `Break through plateau`,
          description: t ? t('breakThroughPlateauDesc') : `Your lifts haven't increased recently. Try changing rep ranges, reducing rest time, or varying exercises.`,
          priority: 'high',
        })
      }

      return recommendations
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error(message, undefined, 'RecommendationsService')
      return []
    }
  }

  /**
   * Get suggested exercises for a muscle group
   */
  private getSuggestedExercisesForMuscle(muscle: MuscleGroup): string[] {
    const suggestions: Record<MuscleGroup, string[]> = {
      [MuscleGroup.CHEST]: ['Bench Press', 'Incline Press', 'Cable Fly', 'Push-ups'],
      [MuscleGroup.BACK]: ['Deadlift', 'Pull-ups', 'Bent Over Row', 'Lat Pulldown'],
      [MuscleGroup.LEGS]: ['Squats', 'Leg Press', 'Lunges', 'Leg Curls'],
      [MuscleGroup.SHOULDERS]: ['Shoulder Press', 'Lateral Raise', 'Face Pulls', 'Shrugs'],
      [MuscleGroup.ARMS]: ['Bicep Curls', 'Tricep Dips', 'Hammer Curls', 'Skullcrushers'],
      [MuscleGroup.CORE]: ['Planks', 'Cable Crunches', 'Hanging Leg Raise', 'Ab Wheel'],
      [MuscleGroup.FULL_BODY]: ['Compound lifts', 'Circuit training'],
      [MuscleGroup.CARDIO]: ['Running', 'Cycling', 'Rowing', 'Jump Rope'],
    }

    return suggestions[muscle] || []
  }
}

export const recommendationsService = new RecommendationsService()
