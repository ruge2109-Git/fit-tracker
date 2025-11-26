/**
 * Data Import Utilities
 * Functions to import user data from JSON and CSV formats
 */

import { Workout, Exercise, Routine, WorkoutWithSets, RoutineWithExercises, Set, SetWithExercise } from '@/types'
import { logger } from '@/lib/logger'
import { validateWorkout, validateExercise, validateRoutine, validateSet } from '@/lib/validation/validator'

export interface ImportData {
  workouts: WorkoutWithSets[]
  exercises: Exercise[]
  routines: RoutineWithExercises[]
  metadata?: {
    exportDate?: string
    version?: string
  }
}

export interface ImportResult {
  success: boolean
  data?: ImportData
  errors?: string[]
  warnings?: string[]
  stats?: {
    workoutsImported: number
    exercisesImported: number
    routinesImported: number
    workoutsSkipped: number
    exercisesSkipped: number
    routinesSkipped: number
  }
}

/**
 * Imports data from JSON format
 */
export function importFromJSON(jsonString: string): ImportResult {
  try {
    const parsed = JSON.parse(jsonString) as ImportData

    const errors: string[] = []
    const warnings: string[] = []
    const importedWorkouts: WorkoutWithSets[] = []
    const importedExercises: Exercise[] = []
    const importedRoutines: RoutineWithExercises[] = []

    let workoutsSkipped = 0
    let exercisesSkipped = 0
    let routinesSkipped = 0

    // Validate and import exercises first (workouts and routines depend on them)
    if (parsed.exercises && Array.isArray(parsed.exercises)) {
      for (const exercise of parsed.exercises) {
        const validation = validateExercise(exercise)
        if (validation.success && validation.data) {
          importedExercises.push(exercise as Exercise)
        } else {
          exercisesSkipped++
          warnings.push(`Exercise "${exercise.name || 'Unknown'}" skipped: ${validation.errorMessage || 'Invalid data'}`)
        }
      }
    }

    // Import workouts
    if (parsed.workouts && Array.isArray(parsed.workouts)) {
      for (const workout of parsed.workouts) {
        const workoutValidation = validateWorkout(workout)
        if (!workoutValidation.success) {
          workoutsSkipped++
          warnings.push(`Workout from ${workout.date || 'Unknown date'} skipped: ${workoutValidation.errorMessage || 'Invalid data'}`)
          continue
        }

        // Validate sets
        if (workout.sets && Array.isArray(workout.sets)) {
          const validSets: SetWithExercise[] = []
          for (const set of workout.sets) {
            const setValidation = validateSet(set)
            if (setValidation.success && setValidation.data) {
              validSets.push(set as SetWithExercise)
            } else {
              warnings.push(`Set in workout ${workout.date} skipped: ${setValidation.errorMessage || 'Invalid data'}`)
            }
          }
          workout.sets = validSets
        }

        importedWorkouts.push(workout as WorkoutWithSets)
      }
    }

    // Import routines
    if (parsed.routines && Array.isArray(parsed.routines)) {
      for (const routine of parsed.routines) {
        const routineValidation = validateRoutine(routine)
        if (routineValidation.success && routineValidation.data) {
          importedRoutines.push(routine as RoutineWithExercises)
        } else {
          routinesSkipped++
          warnings.push(`Routine "${routine.name || 'Unknown'}" skipped: ${routineValidation.errorMessage || 'Invalid data'}`)
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings,
        stats: {
          workoutsImported: importedWorkouts.length,
          exercisesImported: importedExercises.length,
          routinesImported: importedRoutines.length,
          workoutsSkipped,
          exercisesSkipped,
          routinesSkipped,
        },
      }
    }

    return {
      success: true,
      data: {
        workouts: importedWorkouts,
        exercises: importedExercises,
        routines: importedRoutines,
        metadata: parsed.metadata,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      stats: {
        workoutsImported: importedWorkouts.length,
        exercisesImported: importedExercises.length,
        routinesImported: importedRoutines.length,
        workoutsSkipped,
        exercisesSkipped,
        routinesSkipped,
      },
    }
  } catch (error) {
    logger.error('Error importing from JSON', error as Error, 'DataImport')
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse JSON file'],
    }
  }
}

/**
 * Imports data from a JSON file
 */
export async function importFromJSONFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    return importFromJSON(text)
  } catch (error) {
    logger.error('Error reading JSON file', error as Error, 'DataImport')
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to read file'],
    }
  }
}

/**
 * Parses CSV content (basic implementation - can be enhanced)
 */
function parseCSV(csvContent: string): string[][] {
  const rows: string[][] = []
  const lines = csvContent.split('\n')
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    const row: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    row.push(current.trim())
    rows.push(row)
  }
  
  return rows
}

/**
 * Imports workouts from CSV format
 */
export function importWorkoutsFromCSV(csvContent: string): ImportResult {
  try {
    const rows = parseCSV(csvContent)
    if (rows.length === 0) {
      return {
        success: false,
        errors: ['CSV file is empty'],
      }
    }

    const headers = rows[0]
    const workouts: WorkoutWithSets[] = []
    const errors: string[] = []
    const warnings: string[] = []

    // Expected headers: Date, Duration (min), Notes, Exercise, Sets, Reps, Weight (kg), Rest Time (sec)
    const dateIdx = headers.findIndex((h) => h.toLowerCase().includes('date'))
    const durationIdx = headers.findIndex((h) => h.toLowerCase().includes('duration'))
    const notesIdx = headers.findIndex((h) => h.toLowerCase().includes('note'))
    const exerciseIdx = headers.findIndex((h) => h.toLowerCase().includes('exercise'))
    const repsIdx = headers.findIndex((h) => h.toLowerCase().includes('rep'))
    const weightIdx = headers.findIndex((h) => h.toLowerCase().includes('weight'))
    const restTimeIdx = headers.findIndex((h) => h.toLowerCase().includes('rest'))

    if (dateIdx === -1 || durationIdx === -1) {
      return {
        success: false,
        errors: ['CSV file missing required columns: Date, Duration'],
      }
    }

    // Group rows by workout (same date)
    const workoutMap = new Map<string, WorkoutWithSets>()

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.length < headers.length) continue

      const date = row[dateIdx]?.trim()
      const duration = parseInt(row[durationIdx]?.trim() || '0', 10)
      const notes = notesIdx >= 0 ? row[notesIdx]?.trim() : undefined

      if (!date || !duration) {
        warnings.push(`Row ${i + 1} skipped: Missing date or duration`)
        continue
      }

      const workoutKey = `${date}-${duration}`
      if (!workoutMap.has(workoutKey)) {
        const workout: WorkoutWithSets = {
          id: '', // Will be generated on import
          user_id: '', // Will be set on import
          date,
          duration,
          notes,
          created_at: new Date().toISOString(),
          sets: [],
        }
        workoutMap.set(workoutKey, workout)
      }

      const workout = workoutMap.get(workoutKey)!
      if (exerciseIdx >= 0 && repsIdx >= 0 && weightIdx >= 0) {
        const exerciseName = row[exerciseIdx]?.trim()
        const reps = parseInt(row[repsIdx]?.trim() || '0', 10)
        const weight = parseFloat(row[weightIdx]?.trim() || '0')
        const restTime = restTimeIdx >= 0 ? parseInt(row[restTimeIdx]?.trim() || '0', 10) : undefined

        if (exerciseName && reps > 0) {
          const set: SetWithExercise = {
            id: '', // Will be generated on import
            workout_id: workout.id,
            exercise_id: '', // Will be resolved from exercise name
            reps,
            weight,
            rest_time: restTime,
            set_order: workout.sets.length + 1,
            created_at: new Date().toISOString(),
            exercise: {
              id: '',
              name: exerciseName,
              type: 'strength' as any,
              muscle_group: 'full_body' as any,
              created_at: new Date().toISOString(),
            },
          }
          workout.sets.push(set)
        }
      }
    }

    const importedWorkouts = Array.from(workoutMap.values())

    return {
      success: true,
      data: {
        workouts: importedWorkouts,
        exercises: [],
        routines: [],
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      stats: {
        workoutsImported: importedWorkouts.length,
        exercisesImported: 0,
        routinesImported: 0,
        workoutsSkipped: 0,
        exercisesSkipped: 0,
        routinesSkipped: 0,
      },
    }
  } catch (error) {
    logger.error('Error importing workouts from CSV', error as Error, 'DataImport')
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse CSV file'],
    }
  }
}

/**
 * Imports data from a CSV file
 */
export async function importFromCSVFile(file: File, type: 'workouts' | 'exercises' | 'routines'): Promise<ImportResult> {
  try {
    const text = await file.text()
    
    if (type === 'workouts') {
      return importWorkoutsFromCSV(text)
    }
    
    // TODO: Implement exercises and routines CSV import
    return {
      success: false,
      errors: [`CSV import for ${type} is not yet implemented`],
    }
  } catch (error) {
    logger.error('Error reading CSV file', error as Error, 'DataImport')
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to read file'],
    }
  }
}

