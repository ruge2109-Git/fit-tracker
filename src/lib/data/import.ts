/**
 * Data Import Utilities
 * Functions to import user data from JSON and CSV formats
 */

import { Workout, Exercise, Routine, WorkoutWithSets, RoutineWithExercises, Set, SetWithExercise, ExerciseType, MuscleGroup, RoutineExercise } from '@/types'
import { logger } from '@/lib/logger'
import { validateWorkout, validateExercise, validateRoutine, validateSet } from '@/lib/validation/validator'
import Papa from 'papaparse'

function isValidExerciseType(value: string): value is ExerciseType {
  return Object.values(ExerciseType).includes(value as ExerciseType)
}

function isValidMuscleGroup(value: string): value is MuscleGroup {
  return Object.values(MuscleGroup).includes(value as MuscleGroup)
}

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

function validateFileSize(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)
    return `File size exceeds limit. Maximum allowed: ${sizeMB}MB`
  }
  return null
}

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
    const sizeError = validateFileSize(file)
    if (sizeError) {
      return {
        success: false,
        errors: [sizeError],
      }
    }

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
 * Parses CSV content using papaparse for robust handling
 */
function parseCSV(csvContent: string): string[][] {
  const result = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  if (result.errors && result.errors.length > 0) {
    const errorMsg = result.errors.map((e: any) => e.message).join('; ')
    logger.warn(`CSV parsing errors: ${errorMsg}`, 'DataImport')
  }

  return result.data || []
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
            id: '',
            workout_id: workout.id,
            exercise_id: '',
            reps,
            weight,
            rest_time: restTime,
            set_order: workout.sets.length + 1,
            created_at: new Date().toISOString(),
            exercise: {
              id: '',
              name: exerciseName,
              type: ExerciseType.STRENGTH,
              muscle_group: MuscleGroup.FULL_BODY,
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
 * Imports exercises from CSV format
 */
export function importExercisesFromCSV(csvContent: string): ImportResult {
  try {
    const rows = parseCSV(csvContent)
    if (rows.length === 0) {
      return {
        success: false,
        errors: ['CSV file is empty'],
      }
    }

    const headers = rows[0]
    const exercises: Exercise[] = []
    const warnings: string[] = []

    // Expected headers: Name, Type, Muscle Group, Description
    const nameIdx = headers.findIndex((h) => h.toLowerCase().includes('name'))
    const typeIdx = headers.findIndex((h) => h.toLowerCase().includes('type'))
    const muscleIdx = headers.findIndex((h) => h.toLowerCase().includes('muscle'))
    const descIdx = headers.findIndex((h) => h.toLowerCase().includes('description') || h.toLowerCase().includes('desc'))

    if (nameIdx === -1 || typeIdx === -1 || muscleIdx === -1) {
      return {
        success: false,
        errors: ['CSV file missing required columns: Name, Type, Muscle Group'],
      }
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.length < headers.length) continue

      const name = row[nameIdx]?.trim()
      const typeStr = row[typeIdx]?.trim().toLowerCase()
      const muscleStr = row[muscleIdx]?.trim().toLowerCase()
      const description = descIdx >= 0 ? row[descIdx]?.trim() : undefined

      if (!name || !typeStr || !muscleStr) {
        warnings.push(`Row ${i + 1} skipped: Missing required fields`)
        continue
      }

      const type = normalizeExerciseType(typeStr)
      const muscleGroup = normalizeMuscleGroup(muscleStr)

      if (!type || !muscleGroup) {
        warnings.push(`Row ${i + 1} skipped: Invalid type or muscle group`)
        continue
      }

      const exercise: Exercise = {
        id: '',
        name,
        type,
        muscle_group: muscleGroup,
        description,
        created_at: new Date().toISOString(),
      }

      exercises.push(exercise)
    }

    return {
      success: true,
      data: {
        workouts: [],
        exercises,
        routines: [],
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      stats: {
        workoutsImported: 0,
        exercisesImported: exercises.length,
        routinesImported: 0,
        workoutsSkipped: 0,
        exercisesSkipped: rows.length - 1 - exercises.length,
        routinesSkipped: 0,
      },
    }
  } catch (error) {
    logger.error('Error importing exercises from CSV', error as Error, 'DataImport')
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse CSV file'],
    }
  }
}

/**
 * Imports routines from CSV format
 * CSV format: Routine Name, Description, Exercise Name, Target Sets, Target Reps, Target Weight (optional), Target Rest Time (optional)
 */
export function importRoutinesFromCSV(csvContent: string): ImportResult {
  try {
    const rows = parseCSV(csvContent)
    if (rows.length === 0) {
      return {
        success: false,
        errors: ['CSV file is empty'],
      }
    }

    const headers = rows[0]
    const routines = new Map<string, RoutineWithExercises>()
    const warnings: string[] = []

    // Expected headers: Routine Name, Description, Exercise Name, Target Sets, Target Reps, Target Weight, Target Rest Time
    const routineNameIdx = headers.findIndex((h) => h.toLowerCase().includes('routine'))
    const descIdx = headers.findIndex((h) => h.toLowerCase().includes('description'))
    const exerciseNameIdx = headers.findIndex((h) => h.toLowerCase().includes('exercise'))
    const setsIdx = headers.findIndex((h) => h.toLowerCase().includes('set'))
    const repsIdx = headers.findIndex((h) => h.toLowerCase().includes('rep'))
    const weightIdx = headers.findIndex((h) => h.toLowerCase().includes('weight'))
    const restIdx = headers.findIndex((h) => h.toLowerCase().includes('rest'))

    if (routineNameIdx === -1 || exerciseNameIdx === -1 || setsIdx === -1 || repsIdx === -1) {
      return {
        success: false,
        errors: ['CSV file missing required columns: Routine Name, Exercise Name, Target Sets, Target Reps'],
      }
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.length < headers.length) continue

      const routineName = row[routineNameIdx]?.trim()
      const description = descIdx >= 0 ? row[descIdx]?.trim() : undefined
      const exerciseName = row[exerciseNameIdx]?.trim()
      const targetSets = parseInt(row[setsIdx]?.trim() || '0', 10)
      const targetReps = parseInt(row[repsIdx]?.trim() || '0', 10)
      const targetWeight = weightIdx >= 0 ? parseFloat(row[weightIdx]?.trim() || '0') : undefined
      const targetRestTime = restIdx >= 0 ? parseInt(row[restIdx]?.trim() || '0', 10) : undefined

      if (!routineName || !exerciseName || !targetSets || !targetReps) {
        warnings.push(`Row ${i + 1} skipped: Missing required fields`)
        continue
      }

      const routineKey = routineName
      if (!routines.has(routineKey)) {
        const routine: RoutineWithExercises = {
          id: '',
          user_id: '',
          name: routineName,
          description,
          is_active: true,
          exercises: [],
          created_at: new Date().toISOString(),
        }
        routines.set(routineKey, routine)
      }

      const routine = routines.get(routineKey)!
      const routineExercise: RoutineExercise = {
        id: '',
        routine_id: routine.id,
        exercise_id: '',
        target_sets: targetSets,
        target_reps: targetReps,
        target_weight: targetWeight || undefined,
        target_rest_time: targetRestTime || undefined,
        order: routine.exercises.length + 1,
        created_at: new Date().toISOString(),
        exercise: {
          id: '',
          name: exerciseName,
          type: ExerciseType.STRENGTH,
          muscle_group: MuscleGroup.FULL_BODY,
          created_at: new Date().toISOString(),
        },
      }

      routine.exercises.push(routineExercise)
    }

    const importedRoutines = Array.from(routines.values())

    return {
      success: true,
      data: {
        workouts: [],
        exercises: [],
        routines: importedRoutines,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      stats: {
        workoutsImported: 0,
        exercisesImported: 0,
        routinesImported: importedRoutines.length,
        workoutsSkipped: 0,
        exercisesSkipped: 0,
        routinesSkipped: rows.length - 1 - importedRoutines.length,
      },
    }
  } catch (error) {
    logger.error('Error importing routines from CSV', error as Error, 'DataImport')
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse CSV file'],
    }
  }
}

function normalizeExerciseType(value: string): ExerciseType | null {
  const normalized = value.toLowerCase().trim()
  if (normalized.includes('strength') || normalized === 'str') return ExerciseType.STRENGTH
  if (normalized.includes('cardio') || normalized === 'card') return ExerciseType.CARDIO
  if (normalized.includes('mobility') || normalized === 'mob') return ExerciseType.MOBILITY
  if (normalized.includes('flexibility') || normalized === 'flex') return ExerciseType.FLEXIBILITY
  return null
}

function normalizeMuscleGroup(value: string): MuscleGroup | null {
  const normalized = value.toLowerCase().trim()
  if (normalized.includes('chest')) return MuscleGroup.CHEST
  if (normalized.includes('back')) return MuscleGroup.BACK
  if (normalized.includes('leg')) return MuscleGroup.LEGS
  if (normalized.includes('shoulder')) return MuscleGroup.SHOULDERS
  if (normalized.includes('arm')) return MuscleGroup.ARMS
  if (normalized.includes('core') || normalized.includes('abs')) return MuscleGroup.CORE
  if (normalized.includes('full') || normalized.includes('body')) return MuscleGroup.FULL_BODY
  if (normalized === 'cardio') return MuscleGroup.CARDIO
  return null
}

/**
 * Imports data from a CSV file
 */
export async function importFromCSVFile(file: File, type: 'workouts' | 'exercises' | 'routines'): Promise<ImportResult> {
  try {
    const sizeError = validateFileSize(file)
    if (sizeError) {
      return {
        success: false,
        errors: [sizeError],
      }
    }

    const text = await file.text()

    if (type === 'workouts') {
      return importWorkoutsFromCSV(text)
    }

    if (type === 'exercises') {
      return importExercisesFromCSV(text)
    }

    if (type === 'routines') {
      return importRoutinesFromCSV(text)
    }

    return {
      success: false,
      errors: [`Unknown import type: ${type}`],
    }
  } catch (error) {
    logger.error('Error reading CSV file', error as Error, 'DataImport')
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to read file'],
    }
  }
}

