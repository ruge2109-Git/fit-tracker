/**
 * Centralized Validation Schemas
 * Strict validation schemas for all data types using Zod
 */

import { z } from 'zod'
import { ExerciseType, MuscleGroup, RoutineFrequency, DayOfWeek } from '@/types'

// Date validation helper
const dateStringSchema = z.string().refine(
  (val) => {
    const date = new Date(val)
    return !isNaN(date.getTime())
  },
  { message: 'Invalid date format' }
)

// Workout validation schemas
export const workoutDateSchema = dateStringSchema.refine(
  (val) => {
    const date = new Date(val)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return date <= today
  },
  { message: 'Workout date cannot be in the future' }
)

export const workoutDurationSchema = z.coerce
  .number()
  .int('Duration must be an integer')
  .min(1, 'Duration must be at least 1 minute')
  .max(1440, 'Duration cannot exceed 24 hours (1440 minutes)')

export const workoutNotesSchema = z
  .string()
  .max(5000, 'Notes cannot exceed 5000 characters')
  .optional()

export const workoutSchema = z.object({
  date: workoutDateSchema,
  duration: workoutDurationSchema,
  notes: workoutNotesSchema,
  routine_id: z.string().uuid('Invalid routine ID').optional(),
})

export const workoutFormSchema = workoutSchema

// Set validation schemas
export const setRepsSchema = z.coerce
  .number()
  .int('Reps must be an integer')
  .min(1, 'Reps must be at least 1')
  .max(1000, 'Reps cannot exceed 1000')

export const setWeightSchema = z.coerce
  .number()
  .min(0, 'Weight cannot be negative')
  .max(1000, 'Weight cannot exceed 1000 kg')
  .refine((val) => {
    // Allow up to 2 decimal places
    return Number(val.toFixed(2)) === val
  }, 'Weight can have at most 2 decimal places')

export const setRestTimeSchema = z.coerce
  .number()
  .int('Rest time must be an integer')
  .min(0, 'Rest time cannot be negative')
  .max(3600, 'Rest time cannot exceed 1 hour (3600 seconds)')
  .optional()

export const setSchema = z.object({
  exercise_id: z.string().uuid('Invalid exercise ID'),
  reps: setRepsSchema,
  weight: setWeightSchema,
  rest_time: setRestTimeSchema,
})

export const setFormSchema = setSchema

// Exercise validation schemas
export const exerciseNameSchema = z
  .string()
  .min(2, 'Exercise name must be at least 2 characters')
  .max(100, 'Exercise name cannot exceed 100 characters')
  .trim()

export const exerciseTypeSchema = z.nativeEnum(ExerciseType, {
  errorMap: () => ({ message: 'Invalid exercise type' }),
})

export const muscleGroupSchema = z.nativeEnum(MuscleGroup, {
  errorMap: () => ({ message: 'Invalid muscle group' }),
})

export const exerciseDescriptionSchema = z
  .string()
  .max(2000, 'Description cannot exceed 2000 characters')
  .optional()

export const exerciseSchema = z.object({
  name: exerciseNameSchema,
  type: exerciseTypeSchema,
  muscle_group: muscleGroupSchema,
  description: exerciseDescriptionSchema,
})

export const exerciseFormSchema = exerciseSchema

// Routine validation schemas
export const routineNameSchema = z
  .string()
  .min(2, 'Routine name must be at least 2 characters')
  .max(100, 'Routine name cannot exceed 100 characters')
  .trim()

export const routineDescriptionSchema = z
  .string()
  .max(2000, 'Description cannot exceed 2000 characters')
  .optional()

export const routineFrequencySchema = z.nativeEnum(RoutineFrequency).optional()

export const dayOfWeekSchema = z.nativeEnum(DayOfWeek)

export const routineExerciseSchema = z.object({
  exercise_id: z.string().uuid('Invalid exercise ID'),
  target_sets: z.coerce
    .number()
    .int('Target sets must be an integer')
    .min(1, 'Target sets must be at least 1')
    .max(50, 'Target sets cannot exceed 50'),
  target_reps: z.coerce
    .number()
    .int('Target reps must be an integer')
    .min(1, 'Target reps must be at least 1')
    .max(1000, 'Target reps cannot exceed 1000'),
  target_weight: z.coerce
    .number()
    .min(0, 'Target weight cannot be negative')
    .max(1000, 'Target weight cannot exceed 1000 kg')
    .optional(),
})

export const routineSchema = z.object({
  name: routineNameSchema,
  description: routineDescriptionSchema,
  frequency: routineFrequencySchema,
  scheduled_days: z.array(dayOfWeekSchema).max(7, 'Cannot schedule more than 7 days').optional(),
  exercises: z
    .array(routineExerciseSchema)
    .min(1, 'Routine must have at least one exercise')
    .max(100, 'Routine cannot have more than 100 exercises'),
})

export const routineFormSchema = routineSchema

// User validation schemas
export const userEmailSchema = z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters')

export const userNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name cannot exceed 100 characters')
  .trim()

export const userPasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Feedback validation schemas
export const feedbackSubjectSchema = z
  .string()
  .min(1, 'Subject is required')
  .max(200, 'Subject cannot exceed 200 characters')
  .trim()

export const feedbackMessageSchema = z
  .string()
  .min(10, 'Message must be at least 10 characters')
  .max(2000, 'Message cannot exceed 2000 characters')
  .trim()

export const feedbackRatingSchema = z.number().int().min(1).max(5).optional()

// Tag validation schemas
export const tagNameSchema = z
  .string()
  .min(1, 'Tag name is required')
  .max(50, 'Tag name cannot exceed 50 characters')
  .trim()

export const tagColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #3b82f6)')

// Saved filter validation schemas
export const savedFilterNameSchema = z
  .string()
  .min(1, 'Filter name is required')
  .max(100, 'Filter name cannot exceed 100 characters')
  .trim()

export const savedFilterTypeSchema = z.enum(['workout', 'exercise', 'routine'], {
  errorMap: () => ({ message: 'Invalid filter type' }),
})

export const savedFilterFiltersSchema = z.record(z.any())

// Tag schema
export const tagSchema = z.object({
  name: tagNameSchema,
  color: tagColorSchema,
})

// Saved filter schema
export const savedFilterSchema = z.object({
  name: savedFilterNameSchema,
  type: savedFilterTypeSchema,
  filters: savedFilterFiltersSchema,
  is_favorite: z.boolean().optional(),
})

// Type exports for TypeScript inference
export type ValidatedWorkout = z.infer<typeof workoutSchema>
export type ValidatedSet = z.infer<typeof setSchema>
export type ValidatedExercise = z.infer<typeof exerciseSchema>
export type ValidatedRoutine = z.infer<typeof routineSchema>
export type ValidatedTag = z.infer<typeof tagSchema>
export type ValidatedSavedFilter = z.infer<typeof savedFilterSchema>

