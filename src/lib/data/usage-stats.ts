/**
 * Usage Statistics Service
 * Tracks and provides usage statistics for the application
 */

import { Workout, Exercise, Routine, WorkoutWithSets, MuscleGroup } from '@/types'
import { logger } from '@/lib/logger'
import {
  addCalendarDays,
  getTodayColombia,
  getWeekStartSundayColombia,
  parseDateStringAtColombiaNoon,
} from '@/lib/datetime/colombia'

const STATS_KEY = 'fittrackr_usage_stats'

export interface UsageStats {
  // Session stats
  totalSessions: number
  lastSessionDate: string
  currentStreak: number // Days in a row
  longestStreak: number

  // Workout stats
  totalWorkouts: number
  totalWorkoutTime: number // in minutes
  averageWorkoutDuration: number
  workoutsThisWeek: number
  workoutsThisMonth: number

  // Exercise stats
  totalExercises: number
  uniqueExercisesUsed: number
  mostUsedExercise: string | null
  mostTrainedMuscleGroup: MuscleGroup | null

  // Routine stats
  totalRoutines: number
  activeRoutines: number

  // Activity stats
  firstWorkoutDate: string | null
  lastWorkoutDate: string | null
  daysSinceFirstWorkout: number
  daysSinceLastWorkout: number

  // Weekly activity
  weeklyActivity: {
    week: string // ISO week string
    workoutCount: number
    totalDuration: number
  }[]

  // Monthly activity
  monthlyActivity: {
    month: string // YYYY-MM
    workoutCount: number
    totalDuration: number
  }[]
}

/**
 * Gets usage stats from localStorage
 */
function getStoredStats(): Partial<UsageStats> {
  try {
    const stored = localStorage.getItem(STATS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    logger.error('Error reading usage stats', error as Error, 'UsageStats')
  }
  return {}
}

/**
 * Saves usage stats to localStorage
 */
function saveStats(stats: UsageStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (error) {
    logger.error('Error saving usage stats', error as Error, 'UsageStats')
  }
}

/**
 * Calculates usage statistics from user data
 */
export function calculateUsageStats(
  workouts: WorkoutWithSets[],
  exercises: Exercise[],
  routines: Routine[]
): UsageStats {
  const stored = getStoredStats()
  const now = new Date()
  const todayStr = getTodayColombia()

  // Workout stats
  const totalWorkouts = workouts.length
  const totalWorkoutTime = workouts.reduce((sum, w) => sum + w.duration, 0)
  const averageWorkoutDuration = totalWorkouts > 0 ? totalWorkoutTime / totalWorkouts : 0

  // Date range (fechas de entreno son YYYY-MM-DD)
  const sortedDateStrings = [...new Set(workouts.map((w) => w.date))].sort()
  const firstWorkoutDate = sortedDateStrings.length > 0 ? sortedDateStrings[0] : null
  const lastWorkoutDate = sortedDateStrings.length > 0 ? sortedDateStrings[sortedDateStrings.length - 1] : null

  const daysSinceFirstWorkout = firstWorkoutDate
    ? Math.floor(
        (parseDateStringAtColombiaNoon(todayStr).getTime() -
          parseDateStringAtColombiaNoon(firstWorkoutDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0
  const daysSinceLastWorkout = lastWorkoutDate
    ? Math.floor(
        (parseDateStringAtColombiaNoon(todayStr).getTime() -
          parseDateStringAtColombiaNoon(lastWorkoutDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  // Weekly stats (domingo = inicio de semana, calendario Colombia)
  const weekStartStr = getWeekStartSundayColombia(todayStr)
  const workoutsThisWeek = workouts.filter((w) => w.date >= weekStartStr).length

  // Monthly stats
  const monthStartStr = `${todayStr.slice(0, 7)}-01`
  const workoutsThisMonth = workouts.filter((w) => w.date >= monthStartStr).length

  // Exercise stats
  const totalExercises = exercises.length
  const uniqueExercisesUsed = new Set(workouts.flatMap((w) => w.sets?.map((s) => s.exercise_id) || [])).size

  // Most used exercise
  const exerciseCounts = new Map<string, number>()
  workouts.forEach((w) => {
    w.sets?.forEach((set) => {
      const count = exerciseCounts.get(set.exercise_id) || 0
      exerciseCounts.set(set.exercise_id, count + 1)
    })
  })
  let mostUsedExercise: string | null = null
  let maxCount = 0
  exerciseCounts.forEach((count, exerciseId) => {
    if (count > maxCount) {
      maxCount = count
      mostUsedExercise = exerciseId
    }
  })

  // Most trained muscle group
  const muscleGroupCounts = new Map<MuscleGroup, number>()
  workouts.forEach((w) => {
    w.sets?.forEach((set) => {
      const muscleGroup = set.exercise?.muscle_group
      if (muscleGroup) {
        const count = muscleGroupCounts.get(muscleGroup) || 0
        muscleGroupCounts.set(muscleGroup, count + 1)
      }
    })
  })
  let mostTrainedMuscleGroup: MuscleGroup | null = null
  let maxMuscleCount = 0
  muscleGroupCounts.forEach((count, muscleGroup) => {
    if (count > maxMuscleCount) {
      maxMuscleCount = count
      mostTrainedMuscleGroup = muscleGroup
    }
  })

  // Routine stats
  const totalRoutines = routines.length
  const activeRoutines = routines.filter((r) => r.is_active).length

  // Weekly activity
  const weeklyActivityMap = new Map<string, { workoutCount: number; totalDuration: number }>()
  workouts.forEach((w) => {
    const weekKey = getWeekStartSundayColombia(w.date)

    const existing = weeklyActivityMap.get(weekKey) || { workoutCount: 0, totalDuration: 0 }
    weeklyActivityMap.set(weekKey, {
      workoutCount: existing.workoutCount + 1,
      totalDuration: existing.totalDuration + w.duration,
    })
  })
  const weeklyActivity = Array.from(weeklyActivityMap.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12) // Last 12 weeks

  // Monthly activity
  const monthlyActivityMap = new Map<string, { workoutCount: number; totalDuration: number }>()
  workouts.forEach((w) => {
    const monthKey = w.date.slice(0, 7)

    const existing = monthlyActivityMap.get(monthKey) || { workoutCount: 0, totalDuration: 0 }
    monthlyActivityMap.set(monthKey, {
      workoutCount: existing.workoutCount + 1,
      totalDuration: existing.totalDuration + w.duration,
    })
  })
  const monthlyActivity = Array.from(monthlyActivityMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12) // Last 12 months

  // Session and streak stats
  const lastSessionDate = stored.lastSessionDate || now.toISOString()
  const currentStreak = calculateStreak(workouts, todayStr)
  const longestStreak = Math.max(currentStreak, stored.longestStreak || 0)

  const stats: UsageStats = {
    totalSessions: (stored.totalSessions || 0) + 1,
    lastSessionDate: now.toISOString(),
    currentStreak,
    longestStreak,
    totalWorkouts,
    totalWorkoutTime,
    averageWorkoutDuration,
    workoutsThisWeek,
    workoutsThisMonth,
    totalExercises,
    uniqueExercisesUsed,
    mostUsedExercise,
    mostTrainedMuscleGroup,
    totalRoutines,
    activeRoutines,
    firstWorkoutDate,
    lastWorkoutDate,
    daysSinceFirstWorkout,
    daysSinceLastWorkout,
    weeklyActivity,
    monthlyActivity,
  }

  saveStats(stats)
  return stats
}

/**
 * Calculates current streak (consecutive days with workouts), usando el día civil en Colombia.
 */
function calculateStreak(workouts: WorkoutWithSets[], todayStr: string): number {
  if (workouts.length === 0) return 0

  const workoutDates = new Set(workouts.map((w) => w.date))

  let streak = 0
  let checkStr = todayStr

  while (workoutDates.has(checkStr)) {
    streak++
    checkStr = addCalendarDays(checkStr, -1)
  }

  return streak
}

/**
 * Gets current usage stats
 */
export function getUsageStats(): UsageStats | null {
  try {
    const stored = getStoredStats()
    if (Object.keys(stored).length === 0) {
      return null
    }
    return stored as UsageStats
  } catch (error) {
    logger.error('Error getting usage stats', error as Error, 'UsageStats')
    return null
  }
}

/**
 * Resets usage stats
 */
export function resetUsageStats(): void {
  try {
    localStorage.removeItem(STATS_KEY)
    logger.info('Usage stats reset', 'UsageStats')
  } catch (error) {
    logger.error('Error resetting usage stats', error as Error, 'UsageStats')
  }
}

