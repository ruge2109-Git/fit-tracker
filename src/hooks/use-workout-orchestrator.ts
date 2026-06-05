import { useWorkoutStore } from '@/store/workout.store'
import { workoutService } from '@/domain/services/workout.service'
import { statsService } from '@/domain/services/stats.service'
import { communityService } from '@/domain/services/community.service'
import { goalTrackingService } from '@/domain/services/goal-tracking.service'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import type { WorkoutFormData, SetFormData, WorkoutWithSets } from '@/types'

export function useWorkoutOrchestrator() {
  const createWorkoutStore = useWorkoutStore((s) => s.createWorkout)

  const createWorkoutWithEffects = async (
    userId: string,
    data: WorkoutFormData,
    sets: SetFormData[]
  ): Promise<string | null> => {
    const oldPRsResult = await statsService.getPersonalRecords(userId)
    const oldPRs = oldPRsResult.data || []

    const workoutId = await createWorkoutStore(userId, data, sets)
    if (!workoutId) return null

    const state = useWorkoutStore.getState()
    const workout = state.currentWorkout
    if (!workout) return workoutId

    await runSideEffects(userId, workout, oldPRs)
    return workoutId
  }

  return { createWorkoutWithEffects }
}

async function runSideEffects(
  userId: string,
  workout: WorkoutWithSets,
  oldPRs: { exercise_id: string; max_weight: number }[]
) {
  logAuditEvent({
    action: 'create_workout',
    entityType: 'workout',
    entityId: workout.id,
    details: { date: workout.date, duration: workout.duration, setsCount: workout.sets.length },
  })

  const totalVolume = workout.sets.reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0)
  communityService.createActivityEvent('workout_completed', {
    routine_name: workout.notes || 'Entrenamiento',
    volume: totalVolume,
    duration: workout.duration,
  }).catch((err) => logger.error('Error creating workout feed event', err))

  const newPRs: { name: string; weight: number }[] = []
  workout.sets.forEach((s) => {
    const oldPR = oldPRs.find((pr) => pr.exercise_id === s.exercise_id)
    if (!oldPR || s.weight > oldPR.max_weight) {
      const name = (s as any).exercise?.name || 'Ejercicio'
      if (!newPRs.some((n) => n.name === name)) {
        newPRs.push({ name, weight: s.weight })
      }
    }
  })

  newPRs.forEach((pr) => {
    toast.success(`🏆 ¡NUEVO RÉCORD!`, {
      description: `${pr.name}: ${pr.weight} kg. ¡Sigue así!`,
      duration: 6000,
    })
    communityService.createActivityEvent('pr_achieved', {
      exercise: pr.name,
      weight: pr.weight,
    }).catch((err) => logger.error('Error creating PR feed event', err))
  })

  goalTrackingService.updateGoalsFromWorkout(userId, workout).catch((error) => {
    logger.error('Error updating goals from workout', error as Error, 'WorkoutOrchestrator')
  })
}
