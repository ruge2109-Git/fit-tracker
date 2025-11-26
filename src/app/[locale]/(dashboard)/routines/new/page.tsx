/**
 * New Routine Page
 * Create a new workout routine
 */

'use client'

import { useState } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { useAuthStore } from '@/store/auth.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { RoutineFrequency, DayOfWeek } from '@/types'
import { getRoutineFrequencyOptions, getDaysOfWeekOptions, ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'

interface RoutineExercise {
  exercise_id: string
  target_sets: number
  target_reps: number
  target_weight?: number
  order: number
}

const routineSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  frequency: z.string().optional(),
  scheduled_days: z.array(z.string()).optional(),
})

type RoutineFormData = z.infer<typeof routineSchema>

export default function NewRoutinePage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [currentExercise, setCurrentExercise] = useState<Partial<RoutineExercise>>({
    exercise_id: '',
    target_sets: 3,
    target_reps: 10,
    target_weight: 0,
  })

  const routineFrequencyOptions = getRoutineFrequencyOptions(t)
  const daysOfWeekOptions = getDaysOfWeekOptions(t)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      frequency: RoutineFrequency.CUSTOM,
    },
  })

  const selectedFrequency = watch('frequency') as RoutineFrequency

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleAddExercise = () => {
    if (!currentExercise.exercise_id) {
      toast.error(t('pleaseSelectExercise') || 'Please select an exercise')
      return
    }

    const newExercise: RoutineExercise = {
      exercise_id: currentExercise.exercise_id,
      target_sets: currentExercise.target_sets || 3,
      target_reps: currentExercise.target_reps || 10,
      target_weight: currentExercise.target_weight,
      order: exercises.length + 1,
    }

    setExercises([...exercises, newExercise])
    setCurrentExercise({
      exercise_id: '',
      target_sets: 3,
      target_reps: 10,
      target_weight: 0,
    })
    toast.success(t('exerciseAdded') || 'Exercise added!')
  }

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index).map((ex, i) => ({ ...ex, order: i + 1 })))
  }

  const handleCreateRoutine = async (data: RoutineFormData) => {
    if (!user) {
      toast.error(tCommon('notAuthenticated') || 'You must be logged in')
      return
    }

    setIsSubmitting(true)

    try {
      const routineData = {
        name: data.name,
        description: data.description || undefined,
        frequency: (data.frequency as RoutineFrequency) || RoutineFrequency.CUSTOM,
        scheduled_days: selectedFrequency === RoutineFrequency.CUSTOM ? (selectedDays as DayOfWeek[]) : undefined,
      }

      const result = await routineRepository.create({
        ...routineData,
        user_id: user.id,
        is_active: true,
      })

      if (result.error) {
        const errorMessage = typeof result.error === 'string' ? result.error : (result.error as Error)?.message || 'Failed to create routine'
        throw new Error(errorMessage)
      }

      if (result.data) {
        const routineId = result.data.id
        
        // Add exercises if any
        if (exercises.length > 0) {
          for (const exercise of exercises) {
            await routineRepository.addExercise({
              routine_id: routineId,
              exercise_id: exercise.exercise_id,
              target_sets: exercise.target_sets,
              target_reps: exercise.target_reps,
              target_weight: exercise.target_weight,
              order: exercise.order,
            })
          }
        }
        
        await logAuditEvent({
          action: 'create_routine',
          entityType: 'routine',
          entityId: routineId,
          details: { name: data.name },
        })

        toast.success(t('routineCreated') || 'Routine created successfully!')
        router.push(ROUTES.ROUTINE_DETAIL(routineId))
      } else {
        throw new Error('Failed to create routine')
      }
    } catch (error) {
      logger.error('Error creating routine:', error as Error)
      toast.error(t('failedToCreateRoutine') || 'Failed to create routine')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(ROUTES.ROUTINES)}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('createRoutine') || 'Create Routine'}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('createRoutineDescription') || 'Create a workout template to quickly start your training sessions'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('routineInformation') || 'Routine Information'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleCreateRoutine)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('routineName') || 'Routine Name'}</Label>
              <Input
                id="name"
                placeholder="e.g., Push Day, Leg Day"
                {...register('name')}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {tCommon('description') || 'Description'} ({t('optional') || 'optional'})
              </Label>
              <Input
                id="description"
                placeholder={t('routineDescriptionPlaceholder') || 'Brief description of this routine'}
                {...register('description')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">{t('frequency') || 'Frequency'}</Label>
              <Controller
                name="frequency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('howOften') || 'How often?'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {routineFrequencyOptions.map((option) => (
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
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {daysOfWeekOptions.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      className="justify-center text-xs font-semibold"
                      onClick={() => toggleDay(day.value)}
                      disabled={isSubmitting}
                    >
                      {day.short}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('selectScheduledDays') || 'Select the days you plan to do this routine'}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.ROUTINES)}
                disabled={isSubmitting}
                className="flex-1"
              >
                {tCommon('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? t('creating') || 'Creating...' : t('createRoutine') || 'Create Routine'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Add Exercises Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('addExercises') || 'Add Exercises'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label className="text-sm">{tCommon('exercises') || 'Exercise'} *</Label>
              <ExerciseSelect
                value={currentExercise.exercise_id || ''}
                onChange={(value) => setCurrentExercise({ ...currentExercise, exercise_id: value })}
                onCreateExercise={() => router.push(`${ROUTES.NEW_EXERCISE}?returnTo=${encodeURIComponent(ROUTES.NEW_ROUTINE)}`)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_sets" className="text-sm">{t('targetSets') || 'Target Sets'} *</Label>
              <Input
                id="target_sets"
                type="number"
                min="1"
                max="20"
                value={currentExercise.target_sets}
                onChange={(e) => setCurrentExercise({ ...currentExercise, target_sets: parseInt(e.target.value) || 3 })}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_reps" className="text-sm">{t('targetReps') || 'Target Reps'} *</Label>
              <Input
                id="target_reps"
                type="number"
                min="1"
                max="100"
                value={currentExercise.target_reps}
                onChange={(e) => setCurrentExercise({ ...currentExercise, target_reps: parseInt(e.target.value) || 10 })}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_weight" className="text-sm">{t('targetWeight') || 'Weight (kg)'}</Label>
              <Input
                id="target_weight"
                type="number"
                min="0"
                step="0.5"
                value={currentExercise.target_weight || 0}
                onChange={(e) => setCurrentExercise({ ...currentExercise, target_weight: parseFloat(e.target.value) || 0 })}
                placeholder={t('optional') || 'Optional'}
                className="text-sm"
              />
            </div>
          </div>

          <Button onClick={handleAddExercise} className="w-full" disabled={!currentExercise.exercise_id}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addExercise') || 'Add Exercise'}
          </Button>

          {exercises.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold text-sm sm:text-base">{t('exercises') || 'Exercises'} ({exercises.length})</h3>
              <div className="space-y-2">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 sm:p-3 border rounded-lg gap-2"
                  >
                    <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">
                      {t('exercise') || 'Exercise'} {index + 1}: {exercise.target_sets} {t('sets') || 'sets'} × {exercise.target_reps} {t('reps') || 'reps'}
                      {exercise.target_weight && exercise.target_weight > 0 && ` @ ${exercise.target_weight} kg`}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                      onClick={() => handleRemoveExercise(index)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

