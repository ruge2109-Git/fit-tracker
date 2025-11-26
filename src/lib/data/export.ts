/**
 * Data Export Utilities
 * Functions to export user data to JSON and CSV formats
 */

import { Workout, Exercise, Routine, WorkoutWithSets, RoutineWithExercises } from '@/types'
import { logger } from '@/lib/logger'

export interface ExportData {
  workouts: WorkoutWithSets[]
  exercises: Exercise[]
  routines: RoutineWithExercises[]
  metadata: {
    exportDate: string
    version: string
    totalWorkouts: number
    totalExercises: number
    totalRoutines: number
  }
}

/**
 * Exports all user data to JSON format
 */
export function exportToJSON(data: ExportData): string {
  try {
    return JSON.stringify(data, null, 2)
  } catch (error) {
    logger.error('Error exporting to JSON', error as Error, 'DataExport')
    throw new Error('Failed to export data to JSON')
  }
}

/**
 * Downloads data as a JSON file
 */
export function downloadJSON(data: ExportData, filename?: string): void {
  try {
    const jsonString = exportToJSON(data)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `fittrackr-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    logger.error('Error downloading JSON', error as Error, 'DataExport')
    throw error
  }
}

/**
 * Converts workouts to CSV format
 */
function workoutsToCSV(workouts: WorkoutWithSets[]): string {
  const headers = ['Date', 'Duration (min)', 'Notes', 'Exercise', 'Sets', 'Reps', 'Weight (kg)', 'Rest Time (sec)']
  const rows: string[][] = [headers]

  workouts.forEach((workout) => {
    if (workout.sets && workout.sets.length > 0) {
      workout.sets.forEach((set) => {
        rows.push([
          workout.date,
          workout.duration.toString(),
          workout.notes || '',
          set.exercise?.name || '',
          '1', // Each row is one set
          set.reps.toString(),
          set.weight.toString(),
          set.rest_time?.toString() || '',
        ])
      })
    } else {
      // Workout without sets
      rows.push([
        workout.date,
        workout.duration.toString(),
        workout.notes || '',
        '',
        '',
        '',
        '',
        '',
      ])
    }
  })

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
}

/**
 * Converts exercises to CSV format
 */
function exercisesToCSV(exercises: Exercise[]): string {
  const headers = ['Name', 'Type', 'Muscle Group', 'Description']
  const rows: string[][] = [headers]

  exercises.forEach((exercise) => {
    rows.push([
      exercise.name,
      exercise.type,
      exercise.muscle_group,
      exercise.description || '',
    ])
  })

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
}

/**
 * Converts routines to CSV format
 */
function routinesToCSV(routines: RoutineWithExercises[]): string {
  const headers = ['Routine Name', 'Description', 'Is Active', 'Exercise', 'Target Sets', 'Target Reps', 'Target Weight (kg)']
  const rows: string[][] = [headers]

  routines.forEach((routine) => {
    if (routine.exercises && routine.exercises.length > 0) {
      routine.exercises.forEach((exercise) => {
        rows.push([
          routine.name,
          routine.description || '',
          routine.is_active ? 'Yes' : 'No',
          exercise.exercise?.name || '',
          exercise.target_sets.toString(),
          exercise.target_reps.toString(),
          exercise.target_weight?.toString() || '',
        ])
      })
    } else {
      // Routine without exercises
      rows.push([
        routine.name,
        routine.description || '',
        routine.is_active ? 'Yes' : 'No',
        '',
        '',
        '',
        '',
      ])
    }
  })

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
}

/**
 * Exports all data to CSV format (multiple sheets as separate files)
 */
export function exportToCSV(data: ExportData): { workouts: string; exercises: string; routines: string } {
  try {
    return {
      workouts: workoutsToCSV(data.workouts),
      exercises: exercisesToCSV(data.exercises),
      routines: routinesToCSV(data.routines),
    }
  } catch (error) {
    logger.error('Error exporting to CSV', error as Error, 'DataExport')
    throw new Error('Failed to export data to CSV')
  }
}

/**
 * Downloads data as CSV files
 */
export function downloadCSV(data: ExportData, baseFilename?: string): void {
  try {
    const csvData = exportToCSV(data)
    const dateStr = new Date().toISOString().split('T')[0]
    const baseName = baseFilename || `fittrackr-export-${dateStr}`

    // Download workouts CSV
    downloadCSVFile(csvData.workouts, `${baseName}-workouts.csv`)

    // Download exercises CSV
    downloadCSVFile(csvData.exercises, `${baseName}-exercises.csv`)

    // Download routines CSV
    downloadCSVFile(csvData.routines, `${baseName}-routines.csv`)
  } catch (error) {
    logger.error('Error downloading CSV', error as Error, 'DataExport')
    throw error
  }
}

/**
 * Helper function to download a single CSV file
 */
function downloadCSVFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Creates export data structure from user data
 */
export function createExportData(
  workouts: WorkoutWithSets[],
  exercises: Exercise[],
  routines: RoutineWithExercises[]
): ExportData {
  return {
    workouts,
    exercises,
    routines,
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      totalWorkouts: workouts.length,
      totalExercises: exercises.length,
      totalRoutines: routines.length,
    },
  }
}

