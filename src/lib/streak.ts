/**
 * Cálculo de racha respetando días de descanso (calendario Colombia).
 * En días de entreno sin entreno se corta la racha; en días de descanso se ignora.
 * El día actual sin entreno aún permite seguir contando hacia atrás (grace) una vez.
 * Días en `forgivenDates` cuentan como entreno solo para la racha (recuperación, máx. 3 usos).
 */

import { DayOfWeek } from '@/types'
import { addCalendarDays, getDayOfWeekColombia, getTodayColombia } from '@/lib/datetime/colombia'

const ALL_DAYS = new Set(Object.values(DayOfWeek))

/** Máximo de recuperaciones de racha por cuenta (vida útil de la cuenta). */
export const MAX_STREAK_RECOVERY_USES = 3

/** Solo se puede perdonar un día de entreno faltante reciente (ventana hacia atrás desde hoy). */
export const STREAK_RECOVERY_LOOKBACK_DAYS = 14

export function normalizeRestDays(raw: string[] | null | undefined): Set<DayOfWeek> {
  if (!raw?.length) return new Set()
  const out = new Set<DayOfWeek>()
  for (const d of raw) {
    if (ALL_DAYS.has(d as DayOfWeek)) out.add(d as DayOfWeek)
  }
  if (out.size >= 7) return new Set()
  return out
}

function isRestDay(dateStr: string, restDays: Set<DayOfWeek>): boolean {
  if (restDays.size === 0) return false
  return restDays.has(getDayOfWeekColombia(dateStr))
}

export function getRecoveryCreditsRemaining(forgivenessCount: number): number {
  return Math.max(0, MAX_STREAK_RECOVERY_USES - forgivenessCount)
}

export function canOfferStreakRecovery(params: {
  streak: number
  workoutDatesCount: number
  recoveryCreditsRemaining: number
  firstMissedDate: string | null
  lastWorkoutDate: string | null
  todayStr: string
}): boolean {
  if (params.streak !== 0) return false
  if (params.workoutDatesCount === 0) return false
  if (params.recoveryCreditsRemaining <= 0) return false
  if (!params.firstMissedDate || !params.lastWorkoutDate) return false
  if (params.firstMissedDate <= params.lastWorkoutDate) return false
  const minDate = addCalendarDays(params.todayStr, -STREAK_RECOVERY_LOOKBACK_DAYS)
  if (params.firstMissedDate < minDate) return false
  return true
}

export function computeTrainingStreak(
  workoutDates: string[],
  todayStr: string = getTodayColombia(),
  restDays: Set<DayOfWeek> = new Set(),
  forgivenDates: Set<string> = new Set()
): {
  streak: number
  isAtRisk: boolean
  lastWorkoutDate: string | null
  firstMissedDate: string | null
} {
  const workoutSet = new Set(workoutDates)
  if (workoutSet.size === 0) {
    return { streak: 0, isAtRisk: false, lastWorkoutDate: null, firstMissedDate: null }
  }

  const sortedDesc = [...workoutSet].sort((a, b) => b.localeCompare(a))
  const lastWorkoutDate = sortedDesc[0]

  const hasTraining = (d: string) => workoutSet.has(d) || forgivenDates.has(d)

  let streak = 0
  let d = todayStr
  let skippedTodayGrace = false
  let firstMissedDate: string | null = null
  const maxIter = 800

  for (let i = 0; i < maxIter; i++) {
    if (isRestDay(d, restDays)) {
      d = addCalendarDays(d, -1)
      continue
    }
    if (hasTraining(d)) {
      streak++
      d = addCalendarDays(d, -1)
      continue
    }
    if (d === todayStr && !skippedTodayGrace) {
      skippedTodayGrace = true
      d = addCalendarDays(d, -1)
      continue
    }
    firstMissedDate = d
    break
  }

  if (streak > 0) {
    firstMissedDate = null
  }

  const isAtRisk =
    !isRestDay(todayStr, restDays) &&
    !workoutSet.has(todayStr) &&
    !forgivenDates.has(todayStr) &&
    streak > 0

  return { streak, isAtRisk, lastWorkoutDate, firstMissedDate }
}
