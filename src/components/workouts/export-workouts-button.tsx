'use client'

import { useEffect } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkoutExport } from '@/hooks/useWorkoutExport'
import { useRateLimitedAction } from '@/hooks/useRateLimitedAction'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export function ExportWorkoutsButton() {
  const { exportToCSV, progress } = useWorkoutExport()
  const t = useTranslations('workouts')
  const tCommon = useTranslations('common')

  const { execute: executeExport, canExecute } = useRateLimitedAction(
    exportToCSV,
    {
      delayMs: 5000,
      onRateLimited: () => {
        toast.info('Please wait before exporting again (5s cooldown)')
      },
    }
  )

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={executeExport}
        disabled={!canExecute() || progress.loading}
        className="h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] border-accent/10 bg-accent/5 hover:bg-accent/10 transition-all px-4"
      >
        {progress.loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-green-600" />
        )}
        {progress.loading && progress.total > 0
          ? `${progress.current}/${progress.total}`
          : null}
      </Button>
    </>
  )
}
