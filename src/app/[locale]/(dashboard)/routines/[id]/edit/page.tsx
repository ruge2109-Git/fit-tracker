/**
 * Edit Routine Page
 * Modify routine details, frequency, and schedule
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { RoutineWithExercises, DayOfWeek, RoutineFrequency } from '@/types'
import { ROUTINE_FREQUENCY_OPTIONS, DAYS_OF_WEEK_OPTIONS, ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'

const routineSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  frequency: z.string().optional(),
  is_active: z.boolean().optional(),
})

type RoutineFormData = z.infer<typeof routineSchema>

export default function EditRoutinePage() {
  const params = useParams()
  const router = useNavigationRouter()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const routineId = params.id as string

  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
  })

  const selectedFrequency = watch('frequency')

  useEffect(() => {
    if (routineId) {
      loadRoutine()
    }
  }, [routineId])

  const loadRoutine = async () => {
    setIsLoading(true)
    const result = await routineRepository.findById(routineId)
    
    if (result.data) {
      setRoutine(result.data)
      setValue('name', result.data.name)
      setValue('description', result.data.description || '')
      setValue('frequency', result.data.frequency || RoutineFrequency.CUSTOM)
      setValue('is_active', result.data.is_active)
      setSelectedDays(result.data.scheduled_days || [])
    } else {
      toast.error(t('routineNotFound') || 'Routine not found')
      router.push(ROUTES.ROUTINES)
    }
    setIsLoading(false)
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleSave = async (data: RoutineFormData) => {
    setIsSaving(true)

    const result = await routineRepository.update(routineId, {
      name: data.name,
      description: data.description,
      frequency: data.frequency as RoutineFrequency,
      scheduled_days: selectedDays as DayOfWeek[],
      is_active: data.is_active,
    })

    if (result.error) {
      toast.error(t('failedToUpdateRoutine') || 'Failed to update routine')
    } else {
      toast.success(t('routineUpdatedSuccessfully') || 'Routine updated successfully!')
      router.push(ROUTES.ROUTINE_DETAIL(routineId))
    }
    setIsSaving(false)
  }

  if (isLoading || !routine) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back') || 'Back'}
        </Button>
        <Button onClick={handleSubmit(handleSave)} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? t('saving') || 'Saving...' : t('saveChanges') || 'Save Changes'}
        </Button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold">{t('editRoutine') || 'Edit Routine'}</h1>
        <p className="text-muted-foreground">{t('editRoutineDescription') || 'Modify routine details and schedule'}</p>
      </div>

      {/* Routine Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('routineInformation') || 'Routine Information'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('routineName') || 'Routine Name'}</Label>
              <Input
                id="name"
                placeholder="e.g., Push Day, Leg Day"
                {...register('name')}
                disabled={isSaving}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{tCommon('description') || 'Description'} ({t('optional') || 'optional'})</Label>
              <Input
                id="description"
                placeholder={t('routineDescriptionPlaceholder') || 'Brief description of this routine'}
                {...register('description')}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">{t('frequency') || 'Frequency'}</Label>
              <Controller
                name="frequency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('howOften') || 'How often?'} />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTINE_FREQUENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {selectedFrequency === RoutineFrequency.CUSTOM && (
              <div className="space-y-2">
                <Label>{t('scheduledDays') || 'Scheduled Days'}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK_OPTIONS.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                      className="text-xs"
                      onClick={() => toggleDay(day.value)}
                      disabled={isSaving}
                    >
                      {day.short}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedDays.length > 0 
                    ? `${t('selected') || 'Selected'}: ${selectedDays.length} ${t('days') || 'day(s)'}`
                    : t('selectScheduledDays') || 'Select the days you plan to do this routine'
                  }
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Label htmlFor="is_active" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="w-4 h-4 rounded border-gray-300"
                    {...register('is_active')}
                    disabled={isSaving}
                  />
                  <span>{t('isActive') || 'Active routine'}</span>
                </div>
              </Label>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Exercise Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('exercisesInRoutine') || 'Exercises in this Routine'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('routineContainsExercises') || 'This routine contains'} {routine.exercises?.length || 0} {t('exercisesCount') || 'exercise(s)'}.
          </p>
          <p className="text-xs text-muted-foreground">
            {t('modifyExercisesNote') || 'To modify exercises, go back to the routine detail page.'}
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSubmit(handleSave)} 
        disabled={isSaving} 
        className="w-full" 
        size="lg"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? t('savingChanges') || 'Saving Changes...' : t('saveRoutine') || 'Save Routine'}
      </Button>
    </div>
  )
}

