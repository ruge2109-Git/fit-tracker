/**
 * Data Management Component
 * Allows users to export and import their data
 */

'use client'

import { useState, useEffect } from 'react'
import { Download, Upload, FileJson, FileSpreadsheet, Database, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { downloadJSON, downloadCSV, createExportData } from '@/lib/data/export'
import { importFromJSONFile, importFromCSVFile, ImportResult } from '@/lib/data/import'
import { useWorkoutStore } from '@/store/workout.store'
import { useExerciseStore } from '@/store/exercise.store'
import { useAuthStore } from '@/store/auth.store'
import { workoutRepository } from '@/domain/repositories/workout.repository'
import { exerciseRepository } from '@/domain/repositories/exercise.repository'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { logger } from '@/lib/logger'
import { Routine } from '@/types'
import { logAuditEvent } from '@/lib/audit/audit-helper'

export function DataManagement() {
  const t = useTranslations('data')
  const tCommon = useTranslations('common')
  const { user } = useAuthStore()
  const { workouts } = useWorkoutStore()
  const { exercises } = useExerciseStore()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadRoutines()
    }
  }, [user])

  const loadRoutines = async () => {
    if (!user) return
    const result = await routineRepository.findByUserId(user.id)
    if (result.data) {
      setRoutines(result.data)
    }
  }

  const handleExportJSON = async () => {
    if (!user) {
      toast.error('Debes estar autenticado para exportar datos')
      return
    }

    setIsExporting(true)
    try {
      // Load full data with sets
      const workoutsWithSets = await Promise.all(
        workouts.map(async (w) => {
          const result = await workoutRepository.findById(w.id)
          return result.data || { ...w, sets: [] }
        })
      )

      // Load full routines with exercises
      const routinesWithExercises = await Promise.all(
        routines.map(async (r) => {
          const result = await routineRepository.findById(r.id)
          return result.data || { ...r, exercises: [] }
        })
      )

      const exportData = createExportData(workoutsWithSets, exercises, routinesWithExercises)
      downloadJSON(exportData)
      
      // Log export event
      logAuditEvent({
        action: 'export_data',
        entityType: 'data',
        details: {
          format: 'json',
          workoutsCount: workoutsWithSets.length,
          exercisesCount: exercises.length,
          routinesCount: routinesWithExercises.length,
        },
      })
      
      toast.success(t('exportSuccess') || 'Datos exportados exitosamente')
    } catch (error) {
      logger.error('Error exporting JSON', error as Error, 'DataManagement')
      toast.error(t('exportError') || 'Error al exportar datos')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async () => {
    if (!user) {
      toast.error('Debes estar autenticado para exportar datos')
      return
    }

    setIsExporting(true)
    try {
      // Load full data with sets
      const workoutsWithSets = await Promise.all(
        workouts.map(async (w) => {
          const result = await workoutRepository.findById(w.id)
          return result.data || { ...w, sets: [] }
        })
      )

      // Load full routines with exercises
      const routinesWithExercises = await Promise.all(
        routines.map(async (r) => {
          const result = await routineRepository.findById(r.id)
          return result.data || { ...r, exercises: [] }
        })
      )

      const exportData = createExportData(workoutsWithSets, exercises, routinesWithExercises)
      downloadCSV(exportData)
      
      // Log export event
      logAuditEvent({
        action: 'export_data',
        entityType: 'data',
        details: {
          format: 'csv',
          workoutsCount: workoutsWithSets.length,
          exercisesCount: exercises.length,
          routinesCount: routinesWithExercises.length,
        },
      })
      
      toast.success(t('exportSuccess') || 'Datos exportados exitosamente')
    } catch (error) {
      logger.error('Error exporting CSV', error as Error, 'DataManagement')
      toast.error(t('exportError') || 'Error al exportar datos')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportFile = async (file: File, type: 'json' | 'csv') => {
    if (!user) {
      toast.error('Debes estar autenticado para importar datos')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      let result: ImportResult

      if (type === 'json') {
        result = await importFromJSONFile(file)
      } else {
        // For CSV, we only support workouts for now
        result = await importFromCSVFile(file, 'workouts')
      }

      setImportResult(result)

      if (result.success && result.data) {
        // Log import event
        logAuditEvent({
          action: 'import_data',
          entityType: 'data',
          details: {
            format: type,
            workoutsCount: result.stats?.workoutsImported || 0,
            exercisesCount: result.stats?.exercisesImported || 0,
            routinesCount: result.stats?.routinesImported || 0,
            warnings: result.warnings?.length || 0,
          },
        })
        
        // TODO: Actually import the data to the database
        // This would require creating workouts, exercises, routines through the repositories
        toast.success(t('importSuccess') || 'Datos importados exitosamente')
        toast.info(t('importNote') || 'Nota: La importación completa aún no está implementada')
      } else {
        toast.error(result.errors?.join(', ') || t('importError') || 'Error al importar datos')
      }
    } catch (error) {
      logger.error('Error importing file', error as Error, 'DataManagement')
      toast.error(t('importError') || 'Error al importar datos')
      setImportResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('title') || 'Gestión de Datos'}
        </CardTitle>
        <CardDescription>{t('description') || 'Exporta o importa tus datos de entrenamiento'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Section */}
        <div className="space-y-2">
          <h3 className="font-semibold">{t('export') || 'Exportar Datos'}</h3>
          <p className="text-sm text-muted-foreground">
            {t('exportDescription') || 'Descarga una copia de todos tus datos en formato JSON o CSV'}
          </p>
          <div className="flex gap-2">
            <Button onClick={handleExportJSON} disabled={isExporting} variant="outline" className="flex-1">
              <FileJson className="h-4 w-4 mr-2" />
              {t('exportJSON') || 'Exportar JSON'}
            </Button>
            <Button onClick={handleExportCSV} disabled={isExporting} variant="outline" className="flex-1">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t('exportCSV') || 'Exportar CSV'}
            </Button>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-2">
          <h3 className="font-semibold">{t('import') || 'Importar Datos'}</h3>
          <p className="text-sm text-muted-foreground">
            {t('importDescription') || 'Importa datos desde un archivo JSON o CSV'}
          </p>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {t('importData') || 'Importar Datos'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('importData') || 'Importar Datos'}</DialogTitle>
                <DialogDescription>
                  {t('importDialogDescription') || 'Selecciona un archivo JSON o CSV para importar'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('importJSON') || 'Importar desde JSON'}</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImportFile(file, 'json')
                      }
                    }}
                    disabled={isImporting}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('importCSV') || 'Importar desde CSV'}</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImportFile(file, 'csv')
                      }
                    }}
                    disabled={isImporting}
                    className="w-full"
                  />
                </div>

                {importResult && (
                  <div
                    className={`p-4 rounded-lg border ${
                      importResult.success
                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold">
                          {importResult.success ? t('importSuccess') || 'Importación exitosa' : t('importError') || 'Error en importación'}
                        </p>
                        {importResult.success ? (
                          <div className="space-y-1 text-sm">
                            {importResult.stats && (
                              <div>
                                <p>
                                  {t('workoutsImported') || 'Entrenamientos importados'}: {importResult.stats.workoutsImported}
                                </p>
                                <p>
                                  {t('exercisesImported') || 'Ejercicios importados'}: {importResult.stats.exercisesImported}
                                </p>
                                <p>
                                  {t('routinesImported') || 'Rutinas importadas'}: {importResult.stats.routinesImported}
                                </p>
                              </div>
                            )}
                            {importResult.warnings && importResult.warnings.length > 0 && (
                              <div className="mt-2">
                                <p className="font-semibold">{t('warnings') || 'Advertencias'}:</p>
                                <ul className="list-disc list-inside">
                                  {importResult.warnings.map((warning, i) => (
                                    <li key={i} className="text-sm">
                                      {warning}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">
                            {importResult.errors && (
                              <ul className="list-disc list-inside">
                                {importResult.errors.map((error, i) => (
                                  <li key={i}>{error}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  {tCommon('close')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

