/**
 * Backup Manager Component
 * Manages automatic backups to localStorage
 */

'use client'

import { useState, useEffect } from 'react'
import { Database, Download, Trash2, RefreshCw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup,
  clearAllBackups,
  shouldCreateBackup,
  getTotalBackupSize,
  BackupInfo,
  autoBackupService,
} from '@/lib/data/backup'
import { useWorkoutStore } from '@/store/workout.store'
import { useExerciseStore } from '@/store/exercise.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { workoutRepository } from '@/domain/repositories/workout.repository'
import { useAuthStore } from '@/store/auth.store'
import { Routine, WorkoutWithSets, RoutineWithExercises } from '@/types'
import { formatDate } from '@/lib/utils'
import { logger } from '@/lib/logger'

export function BackupManager() {
  const t = useTranslations('data')
  const tCommon = useTranslations('common')
  const { user } = useAuthStore()
  const { workouts } = useWorkoutStore()
  const { exercises } = useExerciseStore()
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadRoutines()
      loadBackups()
      startAutoBackup()
    }

    return () => {
      autoBackupService.stop()
    }
  }, [user])

  useEffect(() => {
    loadBackups()
  }, [])

  const loadRoutines = async () => {
    if (!user) return
    try {
      const result = await routineRepository.findByUserId(user.id)
      if (result.data) {
        // Load full routines with exercises
        const routinesWithExercises = await Promise.all(
          result.data.map(async (r) => {
            const fullResult = await routineRepository.findById(r.id)
            return fullResult.data || ({ ...r, exercises: [] } as RoutineWithExercises)
          })
        )
        setRoutines(routinesWithExercises)
      }
    } catch (error) {
      logger.error('Error loading routines for backup', error as Error, 'BackupManager')
    }
  }

  const loadBackups = () => {
    const backupList = getBackups()
    setBackups(backupList)
  }

  const startAutoBackup = () => {
    if (!user) return

    autoBackupService.start(async () => {
      // Load full data for backup
      const workoutsWithSets = await Promise.all(
        workouts.map(async (w) => {
          try {
            const result = await workoutRepository.findById(w.id)
            return result.data || ({ ...w, sets: [] } as WorkoutWithSets)
          } catch {
            return { ...w, sets: [] } as WorkoutWithSets
          }
        })
      )

      return {
        workouts: workoutsWithSets,
        exercises,
        routines,
      }
    })
  }

  const handleCreateBackup = async () => {
    if (!user) {
      toast.error('Debes estar autenticado para crear respaldos')
      return
    }

    setIsCreating(true)
    try {
      // Load full data for backup
      const workoutsWithSets = await Promise.all(
        workouts.map(async (w) => {
          try {
            const result = await workoutRepository.findById(w.id)
            return result.data || ({ ...w, sets: [] } as WorkoutWithSets)
          } catch {
            return { ...w, sets: [] } as WorkoutWithSets
          }
        })
      )

      const success = createBackup(workoutsWithSets, exercises, routines)
      if (success) {
        toast.success(t('backupCreated') || 'Backup created successfully')
        loadBackups()
      } else {
        toast.error('Error al crear el respaldo')
      }
    } catch (error) {
      logger.error('Error creating backup', error as Error, 'BackupManager')
      toast.error('Error al crear el respaldo')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRestoreBackup = (timestamp: string) => {
    const backupData = restoreBackup(timestamp)
    if (backupData) {
      toast.success(t('backupRestored') || 'Backup restored successfully')
      toast.info(t('importNote') || 'Note: Full restore functionality is not yet implemented')
      // TODO: Actually restore the data to the database
    } else {
      toast.error('Error al restaurar el respaldo')
    }
  }

  const handleDeleteBackup = (timestamp: string) => {
    const success = deleteBackup(timestamp)
    if (success) {
      toast.success(t('backupDeleted') || 'Backup deleted successfully')
      loadBackups()
    } else {
      toast.error('Error al eliminar el respaldo')
    }
    setDeleteDialogOpen(false)
    setBackupToDelete(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const totalSize = getTotalBackupSize()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('backup') || 'Automatic Backup'}
        </CardTitle>
        <CardDescription>{t('backupDescription') || 'Automatic backup of your data every 24 hours'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Backup Info */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="text-sm font-medium">{t('backupCount') || 'Backups saved'}</p>
            <p className="text-2xl font-bold">{backups.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{t('backupSize') || 'Total size'}</p>
            <p className="text-lg font-bold">{formatFileSize(totalSize)}</p>
          </div>
        </div>

        {/* Create Backup Button */}
        <Button onClick={handleCreateBackup} disabled={isCreating} className="w-full">
          <RefreshCw className={`h-4 w-4 mr-2 ${isCreating ? 'animate-spin' : ''}`} />
          {t('createBackup') || 'Create Backup Now'}
        </Button>

        {/* Backups List */}
        {backups.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">{t('noBackups') || 'No backups available'}</p>
        ) : (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">{t('lastBackup') || 'Recent Backups'}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {backups.slice(0, 5).map((backup) => (
                <div key={backup.timestamp} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{formatDate(backup.timestamp, 'PPp')}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {backup.workoutCount} workouts, {backup.exerciseCount} exercises, {backup.routineCount} routines
                    </p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(backup.size)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreBackup(backup.timestamp)}
                      title={t('restoreBackup') || 'Restore Backup'}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBackupToDelete(backup.timestamp)
                        setDeleteDialogOpen(true)
                      }}
                      title={t('deleteBackup') || 'Delete Backup'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('deleteBackup') || 'Delete Backup'}</DialogTitle>
              <DialogDescription>
                {tCommon('confirm') || 'Are you sure you want to delete this backup? This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => backupToDelete && handleDeleteBackup(backupToDelete)}
              >
                {tCommon('delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

