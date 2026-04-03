/**
 * Fechas y límites de día según la hora local de Colombia (America/Bogota, UTC-5 sin DST).
 * Usar para: "hoy", rachas, filtros por fecha, agrupación por semana/mes y valores por defecto de formularios.
 * Los instantes guardados en BD (created_at, etc.) pueden seguir en ISO UTC.
 */

import { DayOfWeek } from '@/types'

export const APP_TIMEZONE = 'America/Bogota'

/** YYYY-MM-DD del instante `date` en Colombia */
export function formatDateInColombia(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

export function getTodayColombia(): string {
  return formatDateInColombia(new Date())
}

/** Aritmética de calendario sobre cadenas YYYY-MM-DD (válida para Colombia al no haber cambio de horario). */
export function addCalendarDays(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + deltaDays)
  const y2 = dt.getUTCFullYear()
  const m2 = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d2 = String(dt.getUTCDate()).padStart(2, '0')
  return `${y2}-${m2}-${d2}`
}

export function addCalendarYears(dateStr: string, deltaYears: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCFullYear(dt.getUTCFullYear() + deltaYears)
  const y2 = dt.getUTCFullYear()
  const m2 = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d2 = String(dt.getUTCDate()).padStart(2, '0')
  return `${y2}-${m2}-${d2}`
}

/** Mediodía en Bogotá para una fecha civil YYYY-MM-DD (evita desfaces al parsear solo la fecha). */
export function parseDateStringAtColombiaNoon(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 17, 0, 0))
}

const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
}

/** Día de la semana civil de `YYYY-MM-DD` en Colombia (según mediodía local). */
export function getDayOfWeekColombia(dateStr: string): DayOfWeek {
  const noon = parseDateStringAtColombiaNoon(dateStr)
  return JS_DAY_TO_ENUM[noon.getUTCDay()]
}

/** Inicio de semana domingo (comportamiento previo de la app) en calendario Colombia. */
export function getWeekStartSundayColombia(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const noon = new Date(Date.UTC(y, m - 1, d, 17, 0, 0))
  const dow = noon.getUTCDay()
  const weekStart = new Date(noon.getTime() - dow * 86400000)
  return formatDateInColombia(weekStart)
}

/** Lunes de la semana ISO civil que contiene `dateStr` (Colombia). */
export function getWeekStartMondayColombia(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const noon = new Date(Date.UTC(y, m - 1, d, 17, 0, 0))
  const dow = noon.getUTCDay()
  const daysFromMonday = (dow + 6) % 7
  const weekStart = new Date(noon.getTime() - daysFromMonday * 86400000)
  return formatDateInColombia(weekStart)
}

/** Formato corto para UI (día / mes) según zona Colombia. */
export function formatColombiaDayMonth(
  dateStr: string,
  locale: string = 'es-CO',
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
): string {
  return new Intl.DateTimeFormat(locale, { timeZone: APP_TIMEZONE, ...options }).format(
    parseDateStringAtColombiaNoon(dateStr)
  )
}

/** Primer día del mes civil de `dateStr` (YYYY-MM-DD o YYYY-MM). */
export function getMonthStartStr(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`
}

/** Último día del mes civil de `dateStr` (YYYY-MM-DD). */
export function getMonthEndStr(dateStr: string): string {
  const y = Number(dateStr.slice(0, 4))
  const m = Number(dateStr.slice(5, 7))
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

export function addCalendarMonths(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1))
  const y2 = dt.getUTCFullYear()
  const m2 = dt.getUTCMonth() + 1
  const maxDay = new Date(Date.UTC(y2, m2, 0)).getUTCDate()
  const d2 = Math.min(d, maxDay)
  return `${y2}-${String(m2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`
}
