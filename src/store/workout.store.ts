/**
 * Workout Store using Zustand
 * Manages workout state and operations
 */

import { create } from 'zustand'
import { Workout, WorkoutWithSets, SetFormData, WorkoutFormData } from '@/types'
import { workoutService } from '@/domain/services/workout.service'
import { logAuditEvent } from '@/lib/audit/audit-helper'

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
    set({ isLoading: true, error: null })
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
      logAuditEvent({
        action: 'create_workout',
        entityType: 'workout',
        entityId: result.data.id,
        details: { date: data.date, duration: data.duration, setsCount: sets.length },
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

