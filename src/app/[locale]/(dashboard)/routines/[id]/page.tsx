/**
 * Routine Detail Page
 * View and manage routine exercises
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ArrowLeft, Plus, Trash2, Dumbbell, Edit, Copy, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { SortableExerciseItem } from '@/components/routines/sortable-exercise-item'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { RoutineWithExercises, ExerciseFormData } from '@/types'
import { ROUTES, ROUTINE_FREQUENCY_OPTIONS, DAYS_OF_WEEK_OPTIONS, getExerciseTypeOptions, getMuscleGroupOptions } from '@/lib/constants'
import { useExerciseStore } from '@/store/exercise.store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const addExerciseSchema = z.object({
  exercise_id: z.string().min(1, 'Please select an exercise'),
  target_sets: z.coerce.number().min(1, 'At least 1 set required').max(20, 'Maximum 20 sets'),
  target_reps: z.coerce.number().min(1, 'At least 1 rep required').max(100, 'Maximum 100 reps'),
  target_weight: z.coerce.number().min(0, 'Weight cannot be negative').optional(),
})

const createExerciseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string(),
  muscle_group: z.string(),
  description: z.string().optional(),
})

type AddExerciseFormData = z.infer<typeof addExerciseSchema>
type CreateExerciseFormData = z.infer<typeof createExerciseSchema>

export default function RoutineDetailPage() {
  const params = useParams()
  const router = useNavigationRouter()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const tExerciseTypes = useTranslations('exerciseTypes')
  const tMuscleGroups = useTranslations('muscleGroups')
  
  const exerciseTypeOptions = getExerciseTypeOptions(tExerciseTypes)
  const muscleGroupOptions = getMuscleGroupOptions(tMuscleGroups)
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [showCreateExercise, setShowCreateExercise] = useState(false)
  const [isCreatingExercise, setIsCreatingExercise] = useState(false)
  const routineId = params.id as string
  const { createExercise, loadExercises } = useExerciseStore()

  // Drag and drop sensors - optimized for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AddExerciseFormData>({
    resolver: zodResolver(addExerciseSchema),
    defaultValues: {
      target_sets: 3,
      target_reps: 10,
      target_weight: 0,
    },
  })

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    setValue: setValueCreate,
    formState: { errors: errorsCreate },
    reset: resetCreate,
  } = useForm<CreateExerciseFormData>({
    resolver: zodResolver(createExerciseSchema),
  })

  const selectedExerciseId = watch('exercise_id')

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
    } else {
      toast.error(t('failedToLoad') || 'Failed to load routine')
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete') || 'Are you sure you want to delete this routine?')) return

    const result = await routineRepository.delete(routineId)
    if (result.data) {
      toast.success(t('routineDeleted') || 'Routine deleted')
      router.push(ROUTES.ROUTINES)
    } else {
      toast.error(t('failedToDelete') || 'Failed to delete routine')
    }
  }

  const handleToggleActive = async () => {
    if (!routine) return

    const result = await routineRepository.update(routineId, {
      is_active: !routine.is_active,
    })

    if (result.data) {
      toast.success(routine.is_active ? t('routineDeactivated') || 'Routine deactivated' : t('routineActivated') || 'Routine activated')
      loadRoutine()
    } else {
      toast.error(t('failedToUpdate') || 'Failed to update routine')
    }
  }

  const handleDuplicate = async () => {
    if (!routine) return

    setIsDuplicating(true)
    try {
      // Create new routine with "Copy of" prefix
      const newRoutineResult = await routineRepository.create({
        user_id: routine.user_id,
        name: `${t('copyOf') || 'Copy of'} ${routine.name}`,
        description: routine.description,
        is_active: false,
        frequency: routine.frequency,
        scheduled_days: routine.scheduled_days,
      })

      if (newRoutineResult.error || !newRoutineResult.data) {
        throw new Error('Failed to create routine copy')
      }

      const newRoutineId = newRoutineResult.data.id

      // Copy all exercises
      if (routine.exercises && routine.exercises.length > 0) {
        for (const exercise of routine.exercises) {
          await routineRepository.addExercise({
            routine_id: newRoutineId,
            exercise_id: exercise.exercise_id,
            target_sets: exercise.target_sets,
            target_reps: exercise.target_reps,
            target_weight: exercise.target_weight,
            order: exercise.order,
          })
        }
      }

      toast.success(t('routineDuplicated') || 'Routine duplicated successfully!')
      router.push(ROUTES.ROUTINE_DETAIL(newRoutineId))
    } catch (error) {
      toast.error(t('failedToDuplicate') || 'Failed to duplicate routine')
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleCreateExercise = async (data: CreateExerciseFormData) => {
    setIsCreatingExercise(true)
    try {
      const exerciseId = await createExercise({
        name: data.name,
        type: data.type as any,
        muscle_group: data.muscle_group as any,
        description: data.description,
      })
      if (exerciseId) {
        await loadExercises()
        setValue('exercise_id', exerciseId)
        setShowCreateExercise(false)
        resetCreate()
        toast.success(t('exerciseCreated') || 'Exercise created successfully!')
      } else {
        toast.error(t('failedToCreateExercise') || 'Failed to create exercise')
      }
    } catch (error) {
      toast.error(t('failedToCreateExercise') || 'Failed to create exercise')
    } finally {
      setIsCreatingExercise(false)
    }
  }

  const handleOpenCreateExercise = () => {
    setShowCreateExercise(true)
  }

  const handleAddExercise = async (data: AddExerciseFormData) => {
    setIsSubmitting(true)

    const nextOrder = routine?.exercises ? routine.exercises.length + 1 : 1

    const result = await routineRepository.addExercise({
      routine_id: routineId,
      exercise_id: data.exercise_id,
      target_sets: data.target_sets,
      target_reps: data.target_reps,
      target_weight: data.target_weight || undefined,
      order: nextOrder,
    })

    if (result.error) {
      toast.error(t('failedToAddExercise') || 'Failed to add exercise')
    } else {
      toast.success(t('exerciseAdded') || 'Exercise added successfully!')
      reset()
      setDialogOpen(false)
      loadRoutine()
    }
    setIsSubmitting(false)
  }

  const handleRemoveExercise = async (routineExerciseId: string) => {
    if (!confirm(t('confirmRemoveExercise') || 'Remove this exercise from the routine?')) return

    const result = await routineRepository.removeExercise(routineExerciseId)
    
    if (result.error) {
      toast.error(t('failedToRemoveExercise') || 'Failed to remove exercise')
    } else {
      toast.success(t('exerciseRemoved') || 'Exercise removed')
      loadRoutine()
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !routine || !routine.exercises) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Find indices
    const oldIndex = routine.exercises.findIndex(ex => ex.id === activeId)
    const newIndex = routine.exercises.findIndex(ex => ex.id === overId)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder in state (optimistic update)
    const sortedExercises = [...routine.exercises].sort((a, b) => a.order - b.order)
    const newExercises = arrayMove(sortedExercises, oldIndex, newIndex)

    // Update order values
    const updates = newExercises.map((exercise, index) => ({
      id: exercise.id,
      order: index + 1,
    }))

    // Update UI immediately
    setRoutine({
      ...routine,
      exercises: newExercises.map((ex, idx) => ({ ...ex, order: idx + 1 })),
    })

    // Save to database
    setIsReordering(true)
    const result = await routineRepository.updateExercisesOrder(updates)

    if (result.error) {
      toast.error('Failed to reorder exercises')
      // Revert on error
      loadRoutine()
    } else {
      toast.success(t('exercisesReordered') || 'Exercises reordered')
    }
    setIsReordering(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Routine not found</p>
        <Button onClick={() => router.push(ROUTES.ROUTINES)} className="mt-4">
          {t('backToRoutines') || 'Back to Routines'}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back') || 'Back'}
        </Button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <Button 
            variant="outline" 
            onClick={handleDuplicate} 
            disabled={isDuplicating}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            <Copy className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {isDuplicating ? t('duplicating') || 'Duplicating...' : t('duplicate') || 'Duplicate'}
            </span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(ROUTES.ROUTINE_EDIT(routineId))}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{tCommon('edit') || 'Edit'}</span>
          </Button>
          <Button
            variant={routine.is_active ? 'outline' : 'default'}
            onClick={handleToggleActive}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            {routine.is_active ? t('deactivate') || 'Deactivate' : t('activate') || 'Activate'}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{tCommon('delete') || 'Delete'}</span>
          </Button>
        </div>
      </div>

      {/* Routine Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{routine.name}</CardTitle>
            {routine.is_active && (
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                {tCommon('active') || 'Active'}
              </span>
            )}
          </div>
          {routine.description && (
            <CardDescription>{routine.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{routine.exercises?.length || 0} {tCommon('exercises') || 'exercises'}</span>
            <span>•</span>
            <span>{t('created') || 'Created'} {new Date(routine.created_at).toLocaleDateString()}</span>
          </div>

          {routine.frequency && routine.frequency !== 'custom' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{t('frequency') || 'Frequency'}:</span>
              <span className="text-muted-foreground">
                {ROUTINE_FREQUENCY_OPTIONS.find(opt => opt.value === routine.frequency)?.label}
              </span>
            </div>
          )}

          {routine.scheduled_days && routine.scheduled_days.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">{t('scheduledDays') || 'Scheduled Days'}:</span>
              <div className="flex flex-wrap gap-2">
                {routine.scheduled_days.map((day) => {
                  const dayInfo = DAYS_OF_WEEK_OPTIONS.find(d => d.value === day)
                  return (
                    <span
                      key={day}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                    >
                      {dayInfo?.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{tCommon('exercises') || 'Exercises'}</h2>
            {routine.exercises && routine.exercises.length > 1 && (
              <p className="text-sm text-muted-foreground mt-1">
                {t('dragToReorder') || 'Drag the grip icon (⋮⋮) to reorder exercises'}
              </p>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isReordering}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addExercise') || 'Add Exercise'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0 overflow-hidden">
              <DialogDescription className="sr-only">
                {t('addExerciseDescription') ||
                  'Select an exercise and set your target sets, reps, and weight'}
              </DialogDescription>
              <div className="grid md:grid-cols-[220px_1fr]">
                <div className="bg-muted/50 p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('addExercise') || 'Add Exercise'}
                    </p>
                    <h3 className="text-xl font-semibold mt-2">{routine.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('addExerciseDescription') ||
                        'Select an exercise and set your target sets, reps, and weight'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-dashed border-muted-foreground/40 p-3 text-xs text-muted-foreground">
                    {t('exercisesInRoutine') || 'Exercises in Routine'}: {routine.exercises?.length || 0}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <DialogHeader>
                    <DialogTitle>
                      {showCreateExercise
                        ? t('createNewExercise') || 'Create New Exercise'
                        : t('addExerciseToRoutine') || 'Add Exercise to Routine'}
                    </DialogTitle>
                  </DialogHeader>

                  {showCreateExercise ? (
                    <form onSubmit={handleSubmitCreate(handleCreateExercise)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{tCommon('name') || 'Name'}</Label>
                        <Input
                          id="name"
                          {...registerCreate('name')}
                          placeholder="Bench Press"
                          disabled={isCreatingExercise}
                        />
                        {errorsCreate.name && (
                          <p className="text-sm text-destructive">{errorsCreate.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type">{tCommon('type') || 'Type'}</Label>
                        <Select
                          onValueChange={(value) => setValueCreate('type', value as any)}
                          disabled={isCreatingExercise}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectType') || 'Select type'} />
                          </SelectTrigger>
                          <SelectContent>
                            {exerciseTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errorsCreate.type && (
                          <p className="text-sm text-destructive">{errorsCreate.type.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="muscle_group">{t('muscleGroup') || 'Muscle Group'}</Label>
                        <Select
                          onValueChange={(value) => setValueCreate('muscle_group', value as any)}
                          disabled={isCreatingExercise}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectMuscleGroup') || 'Select muscle group'} />
                          </SelectTrigger>
                          <SelectContent>
                            {muscleGroupOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errorsCreate.muscle_group && (
                          <p className="text-sm text-destructive">{errorsCreate.muscle_group.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">
                          {tCommon('description') || 'Description'} ({t('optional') || 'optional'})
                        </Label>
                        <Input
                          id="description"
                          {...registerCreate('description')}
                          placeholder={t('exerciseDescriptionPlaceholder') || 'Exercise description'}
                          disabled={isCreatingExercise}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateExercise(false)}
                          disabled={isCreatingExercise}
                          className="flex-1"
                        >
                          {tCommon('cancel') || 'Cancel'}
                        </Button>
                        <Button type="submit" disabled={isCreatingExercise} className="flex-1">
                          {isCreatingExercise
                            ? t('creating') || 'Creating...'
                            : t('createExercise') || 'Create Exercise'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmit(handleAddExercise)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="exercise">{tCommon('exercises') || 'Exercise'}</Label>
                        <ExerciseSelect
                          value={selectedExerciseId || ''}
                          onChange={(value) => setValue('exercise_id', value)}
                          disabled={isSubmitting}
                          onCreateExercise={handleOpenCreateExercise}
                        />
                        {errors.exercise_id && (
                          <p className="text-sm text-destructive">{errors.exercise_id.message}</p>
                        )}
                      </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="target_sets">{t('targetSets') || 'Target Sets'}</Label>
                        <Input
                          id="target_sets"
                          type="number"
                          min="1"
                          max="20"
                          {...register('target_sets')}
                          disabled={isSubmitting}
                        />
                        {errors.target_sets && (
                          <p className="text-xs text-destructive">{errors.target_sets.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target_reps">{t('targetReps') || 'Target Reps'}</Label>
                        <Input
                          id="target_reps"
                          type="number"
                          min="1"
                          max="100"
                          {...register('target_reps')}
                          disabled={isSubmitting}
                        />
                        {errors.target_reps && (
                          <p className="text-xs text-destructive">{errors.target_reps.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target_weight">{t('targetWeight') || 'Weight (kg)'}</Label>
                        <Input
                          id="target_weight"
                          type="number"
                          min="0"
                          step="0.5"
                          {...register('target_weight')}
                          disabled={isSubmitting}
                          placeholder={t('optional') || 'Optional'}
                        />
                        {errors.target_weight && (
                          <p className="text-xs text-destructive">{errors.target_weight.message}</p>
                        )}
                      </div>
                    </div>

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting
                          ? t('adding') || 'Adding...'
                          : t('addExerciseToRoutine') || 'Add Exercise to Routine'}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!routine.exercises || routine.exercises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{t('noExercisesYet') || 'No exercises yet'}</p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addFirstExercise') || 'Add Your First Exercise'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl p-0 overflow-hidden">
                  <DialogDescription className="sr-only">
                    {t('addExerciseDescription') ||
                      'Select an exercise and set your target sets, reps, and weight'}
                  </DialogDescription>
                  <div className="grid md:grid-cols-[220px_1fr]">
                    <div className="bg-muted/50 p-5 space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t('addExercise') || 'Add Exercise'}
                        </p>
                        <h3 className="text-xl font-semibold mt-2">{routine.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('addExerciseDescription') ||
                            'Select an exercise and set your target sets, reps, and weight'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-3 text-xs text-muted-foreground">
                        {t('readyToTrain') || 'Ready to train?'}
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <DialogHeader>
                        <DialogTitle>
                          {showCreateExercise
                            ? t('createNewExercise') || 'Create New Exercise'
                            : t('addExerciseToRoutine') || 'Add Exercise to Routine'}
                        </DialogTitle>
                      </DialogHeader>

                      {showCreateExercise ? (
                        <form onSubmit={handleSubmitCreate(handleCreateExercise)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name-empty">{tCommon('name') || 'Name'}</Label>
                            <Input
                              id="name-empty"
                              {...registerCreate('name')}
                              placeholder="Bench Press"
                              disabled={isCreatingExercise}
                            />
                            {errorsCreate.name && (
                              <p className="text-sm text-destructive">{errorsCreate.name.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="type-empty">{tCommon('type') || 'Type'}</Label>
                            <Select
                              onValueChange={(value) => setValueCreate('type', value as any)}
                              disabled={isCreatingExercise}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('selectType') || 'Select type'} />
                              </SelectTrigger>
                              <SelectContent>
                                {exerciseTypeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errorsCreate.type && (
                              <p className="text-sm text-destructive">{errorsCreate.type.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="muscle_group-empty">{t('muscleGroup') || 'Muscle Group'}</Label>
                            <Select
                              onValueChange={(value) => setValueCreate('muscle_group', value as any)}
                              disabled={isCreatingExercise}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('selectMuscleGroup') || 'Select muscle group'} />
                              </SelectTrigger>
                              <SelectContent>
                                {muscleGroupOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errorsCreate.muscle_group && (
                              <p className="text-sm text-destructive">{errorsCreate.muscle_group.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description-empty">
                              {tCommon('description') || 'Description'} ({t('optional') || 'optional'})
                            </Label>
                            <Input
                              id="description-empty"
                              {...registerCreate('description')}
                              placeholder={t('exerciseDescriptionPlaceholder') || 'Exercise description'}
                              disabled={isCreatingExercise}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowCreateExercise(false)}
                              disabled={isCreatingExercise}
                              className="flex-1"
                            >
                              {tCommon('cancel') || 'Cancel'}
                            </Button>
                            <Button type="submit" disabled={isCreatingExercise} className="flex-1">
                              {isCreatingExercise
                                ? t('creating') || 'Creating...'
                                : t('createExercise') || 'Create Exercise'}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <form onSubmit={handleSubmit(handleAddExercise)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="exercise-empty">{tCommon('exercises') || 'Exercise'}</Label>
                            <ExerciseSelect
                              value={selectedExerciseId || ''}
                              onChange={(value) => setValue('exercise_id', value)}
                              disabled={isSubmitting}
                              onCreateExercise={handleOpenCreateExercise}
                            />
                            {errors.exercise_id && (
                              <p className="text-sm text-destructive">{errors.exercise_id.message}</p>
                            )}
                          </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor="target_sets_empty">{t('targetSets') || 'Target Sets'}</Label>
                            <Input
                              id="target_sets_empty"
                              type="number"
                              min="1"
                              max="20"
                              {...register('target_sets')}
                              disabled={isSubmitting}
                            />
                            {errors.target_sets && (
                              <p className="text-xs text-destructive">{errors.target_sets.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="target_reps_empty">{t('targetReps') || 'Target Reps'}</Label>
                            <Input
                              id="target_reps_empty"
                              type="number"
                              min="1"
                              max="100"
                              {...register('target_reps')}
                              disabled={isSubmitting}
                            />
                            {errors.target_reps && (
                              <p className="text-xs text-destructive">{errors.target_reps.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="target_weight_empty">{t('targetWeight') || 'Weight (kg)'}</Label>
                            <Input
                              id="target_weight_empty"
                              type="number"
                              min="0"
                              step="0.5"
                              {...register('target_weight')}
                              disabled={isSubmitting}
                              placeholder={t('optional') || 'Optional'}
                            />
                            {errors.target_weight && (
                              <p className="text-xs text-destructive">{errors.target_weight.message}</p>
                            )}
                          </div>
                        </div>

                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting
                              ? t('adding') || 'Adding...'
                              : t('addExerciseToRoutine') || 'Add Exercise to Routine'}
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={routine.exercises
                .sort((a, b) => a.order - b.order)
                .map(ex => ex.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 touch-pan-y" style={{ touchAction: 'pan-y' }}>
                {routine.exercises
                  .sort((a, b) => a.order - b.order)
                  .map((routineExercise, index) => (
                    <SortableExerciseItem
                      key={routineExercise.id}
                      routineExercise={routineExercise}
                      index={index}
                      onRemove={handleRemoveExercise}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Start Workout Button */}
      {routine.exercises && routine.exercises.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">{t('readyToTrain') || 'Ready to train?'}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('startWorkoutDescription') || 'Start a workout using this routine'}
              </p>
              <Button onClick={() => router.push(ROUTES.WORKOUT_FROM_ROUTINE(routineId))} size="lg">
                <Dumbbell className="h-4 w-4 mr-2" />
                {t('startWorkoutFromRoutine') || 'Start Workout from Routine'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

