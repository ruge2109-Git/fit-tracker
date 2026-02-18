/**
 * Add Exercise to Routine Page
 * Add an exercise to a routine
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { RoutineWithExercises } from '@/types'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/logger'

const addExerciseSchema = z.object({
  exercise_id: z.string().min(1, 'Please select an exercise'),
  target_sets: z.coerce.number().min(1, 'At least 1 set required').max(20, 'Maximum 20 sets'),
  target_reps: z.coerce.number().min(1, 'At least 1 rep required').max(100, 'Maximum 100 reps'),
  target_reps_max: z.coerce.number().min(1, 'At least 1 rep required').max(100, 'Maximum 100 reps').optional(),
  target_weight: z.coerce.number().min(0, 'Weight cannot be negative').optional(),
  target_rest_time: z.coerce.number().min(0, 'Rest time cannot be negative').optional(),
})

type AddExerciseFormData = z.infer<typeof addExerciseSchema>

export default function AddExerciseToRoutinePage() {
  const params = useParams()
  const router = useNavigationRouter()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const routineId = params.id as string
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddExerciseFormData>({
    resolver: zodResolver(addExerciseSchema),
  })

  const selectedExerciseId = watch('exercise_id')

  useEffect(() => {
    loadRoutine()
  }, [routineId])

  const loadRoutine = async () => {
    setIsLoading(true)
    try {
      const result = await routineRepository.findById(routineId)
      if (result.data) {
        setRoutine(result.data)
      } else {
        toast.error(t('failedToLoad') || 'Failed to load routine')
        router.push(ROUTES.ROUTINES)
      }
    } catch (error) {
      logger.error('Error loading routine', error as Error, 'AddExerciseToRoutinePage')
      toast.error(t('failedToLoad') || 'Failed to load routine')
      router.push(ROUTES.ROUTINES)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExercise = async (data: AddExerciseFormData) => {
    setIsSubmitting(true)

    const nextOrder = routine?.exercises ? routine.exercises.length + 1 : 1

    const result = await routineRepository.addExercise({
      routine_id: routineId,
      exercise_id: data.exercise_id,
      target_sets: data.target_sets,
      target_reps: data.target_reps,
      target_reps_max: data.target_reps_max,
      target_weight: data.target_weight || undefined,
      target_rest_time: data.target_rest_time || undefined,
      order: nextOrder,
    })

    if (result.error) {
      toast.error(t('failedToAddExercise') || 'Failed to add exercise')
    } else {
      toast.success(t('exerciseAdded') || 'Exercise added successfully!')
      router.push(ROUTES.ROUTINE_DETAIL(routineId))
    }
    setIsSubmitting(false)
  }

  const handleCreateExercise = () => {
    router.push(`${ROUTES.NEW_EXERCISE}?returnTo=${encodeURIComponent(ROUTES.ROUTINE_ADD_EXERCISE(routineId))}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!routine) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.ROUTINE_DETAIL(routineId))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('addExerciseToRoutine') || 'Add Exercise to Routine'}</h1>
          <p className="text-muted-foreground">{routine.name}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('addExercise') || 'Add Exercise'}</CardTitle>
          <CardDescription>
            {t('addExerciseDescription') || 'Select an exercise and set your target sets, reps, and weight'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleAddExercise)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exercise">{tCommon('exercises') || 'Exercise'} *</Label>
              <ExerciseSelect
                value={selectedExerciseId || ''}
                onChange={(value) => setValue('exercise_id', value)}
                disabled={isSubmitting}
                onCreateExercise={handleCreateExercise}
              />
              {errors.exercise_id && (
                <p className="text-sm text-destructive">{errors.exercise_id.message}</p>
              )}
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="target_sets" className="text-xs">{t('targetSets') || 'Sets'} *</Label>
                <Input
                  id="target_sets"
                  type="number"
                  min="1"
                  {...register('target_sets')}
                  disabled={isSubmitting}
                  className="rounded-xl border-accent/10 bg-background/40 h-11"
                />
                {errors.target_sets && (
                  <p className="text-[10px] text-destructive">{errors.target_sets.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_reps" className="text-xs">{t('targetReps') || 'Reps'} *</Label>
                <Input
                  id="target_reps"
                  type="number"
                  min="1"
                  {...register('target_reps')}
                  disabled={isSubmitting}
                  className="rounded-xl border-accent/10 bg-background/40 h-11"
                />
                {errors.target_reps && (
                  <p className="text-[10px] text-destructive">{errors.target_reps.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_reps_max" className="text-xs">Max Reps</Label>
                <Input
                  id="target_reps_max"
                  type="number"
                  min="1"
                  {...register('target_reps_max')}
                  disabled={isSubmitting}
                  placeholder="Opt"
                  className="rounded-xl border-accent/10 bg-background/40 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_weight" className="text-xs">{tCommon('kg') || 'Weight'}</Label>
                <Input
                  id="target_weight"
                  type="number"
                  min="0"
                  step="0.5"
                  {...register('target_weight')}
                  disabled={isSubmitting}
                  placeholder="0"
                  className="rounded-xl border-accent/10 bg-background/40 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_rest_time" className="text-xs">{t('restTime') || 'Rest Time'} (s)</Label>
                <Input
                  id="target_rest_time"
                  type="number"
                  min="0"
                  placeholder="90"
                  {...register('target_rest_time')}
                  disabled={isSubmitting}
                  className="rounded-xl border-accent/10 bg-background/40 h-11"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.ROUTINE_DETAIL(routineId))}
                className="flex-1"
              >
                {tCommon('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting
                  ? t('adding') || 'Adding...'
                  : t('addExerciseToRoutine') || 'Add Exercise to Routine'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

