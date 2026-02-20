/**
 * Workout Store using Zustand
 * Manages workout state and operations
 */

import { create } from 'zustand'
import { Workout, WorkoutWithSets, SetFormData, WorkoutFormData } from '@/types'
import { workoutService } from '@/domain/services/workout.service'
import { statsService } from '@/domain/services/stats.service'
import { communityService } from '@/domain/services/community.service'
import { goalTrackingService } from '@/domain/services/goal-tracking.service'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

interface WorkoutState {
  workouts: Workout[]
  currentWorkout: WorkoutWithSets | null
  isLoading: boolean
  error: string | null

  // Actions
  loadWorkouts: (userId: string) => Promise<void>
  loadWorkout: (id: string) => Promise<void>
  createWorkout: (userId: string, data: WorkoutFormData, sets: SetFormData[]) => Promise<string | null>
  updateWorkout: (id: string, data: Partial<WorkoutFormData>) => Promise<boolean>
  deleteWorkout: (id: string) => Promise<boolean>
  clearError: () => void
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  currentWorkout: null,
  isLoading: false,
  error: null,

  loadWorkouts: async (userId) => {
    set({ isLoading: true, error: null })
    const result = await workoutService.getUserWorkouts(userId)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ workouts: result.data || [], isLoading: false })
  },

  loadWorkout: async (id) => {
    set({ isLoading: true, error: null })
    const result = await workoutService.getWorkout(id)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ currentWorkout: result.data!, isLoading: false })
  },

  createWorkout: async (userId, data, sets) => {
    // Check for PRs before creating (get old maxes)
    const oldPRsResult = await statsService.getPersonalRecords(userId)
    const oldPRs = oldPRsResult.data || []
    
    const result = await workoutService.createWorkoutWithSets(userId, data, sets)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return null
    }

    // Refresh workouts list
    await get().loadWorkouts(userId)
    set({ isLoading: false })
    
    // Log create workout event
    if (result.data) {
      const workout = result.data
      logAuditEvent({
        action: 'create_workout',
        entityType: 'workout',
        entityId: workout.id,
        details: { date: data.date, duration: data.duration, setsCount: sets.length },
      })

      // 🔥 NEW: Create Activity Feed event for workout completion
      const totalVolume = workout.sets.reduce((sum, s) => sum + (Number(s.weight) * Number(s.reps)), 0)
      communityService.createActivityEvent('workout_completed', {
        routine_name: data.notes || 'Entrenamiento',
        volume: totalVolume,
        duration: data.duration
      }).catch(err => logger.error('Error creating workout feed event', err))

      // NEW: Check for Personal Records
      const newPRs: { name: string, weight: number }[] = []
      workout.sets.forEach(s => {
        const oldPR = oldPRs.find(pr => pr.exercise_id === s.exercise_id)
        if (!oldPR || s.weight > oldPR.max_weight) {
          // New PR detected!
          // Only add if not already in the list (multiple sets of same weight in same workout)
          const name = s.exercise?.name || 'Ejercicio'
          if (!newPRs.some(n => n.name === name)) {
            newPRs.push({ name, weight: s.weight })
          }
        }
      })

      if (newPRs.length > 0) {
        newPRs.forEach(pr => {
          toast.success(`🏆 ¡NUEVO RÉCORD!`, {
            description: `${pr.name}: ${pr.weight} kg. ¡Sigue así!`,
            duration: 6000,
          })
          
          // 🔥 NEW: Create PR Feed event
          communityService.createActivityEvent('pr_achieved', {
            exercise: pr.name,
            weight: pr.weight
          }).catch(err => logger.error('Error creating PR feed event', err))
        })
        // Trigger confetti if possible (using a simple emoji for now, or I can add a dedicated component)
      }

      // Update goals automatically
      goalTrackingService.updateGoalsFromWorkout(userId, workout).catch((error) => {
        logger.error('Error updating goals from workout', error as Error, 'WorkoutStore')
      })
    }
    
    return result.data!.id
  },

  updateWorkout: async (id, data) => {
    set({ isLoading: true, error: null })
    const result = await workoutService.updateWorkout(id, data)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }

    // Update local state
    set((state) => ({
      workouts: state.workouts.map(w => w.id === id ? { ...w, ...data } : w),
      currentWorkout: state.currentWorkout?.id === id 
        ? { ...state.currentWorkout, ...data } 
        : state.currentWorkout,
      isLoading: false,
    }))
    
    // Log update workout event
    logAuditEvent({
      action: 'update_workout',
      entityType: 'workout',
      entityId: id,
      details: { changes: Object.keys(data) },
    })
    
    return true
  },

  deleteWorkout: async (id) => {
    set({ isLoading: true, error: null })
    const result = await workoutService.deleteWorkout(id)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }

    // Remove from local state
    set((state) => ({
      workouts: state.workouts.filter(w => w.id !== id),
      isLoading: false,
    }))
    
    // Log delete workout event
    logAuditEvent({
      action: 'delete_workout',
      entityType: 'workout',
      entityId: id,
    })
    
    return true
  },

  clearError: () => set({ error: null }),
}))

