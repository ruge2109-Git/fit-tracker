import { useEffect, useCallback, useRef } from 'react'

export interface WorkoutProgress {
  routineId?: string
  date: string
  duration: number
  notes: string
  sets: Array<{
    tempId?: string
    exercise_id: string
    exerciseName?: string
    reps: number
    weight: number
    rest_time: number
  }>
  workoutData?: {
    date: string
    duration: number
    notes: string
  }
  currentSet?: {
    exercise_id: string
    reps: number
    weight: number
    rest_time: number
  }
}

const STORAGE_KEY_PREFIX = 'workout_progress_'

const getStorageKey = (routineId?: string): string => {
  return routineId 
    ? `${STORAGE_KEY_PREFIX}routine_${routineId}`
    : `${STORAGE_KEY_PREFIX}new`
}

export const saveWorkoutProgress = (progress: WorkoutProgress, routineId?: string): void => {
  if (typeof window === 'undefined') return
  
  try {
    const key = getStorageKey(routineId)
    localStorage.setItem(key, JSON.stringify({
      ...progress,
      savedAt: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('Failed to save workout progress:', error)
  }
}

export const loadWorkoutProgress = (routineId?: string): WorkoutProgress | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const key = getStorageKey(routineId)
    const stored = localStorage.getItem(key)
    if (!stored) return null
    
    const progress = JSON.parse(stored) as WorkoutProgress & { savedAt: string }
    const savedAt = new Date(progress.savedAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 24) {
      clearWorkoutProgress(routineId)
      return null
    }
    
    return progress
  } catch (error) {
    console.error('Failed to load workout progress:', error)
    return null
  }
}

export const clearWorkoutProgress = (routineId?: string): void => {
  if (typeof window === 'undefined') return
  
  try {
    const key = getStorageKey(routineId)
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear workout progress:', error)
  }
}

export const useWorkoutPersistence = (
  routineId: string | undefined,
  state: {
    date: string
    duration: number
    notes: string
    sets: WorkoutProgress['sets']
  },
  onRestore?: (progress: WorkoutProgress) => void,
  skipSaving?: boolean
) => {
  const prevStateRef = useRef<string>('')
  useEffect(() => {
    const currentState = JSON.stringify({
      date: state.date,
      duration: state.duration,
      notes: state.notes,
      sets: state.sets,
    })
    
    if (skipSaving) {
      prevStateRef.current = currentState
      return
    }
    
    if (currentState !== prevStateRef.current && (state.sets.length > 0 || state.date || state.duration || state.notes)) {
      prevStateRef.current = currentState
      const progress: WorkoutProgress = {
        routineId,
        date: state.date,
        duration: state.duration,
        notes: state.notes,
        sets: state.sets,
      }
      saveWorkoutProgress(progress, routineId)
    }
  }, [state.date, state.duration, state.notes, state.sets, routineId, skipSaving])

  useEffect(() => {
    const saved = loadWorkoutProgress(routineId)
    if (saved && onRestore) {
      onRestore(saved)
    }
  }, [routineId, onRestore])

  const clearProgress = useCallback(() => {
    clearWorkoutProgress(routineId)
  }, [routineId])

  return { clearProgress }
}

