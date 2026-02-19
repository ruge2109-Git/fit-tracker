/**
 * Body Measurements Page
 * Displays all user body measurements grouped by type with charts and tables
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Scale, TrendingUp, TrendingDown, Edit, Trash2, Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MeasurementForm } from '@/components/body-measurements/measurement-form'
import { MeasurementChart } from '@/components/body-measurements/measurement-chart'
import { useAuthStore } from '@/store/auth.store'
import { useBodyMeasurementStore } from '@/store/body-measurement.store'
import { useGoalStore } from '@/store/goal.store'
import { BodyMeasurement, BodyMeasurementFormData, MeasurementType, GoalType } from '@/types'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useSafeLoading } from '@/hooks/use-safe-async'
import { formatDate, cn } from '@/lib/utils'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { ROUTES } from '@/lib/constants'

export default function BodyMeasurementsPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const { measurements, loadMeasurements, createMeasurement, deleteMeasurement, isLoading } = useBodyMeasurementStore()
  const { activeGoals, loadActiveGoals } = useGoalStore()
  const t = useTranslations('bodyMeasurements')
  const tCharts = useTranslations('charts')
  const tCommon = useTranslations('common')
  const { isLoading: isSafeLoading, setLoading } = useSafeLoading()
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-400">
      {/* Header - Compact & Styled */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60 italic mb-1">
            {t('title') || 'Body Measurements'}
          </h1>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground/90">
             {tCharts('progress') || 'Progress'}
          </h2>
        </div>
        
        <Drawer open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DrawerTrigger asChild>
            <Button 
              size="sm"
              className="h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-primary text-white shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all pt-6 pb-6 w-full sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              {t('addMeasurement')}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>{t('addMeasurement')}</DrawerTitle>
                  <DrawerDescription>{t('addMeasurementDescription')}</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 pb-0">
                    <MeasurementForm
                      onSubmit={handleCreateMeasurement}
                      isLoading={isLoading || isSafeLoading}
                    />
                </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Measurements Grouped by Type */}
      {isLoading && measurements.length === 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
               <div className="h-48 rounded-[2rem] bg-accent/5 animate-pulse" />
               <div className="h-48 rounded-[2rem] bg-accent/5 animate-pulse" />
            </div>
             <div className="space-y-4">
               <div className="h-48 rounded-[2rem] bg-accent/5 animate-pulse" />
            </div>
        </div>
      ) : measurementTypes.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none bg-accent/5 overflow-hidden shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center opacity-60">
            <div className="h-16 w-16 bg-background/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm backdrop-blur-sm">
                <Ruler className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-black italic tracking-tight mb-2 text-foreground/80 lowercase first-letter:uppercase">{t('noMeasurements')}</h3>
            <p className="text-sm font-medium text-muted-foreground mb-6 max-w-xs mx-auto">
              Start tracking your body metrics to see your progress over time.
            </p>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(true)}
              className="rounded-xl border-none bg-background shadow-sm hover:bg-background/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addFirstMeasurement')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {measurementTypes.map((type) => {
            const typeMeasurements = measurementsByType[type] || []
            const goal = type === MeasurementType.WEIGHT ? weightGoal : null
            const typeLabel = t(getTypeTranslationKey(type) as any) || type
            const latestValue = typeMeasurements[0]?.value
            const latestUnit = typeMeasurements[0]?.unit

            return (
              <AccordionItem key={type} value={type} className="border-none bg-accent/5 rounded-[2.5rem] overflow-hidden">
                <AccordionTrigger className="hover:no-underline pt-6 pb-6 py-4">
                   <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-sm text-primary shrink-0">
                            <Scale className="h-6 w-6" />
                         </div>
                         <div className="text-left">
                            <h3 className="text-xl font-black italic tracking-tighter text-foreground/90 lowercase first-letter:uppercase">
                                {typeLabel}
                            </h3>
                            {latestValue && (
                                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                                    Latest: <span className="text-foreground font-bold">{latestValue.toFixed(1)} {latestUnit}</span>
                                </p>
                            )}
                         </div>
                      </div>
                      <Badge variant="secondary" className="mr-4 rounded-xl pt-3 pb-3 text-[10px] font-bold uppercase tracking-wider bg-background text-muted-foreground shadow-sm hover:bg-background">
                        {typeMeasurements.length} {type === MeasurementType.WEIGHT ? 'Entries' : 'Rec'}
                      </Badge>
                   </div>
                </AccordionTrigger>
                
                <AccordionContent className="p-0 pb-6">
                  <div className="grid lg:grid-cols-3 gap-0">
                     {/* Chart Section */}
                     <div className="lg:col-span-2 pt-6 pb-6 pt-2">
                        {typeMeasurements.length > 0 ? (
                            <div className="bg-accent/10 rounded-[2rem] p-4 shadow-lg border-none">
                              <MeasurementChart
                                measurements={typeMeasurements}
                                goal={goal}
                                title=""
                              />
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs font-medium bg-background/30 rounded-[2rem]">
                                No data for chart
                            </div>
                        )}
                     </div>

                     {/* Table Section */}
                     <div className="lg:col-span-1 p-4 pt-0 lg:pt-6 lg:pl-0">
                        <div className="bg-background/80 backdrop-blur-sm rounded-[2rem] overflow-hidden shadow-sm border border-border/5 h-full max-h-[400px] flex flex-col">
                          <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                            <Table>
                              <TableHeader>
                                <TableRow className="hover:bg-transparent border-none">
                                  <TableHead className="w-[30%] text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 pl-4">{t('date')}</TableHead>
                                  <TableHead className="w-[30%] text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{t('value')}</TableHead>
                                  <TableHead className="w-[20%] text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 text-right pr-4">{t('change')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {typeMeasurements.map((measurement, index) => {
                                  const change = getChange(measurement, typeMeasurements, index)
                                  
                                  return (
                                    <TableRow key={measurement.id} className="hover:bg-accent/5 border-none group">
                                      <TableCell className="py-2.5 pl-4 text-xs font-semibold text-muted-foreground">
                                        {formatDate(measurement.measurement_date, 'MMM d')}
                                      </TableCell>
                                      <TableCell className="py-2.5 font-bold text-sm text-foreground">
                                        {measurement.value.toFixed(1)} <span className="text-[10px] font-medium text-muted-foreground">{measurement.unit}</span>
                                      </TableCell>
                                      <TableCell className="py-2.5 pr-4 text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                          {change ? (
                                            <div className="flex items-center justify-end gap-1">
                                              
                                              <span className={cn("text-xs font-bold", change.isPositive ? 'text-green-500' : 'text-red-500')}>
                                                {change.value.toFixed(1)}
                                              </span>
                                              {change.isPositive ? (
                                                <TrendingDown className="h-2.5 w-2.5 text-green-500" />
                                              ) : (
                                                <TrendingUp className="h-2.5 w-2.5 text-red-500" />
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-muted-foreground/40 text-[10px] font-bold">-</span>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                     </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

    </div>
  )
}
