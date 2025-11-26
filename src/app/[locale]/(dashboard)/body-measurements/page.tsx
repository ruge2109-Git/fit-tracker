/**
 * Body Measurements Page
 * Displays all user body measurements grouped by type with charts and tables
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Scale, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MeasurementForm } from '@/components/body-measurements/measurement-form'
import { MeasurementChart } from '@/components/body-measurements/measurement-chart'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { useAuthStore } from '@/store/auth.store'
import { useBodyMeasurementStore } from '@/store/body-measurement.store'
import { useGoalStore } from '@/store/goal.store'
import { BodyMeasurement, BodyMeasurementFormData, MeasurementType, GoalType } from '@/types'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useSafeLoading } from '@/hooks/use-safe-async'
import { formatDate } from '@/lib/utils'

export default function BodyMeasurementsPage() {
  const { user } = useAuthStore()
  const { measurements, loadMeasurements, createMeasurement, updateMeasurement, deleteMeasurement, isLoading } = useBodyMeasurementStore()
  const { activeGoals, loadActiveGoals } = useGoalStore()
  const t = useTranslations('bodyMeasurements')
  const tCommon = useTranslations('common')
  const { isLoading: isSafeLoading, setLoading } = useSafeLoading()
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null)

  useEffect(() => {
    if (user) {
      loadMeasurements(user.id)
      loadActiveGoals(user.id)
    }
  }, [user, loadMeasurements, loadActiveGoals])

  const handleCreateMeasurement = async (data: BodyMeasurementFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const measurementId = await createMeasurement(user.id, data)
      if (measurementId) {
        toast.success(t('measurementCreated') || 'Measurement created successfully!')
        setCreateDialogOpen(false)
        await loadMeasurements(user.id)
      } else {
        toast.error(t('errorCreatingMeasurement') || 'Failed to create measurement')
      }
    } catch (error) {
      toast.error(t('errorCreatingMeasurement') || 'Failed to create measurement')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMeasurement = async (data: BodyMeasurementFormData) => {
    if (!editingMeasurement) return

    setLoading(true)
    try {
      const success = await updateMeasurement(editingMeasurement.id, data)
      if (success) {
        toast.success(t('measurementUpdated') || 'Measurement updated successfully!')
        setEditingMeasurement(null)
        if (user) {
          await loadMeasurements(user.id)
        }
      } else {
        toast.error(t('errorUpdatingMeasurement') || 'Failed to update measurement')
      }
    } catch (error) {
      toast.error(t('errorUpdatingMeasurement') || 'Failed to update measurement')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMeasurement = async (id: string) => {
    const confirmMessage = t('confirmDelete') || 'Are you sure you want to delete this measurement?'
    if (!window.confirm(confirmMessage)) return

    setLoading(true)
    try {
      const success = await deleteMeasurement(id)
      if (success) {
        toast.success(t('measurementDeleted') || 'Measurement deleted successfully!')
        if (user) {
          await loadMeasurements(user.id)
        }
      } else {
        toast.error(t('errorDeletingMeasurement') || 'Failed to delete measurement')
      }
    } catch (error) {
      toast.error(t('errorDeletingMeasurement') || 'Failed to delete measurement')
    } finally {
      setLoading(false)
    }
  }

  // Group measurements by type
  const measurementsByType = useMemo(() => {
    const grouped: Record<string, BodyMeasurement[]> = {}
    measurements.forEach((m) => {
      if (!grouped[m.measurement_type]) {
        grouped[m.measurement_type] = []
      }
      grouped[m.measurement_type].push(m)
    })
    
    // Sort each group by date descending (most recent first)
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => 
        new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime()
      )
    })
    
    return grouped
  }, [measurements])

  // Get weight goal for comparison
  const weightGoal = useMemo(() => {
    return activeGoals.find(g => g.type === GoalType.WEIGHT) || null
  }, [activeGoals])

  // Get unique measurement types sorted
  const measurementTypes = useMemo(() => {
    const types = Array.from(new Set(measurements.map(m => m.measurement_type)))
    // Sort by type order (weight first, then others)
    const typeOrder: Record<string, number> = {
      [MeasurementType.WEIGHT]: 0,
      [MeasurementType.BODY_FAT]: 1,
      [MeasurementType.CHEST]: 2,
      [MeasurementType.WAIST]: 3,
      [MeasurementType.HIPS]: 4,
      [MeasurementType.BICEPS]: 5,
      [MeasurementType.THIGHS]: 6,
      [MeasurementType.NECK]: 7,
      [MeasurementType.SHOULDERS]: 8,
      [MeasurementType.FOREARMS]: 9,
      [MeasurementType.CALVES]: 10,
      [MeasurementType.CUSTOM]: 11,
    }
    return types.sort((a, b) => (typeOrder[a] ?? 99) - (typeOrder[b] ?? 99))
  }, [measurements])

  // Map enum values to translation keys
  const getTypeTranslationKey = (type: string): string => {
    const typeMap: Record<string, string> = {
      'weight': 'types.weight',
      'body_fat': 'types.bodyFat',
      'chest': 'types.chest',
      'waist': 'types.waist',
      'hips': 'types.hips',
      'biceps': 'types.biceps',
      'thighs': 'types.thighs',
      'neck': 'types.neck',
      'shoulders': 'types.shoulders',
      'forearms': 'types.forearms',
      'calves': 'types.calves',
      'custom': 'types.custom',
    }
    return typeMap[type] || `types.${type}`
  }

  // Calculate change from previous measurement
  const getChange = (current: BodyMeasurement, typeMeasurements: BodyMeasurement[], currentIndex: number): { value: number; isPositive: boolean } | null => {
    if (currentIndex === 0) return null
    
    const previous = typeMeasurements[currentIndex - 1]
    if (!previous) return null
    
    const change = current.value - previous.value
    // For weight and body fat, decrease is positive; for others, increase is positive
    const isPositive = (current.measurement_type === MeasurementType.WEIGHT || 
                       current.measurement_type === MeasurementType.BODY_FAT) 
                      ? change < 0 
                      : change > 0
    
    return { value: Math.abs(change), isPositive }
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('addMeasurement')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('addMeasurement')}</DialogTitle>
              <DialogDescription>{t('addMeasurementDescription')}</DialogDescription>
            </DialogHeader>
            <MeasurementForm
              onSubmit={handleCreateMeasurement}
              isLoading={isLoading || isSafeLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Measurements Grouped by Type */}
      {isLoading && measurements.length === 0 ? (
        <div className="space-y-2">
          <TableSkeleton rows={3} />
          <TableSkeleton rows={3} />
        </div>
      ) : measurementTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scale className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              {t('noMeasurements')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addFirstMeasurement')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {measurementTypes.map((type) => {
            const typeMeasurements = measurementsByType[type] || []
            const goal = type === MeasurementType.WEIGHT ? weightGoal : null
            const typeLabel = t(getTypeTranslationKey(type) as any) || type

            return (
              <AccordionItem key={type} value={type} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{typeLabel}</span>
                      <Badge variant="secondary" className="text-xs">
                        {typeMeasurements.length} {typeMeasurements.length === 1 ? t('measurement') : t('measurements')}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  {/* Chart */}
                  {typeMeasurements.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <MeasurementChart
                          measurements={typeMeasurements}
                          goal={goal}
                          title=""
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Table */}
                  {typeMeasurements.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px]">{t('date')}</TableHead>
                            <TableHead className="w-[100px]">{t('value')}</TableHead>
                            <TableHead className="w-[80px]">{t('unit')}</TableHead>
                            <TableHead className="w-[100px]">{t('change')}</TableHead>
                            <TableHead>{t('notes')}</TableHead>
                            <TableHead className="w-[100px] text-right">{tCommon('actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {typeMeasurements.map((measurement, index) => {
                            const change = getChange(measurement, typeMeasurements, index)
                            
                            return (
                              <TableRow key={measurement.id}>
                                <TableCell className="font-medium">
                                  {formatDate(measurement.measurement_date, 'PP')}
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {measurement.value.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {measurement.unit}
                                </TableCell>
                                <TableCell>
                                  {change ? (
                                    <div className="flex items-center gap-1">
                                      {change.isPositive ? (
                                        <TrendingDown className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <TrendingUp className="h-4 w-4 text-red-600" />
                                      )}
                                      <span className={change.isPositive ? 'text-green-600' : 'text-red-600'}>
                                        {change.value.toFixed(2)} {measurement.unit}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {measurement.notes || (
                                    <span className="text-muted-foreground">{tCommon('noNotes')}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setEditingMeasurement(measurement)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteMeasurement(measurement.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Edit Dialog */}
      {editingMeasurement && (
        <Dialog open={!!editingMeasurement} onOpenChange={(open) => !open && setEditingMeasurement(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('editMeasurement')}</DialogTitle>
              <DialogDescription>{t('editMeasurementDescription')}</DialogDescription>
            </DialogHeader>
            <MeasurementForm
              onSubmit={handleUpdateMeasurement}
              defaultValues={editingMeasurement}
              isLoading={isLoading || isSafeLoading}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
