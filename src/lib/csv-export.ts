/**
 * CSV Export Utility
 * Converts workout data to CSV format and handles browser download
 */

import { WorkoutWithSets } from '@/types'
import { formatDate, formatWeight } from '@/lib/utils'

/**
 * Escapes a string for CSV format by wrapping in quotes and escaping existing quotes
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Converts a list of workouts with sets to a CSV string
 */
export function generateWorkoutsCSV(workouts: WorkoutWithSets[]): string {
  const headers = [
    'Date',
    'Routine',
    'Duration (min)',
    'Exercise',
    'Set #',
    'Reps',
    'Weight (kg)',
    'Rest (sec)',
    'Volume (kg)',
    'Notes'
  ]

  const rows: string[][] = [headers]

  // Flatten workouts and sets into rows
  workouts.forEach((workout) => {
    // Sort sets by exercise and then by order
    const sortedSets = [...workout.sets].sort((a, b) => {
      if (a.exercise.name !== b.exercise.name) {
        return a.exercise.name.localeCompare(b.exercise.name)
      }
      return a.set_order - b.set_order
    })

    if (sortedSets.length === 0) {
      // If no sets, add at least one row for the workout
      rows.push([
        formatDate(workout.date, 'yyyy-MM-dd'),
        workout.routine_name || 'Free Workout',
        workout.duration.toString(),
        '',
        '',
        '',
        '',
        '',
        '0',
        workout.notes || ''
      ])
      return
    }

    sortedSets.forEach((set, index) => {
      const volume = (set.weight * set.reps).toFixed(1)
      rows.push([
        formatDate(workout.date, 'yyyy-MM-dd'),
        workout.routine_name || 'Free Workout',
        workout.duration.toString(),
        set.exercise.name,
        (index + 1).toString(), // Set number within the workout (flattened)
        set.reps.toString(),
        set.weight.toString(),
        set.rest_time?.toString() || '',
        volume,
        index === 0 ? (workout.notes || '') : '' // Only show notes on the first row of the workout
      ])
    })
  })

  // Convert rows to CSV string
  return rows.map(row => row.map(escapeCSV).join(',')).join('\n')
}

/**
 * Generates and triggers download of a CSV file containing workout data
 */
export function downloadWorkoutsAsCSV(workouts: WorkoutWithSets[]) {
  if (workouts.length === 0) return

  const csvContent = generateWorkoutsCSV(workouts)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  const dateStr = new Date().toISOString().split('T')[0]
  const fileName = `workouts_report_${dateStr}.csv`

  link.setAttribute('href', url)
  link.setAttribute('download', fileName)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()

  // Cleanup: defer revoke until next event loop to ensure download starts
  link.addEventListener('click', () => {
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 0)
  }, { once: true })

  // Fallback cleanup if click event doesn't fire
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link)
    }
    URL.revokeObjectURL(url)
  }, 1000)
}
