/**
 * Validation Utility Functions
 * Provides helper functions for validating data using centralized schemas
 */

import { z } from 'zod'
import { logger } from '@/lib/logger'
import {
  workoutSchema,
  setSchema,
  exerciseSchema,
  routineSchema,
  workoutFormSchema,
  setFormSchema,
  exerciseFormSchema,
  routineFormSchema,
} from './schemas'
import { WorkoutFormData, SetFormData, ExerciseFormData, RoutineFormData } from '@/types'

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
  errorMessage?: string
}

/**
 * Validates workout data
 */
export function validateWorkout(data: unknown): ValidationResult<WorkoutFormData> {
  try {
    const result = workoutFormSchema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    }
    return { success: false, errors: result.error }
  } catch (error) {
    logger.error('Error validating workout', error as Error, 'Validator')
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * Validates set data
 */
export function validateSet(data: unknown): ValidationResult<SetFormData> {
  try {
    const result = setFormSchema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    }
    return { success: false, errors: result.error }
  } catch (error) {
    logger.error('Error validating set', error as Error, 'Validator')
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * Validates multiple sets
 */
export function validateSets(sets: unknown[]): ValidationResult<SetFormData[]> {
  const validatedSets: SetFormData[] = []
  const errors: string[] = []

  for (let i = 0; i < sets.length; i++) {
    const result = validateSet(sets[i])
    if (result.success && result.data) {
      validatedSets.push(result.data)
    } else {
      const errorMsg = result.errors
        ? result.errors.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        : result.errorMessage || 'Unknown error'
      errors.push(`Set ${i + 1}: ${errorMsg}`)
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errorMessage: errors.join('; '),
    }
  }

  return { success: true, data: validatedSets }
}

/**
 * Validates exercise data
 */
export function validateExercise(data: unknown): ValidationResult<ExerciseFormData> {
  try {
    const result = exerciseFormSchema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    }
    return { success: false, errors: result.error }
  } catch (error) {
    logger.error('Error validating exercise', error as Error, 'Validator')
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * Validates routine data
 */
export function validateRoutine(data: unknown): ValidationResult<RoutineFormData> {
  try {
    const result = routineFormSchema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    }
    return { success: false, errors: result.error }
  } catch (error) {
    logger.error('Error validating routine', error as Error, 'Validator')
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * Formats validation errors into a user-friendly message
 */
export function formatValidationError(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
      return `${path}${err.message}`
    })
    .join(', ')
}

/**
 * Validates data using a custom schema
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    }
    return { success: false, errors: result.error }
  } catch (error) {
    logger.error('Error validating with schema', error as Error, 'Validator')
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

