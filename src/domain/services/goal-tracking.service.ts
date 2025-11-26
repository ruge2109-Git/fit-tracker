/**
 * Goal Tracking Service
 * Automatically updates goal progress based on workout data
 */

import { goalRepository } from '../repositories/goal.repository'
import { Goal, GoalType, WorkoutWithSets, SetFormData } from '@/types'
import { logger } from '@/lib/logger'

export interface IGoalTrackingService {
  updateGoalsFromWorkout(userId: string, workout: WorkoutWithSets | { sets: SetFormData[] }): Promise<void>
  calculateWorkoutMetrics(workout: WorkoutWithSets | { sets: SetFormData[] }): WorkoutMetrics
}

interface WorkoutMetrics {
  totalVolume: number // weight * reps sum
  maxWeight: number // maximum weight lifted
  totalSets: number
  totalReps: number
  workoutCount: number // always 1 for a single workout
}

class GoalTrackingService implements IGoalTrackingService {
  /**
   * Calculate metrics from a workout
   */
  calculateWorkoutMetrics(workout: WorkoutWithSets | { sets: SetFormData[] }): WorkoutMetrics {
    const sets = 'sets' in workout ? workout.sets : []
    
    let totalVolume = 0
    let maxWeight = 0
    let totalReps = 0

    sets.forEach((set) => {
      const weight = 'weight' in set ? set.weight : 0
      const reps = 'reps' in set ? set.reps : 0
      const volume = weight * reps
      
      totalVolume += volume
      totalReps += reps
      if (weight > maxWeight) {
        maxWeight = weight
      }
    })

    return {
      totalVolume,
      maxWeight,
      totalSets: sets.length,
      totalReps,
      workoutCount: 1,
    }
  }

  /**
   * Update goals automatically based on workout data
   */
  async updateGoalsFromWorkout(userId: string, workout: WorkoutWithSets | { sets: SetFormData[] }): Promise<void> {
    try {
      // Get active goals for the user
      const activeGoalsResult = await goalRepository.findActive(userId)
      
      if (activeGoalsResult.error || !activeGoalsResult.data || activeGoalsResult.data.length === 0) {
        // No active goals, nothing to update
        return
      }

      const activeGoals = activeGoalsResult.data
      const metrics = this.calculateWorkoutMetrics(workout)

      // Process each goal type
      for (const goal of activeGoals) {
        let progressValue: number | null = null
        let notes: string | undefined

        switch (goal.type) {
          case GoalType.VOLUME:
            // Volume goal: add total volume (kg)
            if (metrics.totalVolume > 0) {
              progressValue = metrics.totalVolume
              notes = `Volumen del entrenamiento: ${metrics.totalVolume.toFixed(1)} kg`
            }
            break

          case GoalType.FREQUENCY:
            // Frequency goal: count workouts (add 1)
            progressValue = 1
            notes = 'Entrenamiento completado'
            break

          case GoalType.STRENGTH:
            // Strength goal: use max weight lifted
            if (metrics.maxWeight > 0) {
              progressValue = metrics.maxWeight
              notes = `Peso máximo levantado: ${metrics.maxWeight} ${goal.unit}`
            }
            break

          case GoalType.WEIGHT:
            // Weight goal: typically manual, but could track body weight changes
            // Skip automatic tracking for weight goals (usually body weight, not workout weight)
            continue

          case GoalType.ENDURANCE:
            // Endurance goal: could track duration or total reps
            // For now, we'll use total reps as a proxy
            if (metrics.totalReps > 0) {
              progressValue = metrics.totalReps
              notes = `Repeticiones totales: ${metrics.totalReps}`
            }
            break

          case GoalType.CUSTOM:
            // Custom goals: skip automatic tracking (user must add manually)
            continue

          default:
            continue
        }

        // Add progress if we have a value
        if (progressValue !== null && progressValue > 0) {
          await goalRepository.addProgress(goal.id, {
            value: progressValue,
            notes: notes,
          })

          // Check if goal was completed (trigger will handle this)
          const updatedGoalResult = await goalRepository.findById(goal.id)
          if (updatedGoalResult.data?.is_completed) {
            logger.info(`Goal ${goal.id} completed automatically`, 'GoalTrackingService')
            
            // Show notification if goal was just completed
            // Note: We need to check if it was already completed before
            // For now, we'll let the store handle notifications when progress is added manually
            // Automatic notifications from workouts can be added here if needed
          }
        }
      }
    } catch (error) {
      // Don't throw - goal tracking shouldn't break workout creation
      logger.error('Error updating goals from workout', error as Error, 'GoalTrackingService')
    }
  }
}

export const goalTrackingService = new GoalTrackingService()

