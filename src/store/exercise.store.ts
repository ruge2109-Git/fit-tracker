/**
 * Exercise Store using Zustand
 * Manages exercise catalog state
 */

import { create } from 'zustand'
import { Exercise, ExerciseType, MuscleGroup, ExerciseFormData } from '@/types'
import { exerciseRepository } from '@/domain/repositories/exercise.repository'

interface ExerciseState {
  exercises: Exercise[]
  isLoading: boolean
  error: string | null
  filters: {
    type: ExerciseType | null
    muscleGroup: MuscleGroup | null
    search: string
  }

  // Actions
  loadExercises: () => Promise<void>
  searchExercises: (query: string) => Promise<void>
  filterByType: (type: ExerciseType | null) => Promise<void>
  filterByMuscleGroup: (muscleGroup: MuscleGroup | null) => Promise<void>
  createExercise: (data: ExerciseFormData) => Promise<string | null>
  clearError: () => void
  resetFilters: () => void
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  isLoading: false,
  error: null,
  filters: {
    type: null,
    muscleGroup: null,
    search: '',
  },

  loadExercises: async () => {
    set({ isLoading: true, error: null })
    const result = await exerciseRepository.findAll()

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ exercises: result.data || [], isLoading: false })
  },

  searchExercises: async (query) => {
    set({ isLoading: true, error: null, filters: { ...get().filters, search: query } })
    
    if (!query) {
      await get().loadExercises()
      return
    }

    const result = await exerciseRepository.search(query)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ exercises: result.data || [], isLoading: false })
  },

  filterByType: async (type) => {
    set({ isLoading: true, error: null, filters: { ...get().filters, type } })

    if (!type) {
      await get().loadExercises()
      return
    }

    const result = await exerciseRepository.findByType(type)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ exercises: result.data || [], isLoading: false })
  },

  filterByMuscleGroup: async (muscleGroup) => {
    set({ isLoading: true, error: null, filters: { ...get().filters, muscleGroup } })

    if (!muscleGroup) {
      await get().loadExercises()
      return
    }

    const result = await exerciseRepository.findByMuscleGroup(muscleGroup)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ exercises: result.data || [], isLoading: false })
  },

  createExercise: async (data) => {
    set({ isLoading: true, error: null })
    const result = await exerciseRepository.create(data)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return null
    }

    // Reload exercises
    await get().loadExercises()
    return result.data!.id
  },

  clearError: () => set({ error: null }),

  resetFilters: () => {
    set({
      filters: {
        type: null,
        muscleGroup: null,
        search: '',
      },
    })
    get().loadExercises()
  },
}))

// Selectors for better performance - prevents unnecessary re-renders
export const useExercises = () => useExerciseStore((state) => state.exercises)
export const useExerciseLoading = () => useExerciseStore((state) => state.isLoading)
export const useExerciseError = () => useExerciseStore((state) => state.error)
export const useExerciseActions = () => useExerciseStore((state) => ({
  loadExercises: state.loadExercises,
  searchExercises: state.searchExercises,
  filterByType: state.filterByType,
  filterByMuscleGroup: state.filterByMuscleGroup,
  createExercise: state.createExercise,
  resetFilters: state.resetFilters,
  clearError: state.clearError,
}))

