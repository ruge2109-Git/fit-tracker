/**
 * Workout Store using Zustand
 * Manages workout state and operations
 */

import { create } from 'zustand'
import { Workout, WorkoutWithSets, SetFormData, WorkoutFormData } from '@/types'
import { workoutService } from '@/domain/services/workout.service'

interface WorkoutState {
  workouts: Workout[]
  currentWorkout: WorkoutWithSets | null
  isLoading: boolean
  error: string | null

  // Actions
  loadWorkouts: (userId: string) => Promise<void>
  loadWorkout: (id: string) => Promise<void>
  createWorkout: (userId: string, data: WorkoutFormData, sets: SetFormData[]) => Promise<string | null>
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
    set({ isLoading: true, error: null })
    const result = await workoutService.createWorkoutWithSets(userId, data, sets)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return null
    }

    // Refresh workouts list
    await get().loadWorkouts(userId)
    set({ isLoading: false })
    return result.data!.id
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
    return true
  },

  clearError: () => set({ error: null }),
}))

