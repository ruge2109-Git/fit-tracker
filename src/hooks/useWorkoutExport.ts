/**
 * Workout Export Hook
 * Encapsulates fetching workouts and exporting to CSV
 * Features: batching, progress tracking, error handling, cross-tab sync
 */

import { useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { workoutService } from '@/domain/services/workout.service'
import { downloadWorkoutsAsCSV } from '@/lib/csv-export'
import { exportWorkoutToPDF } from '@/lib/pdf-export'
import { WorkoutWithSets } from '@/types'
import { toast } from 'sonner'
import { crossTabSync, SYNC_EVENTS } from '@/lib/cross-tab-sync'

interface ExportProgress {
  current: number
  total: number
  loading: boolean
  error?: string
}

export function useWorkoutExport() {
  const { user } = useAuthStore()
  const [progress, setProgress] = useState<ExportProgress>({
    current: 0,
    total: 0,
    loading: false,
  })

  const exportToCSV = useCallback(async () => {
    if (!user) return

    setProgress({ current: 0, total: 0, loading: true })

    try {
      const workoutsResponse = await workoutService.getUserWorkouts(user.id)

      if (workoutsResponse.error || !workoutsResponse.data) {
        throw new Error(workoutsResponse.error || 'Failed to fetch workouts')
      }

      const basicWorkouts = workoutsResponse.data

      if (basicWorkouts.length === 0) {
        toast.info('No workouts to export')
        return
      }

      setProgress({ current: 0, total: basicWorkouts.length, loading: true })

      const detailedWorkouts: WorkoutWithSets[] = []
      const batchSize = 50

      // Fetch in batches with progress updates
      for (let i = 0; i < basicWorkouts.length; i += batchSize) {
        const batch = basicWorkouts.slice(i, i + batchSize)
        const batchPromises = batch.map((w) => workoutService.getWorkout(w.id))
        const batchResults = await Promise.all(batchPromises)

        const batchWorkouts = batchResults
          .map((r) => r.data)
          .filter((w): w is WorkoutWithSets => !!w)

        detailedWorkouts.push(...batchWorkouts)
        setProgress({
          current: Math.min(i + batchSize, basicWorkouts.length),
          total: basicWorkouts.length,
          loading: true,
        })
      }

      downloadWorkoutsAsCSV(detailedWorkouts)
      toast.success(`Exported ${detailedWorkouts.length} workouts`)

      // Notify other tabs
      crossTabSync.broadcast(SYNC_EVENTS.EXPORT_COMPLETED, {
        count: detailedWorkouts.length,
        timestamp: new Date().toISOString(),
      })

      setProgress({ current: 0, total: 0, loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      toast.error(message)
      setProgress({
        current: 0,
        total: 0,
        loading: false,
        error: message,
      })
    }
  }, [user])

  const exportToPDF = useCallback(
    async (workout: WorkoutWithSets) => {
      try {
        setProgress({ current: 1, total: 1, loading: true })
        exportWorkoutToPDF(workout)
        toast.success('PDF exported')
        setProgress({ current: 0, total: 0, loading: false })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'PDF export failed'
        toast.error(message)
        setProgress({
          current: 0,
          total: 0,
          loading: false,
          error: message,
        })
      }
    },
    []
  )

  return {
    exportToCSV,
    exportToPDF,
    progress,
    isExporting: progress.loading,
  }
}
