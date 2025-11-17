/**
 * Application constants
 * Centralized configuration following Single Responsibility Principle
 */

import { ExerciseType, MuscleGroup, RoutineFrequency, DayOfWeek } from '@/types'

// Helper function to get translated exercise type options
// This should be used in components with useTranslations
export const getExerciseTypeOptions = (t: (key: string) => string) => [
  { value: ExerciseType.STRENGTH, label: t('strength') },
  { value: ExerciseType.CARDIO, label: t('cardio') },
  { value: ExerciseType.MOBILITY, label: t('mobility') },
  { value: ExerciseType.FLEXIBILITY, label: t('flexibility') },
] as const

// Helper function to get translated muscle group options
// This should be used in components with useTranslations
export const getMuscleGroupOptions = (t: (key: string) => string) => [
  { value: MuscleGroup.CHEST, label: t('chest') },
  { value: MuscleGroup.BACK, label: t('back') },
  { value: MuscleGroup.LEGS, label: t('legs') },
  { value: MuscleGroup.SHOULDERS, label: t('shoulders') },
  { value: MuscleGroup.ARMS, label: t('arms') },
  { value: MuscleGroup.CORE, label: t('core') },
  { value: MuscleGroup.FULL_BODY, label: t('fullBody') },
  { value: MuscleGroup.CARDIO, label: t('cardio') },
] as const

export const APP_NAME = 'FitTrackr'
export const APP_DESCRIPTION = 'Track your workouts, analyze your progress, achieve your goals'

// Routes
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  DASHBOARD: '/dashboard',
  WORKOUTS: '/workouts',
  WORKOUT_DETAIL: (id: string) => `/workouts/${id}`,
  WORKOUT_EDIT: (id: string) => `/workouts/${id}/edit`,
  WORKOUT_FROM_ROUTINE: (id: string) => `/workouts/new-from-routine/${id}`,
  NEW_WORKOUT: '/workouts/new',
  EXERCISES: '/exercises',
  EXERCISE_STATS: (id: string) => `/exercises/${id}/stats`,
  ROUTINES: '/routines',
  ROUTINE_DETAIL: (id: string) => `/routines/${id}`,
  ROUTINE_EDIT: (id: string) => `/routines/${id}/edit`,
  TOOLS: '/tools',
  PROFILE: '/profile',
} as const

// Exercise type options
export const EXERCISE_TYPE_OPTIONS = [
  { value: ExerciseType.STRENGTH, label: 'Strength' },
  { value: ExerciseType.CARDIO, label: 'Cardio' },
  { value: ExerciseType.MOBILITY, label: 'Mobility' },
  { value: ExerciseType.FLEXIBILITY, label: 'Flexibility' },
] as const

// Muscle group options
export const MUSCLE_GROUP_OPTIONS = [
  { value: MuscleGroup.CHEST, label: 'Chest' },
  { value: MuscleGroup.BACK, label: 'Back' },
  { value: MuscleGroup.LEGS, label: 'Legs' },
  { value: MuscleGroup.SHOULDERS, label: 'Shoulders' },
  { value: MuscleGroup.ARMS, label: 'Arms' },
  { value: MuscleGroup.CORE, label: 'Core' },
  { value: MuscleGroup.FULL_BODY, label: 'Full Body' },
  { value: MuscleGroup.CARDIO, label: 'Cardio' },
] as const

// Routine frequency options
export const ROUTINE_FREQUENCY_OPTIONS = [
  { value: RoutineFrequency.CUSTOM, label: 'Custom Days' },
  { value: RoutineFrequency.WEEKLY_1, label: '1x per week' },
  { value: RoutineFrequency.WEEKLY_2, label: '2x per week' },
  { value: RoutineFrequency.WEEKLY_3, label: '3x per week' },
  { value: RoutineFrequency.WEEKLY_4, label: '4x per week' },
  { value: RoutineFrequency.WEEKLY_5, label: '5x per week' },
  { value: RoutineFrequency.WEEKLY_6, label: '6x per week' },
  { value: RoutineFrequency.DAILY, label: 'Every day' },
] as const

// Days of week options
export const DAYS_OF_WEEK_OPTIONS = [
  { value: DayOfWeek.MONDAY, label: 'Monday', short: 'Mon' },
  { value: DayOfWeek.TUESDAY, label: 'Tuesday', short: 'Tue' },
  { value: DayOfWeek.WEDNESDAY, label: 'Wednesday', short: 'Wed' },
  { value: DayOfWeek.THURSDAY, label: 'Thursday', short: 'Thu' },
  { value: DayOfWeek.FRIDAY, label: 'Friday', short: 'Fri' },
  { value: DayOfWeek.SATURDAY, label: 'Saturday', short: 'Sat' },
  { value: DayOfWeek.SUNDAY, label: 'Sunday', short: 'Sun' },
] as const

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const WORKOUTS_PER_PAGE = 10

// Chart colors
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
} as const

// Default values
export const DEFAULT_REST_TIME = 90 // seconds
export const DEFAULT_WORKOUT_DURATION = 60 // minutes
