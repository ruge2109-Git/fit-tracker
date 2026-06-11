'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { workoutService } from '@/domain/services/workout.service'
import { downloadWorkoutsAsCSV } from '@/lib/csv-export'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { ApiResponse, WorkoutWithSets } from '@/types'

export function ExportWorkoutsButton() {
  const { user } = useAuthStore()
  const [isExporting, setIsExporting] = useState(false)
  const t = useTranslations('workouts')
  const tCommon = useTranslations('common')

  const handleExport = async () => {
    if (!user) return

    setIsExporting(true)
    try {
      const workoutsResponse = await workoutService.getUserWorkouts(user.id)

      if (workoutsResponse.error || !workoutsResponse.data) {
        throw new Error(workoutsResponse.error || 'Failed to fetch workouts')
      }

      const basicWorkouts = workoutsResponse.data

      if (basicWorkouts.length === 0) {
        toast.info(t('noWorkoutsToExport') || 'No workouts to export')
        return
      }

      // Fetch full details in batches of 50 to avoid memory overload
      const detailedWorkouts: WorkoutWithSets[] = []
      const batchSize = 50

      for (let i = 0; i < basicWorkouts.length; i += batchSize) {
        const batch = basicWorkouts.slice(i, i + batchSize)
        const batchPromises = batch.map(w => workoutService.getWorkout(w.id))
        const batchResults = await Promise.all(batchPromises)

        const batchWorkouts = batchResults
          .map(r => r.data)
          .filter((w): w is WorkoutWithSets => !!w)

        detailedWorkouts.push(...batchWorkouts)
      }

      downloadWorkoutsAsCSV(detailedWorkouts)
      toast.success(t('exportSuccess') || 'Export successful')
    } catch (error) {
      console.error('Export error:', error)
      toast.error(t('exportError') || 'Failed to export workouts')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] border-accent/10 bg-accent/5 hover:bg-accent/10 transition-all px-4"
    >
      {isExporting ? (
        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-green-600" />
      )}
    </Button>
  )
}
