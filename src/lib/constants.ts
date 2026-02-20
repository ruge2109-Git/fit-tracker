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

// Helper function to get translated routine frequency options
// This should be used in components with useTranslations
export const getRoutineFrequencyOptions = (t: (key: string) => string) => [
  { value: RoutineFrequency.CUSTOM, label: t('customDays') },
  { value: RoutineFrequency.WEEKLY_1, label: t('weekly1') },
  { value: RoutineFrequency.WEEKLY_2, label: t('weekly2') },
  { value: RoutineFrequency.WEEKLY_3, label: t('weekly3') },
  { value: RoutineFrequency.WEEKLY_4, label: t('weekly4') },
  { value: RoutineFrequency.WEEKLY_5, label: t('weekly5') },
  { value: RoutineFrequency.WEEKLY_6, label: t('weekly6') },
  { value: RoutineFrequency.DAILY, label: t('daily') },
] as const

// Helper function to get translated days of week options
// This should be used in components with useTranslations
export const getDaysOfWeekOptions = (t: (key: string) => string) => [
  { value: DayOfWeek.MONDAY, label: t('monday'), short: t('mondayShort') },
  { value: DayOfWeek.TUESDAY, label: t('tuesday'), short: t('tuesdayShort') },
  { value: DayOfWeek.WEDNESDAY, label: t('wednesday'), short: t('wednesdayShort') },
  { value: DayOfWeek.THURSDAY, label: t('thursday'), short: t('thursdayShort') },
  { value: DayOfWeek.FRIDAY, label: t('friday'), short: t('fridayShort') },
  { value: DayOfWeek.SATURDAY, label: t('saturday'), short: t('saturdayShort') },
  { value: DayOfWeek.SUNDAY, label: t('sunday'), short: t('sundayShort') },
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
  NEW_WORKOUT_FREE: '/workouts/new-free',
  EXERCISES: '/exercises',
  NEW_EXERCISE: '/exercises/new',
  EXERCISE_STATS: (id: string) => `/exercises/${id}/stats`,
  ROUTINES: '/routines',
  NEW_ROUTINE: '/routines/new',
  ROUTINE_DETAIL: (id: string) => `/routines/${id}`,
  ROUTINE_EDIT: (id: string) => `/routines/${id}/edit`,
  ROUTINE_ADD_EXERCISE: (id: string) => `/routines/${id}/add-exercise`,
  TOOLS: '/tools',
  PROFILE: '/profile',
  FEEDBACK: '/feedback',
  ADMIN_FEEDBACK: '/admin/feedback',
  ADMIN_AUDIT: '/admin/audit',
  GOALS: '/goals',
  NEW_GOAL: '/goals/new',
  GOAL_DETAIL: (id: string) => `/goals/${id}`,
  GOAL_EDIT: (id: string) => `/goals/${id}/edit`,
  BODY_MEASUREMENTS: '/body-measurements',
  BODY_MEASUREMENT_EDIT: (id: string) => `/body-measurements/${id}/edit`,
  PROGRESS_PHOTOS: '/progress-photos',
  SOCIAL: '/social',
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
