/**
 * Routine Detail Page
 * View and manage routine exercises
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { ArrowLeft, Plus, Trash2, Dumbbell, Edit, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { SortableExerciseItem } from '@/components/routines/sortable-exercise-item'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { RoutineWithExercises } from '@/types'
import { ROUTES, ROUTINE_FREQUENCY_OPTIONS, DAYS_OF_WEEK_OPTIONS } from '@/lib/constants'

const addExerciseSchema = z.object({
  exercise_id: z.string().min(1, 'Please select an exercise'),
  target_sets: z.coerce.number().min(1, 'At least 1 set required').max(20, 'Maximum 20 sets'),
  target_reps: z.coerce.number().min(1, 'At least 1 rep required').max(100, 'Maximum 100 reps'),
  target_weight: z.coerce.number().min(0, 'Weight cannot be negative').optional(),
})

type AddExerciseFormData = z.infer<typeof addExerciseSchema>

export default function RoutineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const routineId = params.id as string

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
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
      toast.error('Failed to load routine')
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this routine?')) return

    const result = await routineRepository.delete(routineId)
    if (result.data) {
      toast.success('Routine deleted')
      router.push(ROUTES.ROUTINES)
    } else {
      toast.error('Failed to delete routine')
    }
  }

  const handleToggleActive = async () => {
    if (!routine) return

    const result = await routineRepository.update(routineId, {
      is_active: !routine.is_active,
    })

    if (result.data) {
      toast.success(routine.is_active ? 'Routine deactivated' : 'Routine activated')
      loadRoutine()
    } else {
      toast.error('Failed to update routine')
    }
  }

  const handleDuplicate = async () => {
    if (!routine) return

    setIsDuplicating(true)
    try {
      // Create new routine with "Copy of" prefix
      const newRoutineResult = await routineRepository.create({
        user_id: routine.user_id,
        name: `Copy of ${routine.name}`,
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

      toast.success('Routine duplicated successfully!')
      router.push(ROUTES.ROUTINE_DETAIL(newRoutineId))
    } catch (error) {
      toast.error('Failed to duplicate routine')
    } finally {
      setIsDuplicating(false)
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
      target_weight: data.target_weight || undefined,
      order: nextOrder,
    })

    if (result.error) {
      toast.error('Failed to add exercise')
    } else {
      toast.success('Exercise added successfully!')
      reset()
      setDialogOpen(false)
      loadRoutine()
    }
    setIsSubmitting(false)
  }

  const handleRemoveExercise = async (routineExerciseId: string) => {
    if (!confirm('Remove this exercise from the routine?')) return

    const result = await routineRepository.removeExercise(routineExerciseId)
    
    if (result.error) {
      toast.error('Failed to remove exercise')
    } else {
      toast.success('Exercise removed')
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
      toast.success('Exercises reordered')
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
          Back to Routines
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDuplicate} disabled={isDuplicating}>
            <Copy className="h-4 w-4 mr-2" />
            {isDuplicating ? 'Duplicating...' : 'Duplicate'}
          </Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.ROUTINE_EDIT(routineId))}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={routine.is_active ? 'outline' : 'default'}
            onClick={handleToggleActive}
          >
            {routine.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
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
                Active
              </span>
            )}
          </div>
          {routine.description && (
            <CardDescription>{routine.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{routine.exercises?.length || 0} exercises</span>
            <span>•</span>
            <span>Created {new Date(routine.created_at).toLocaleDateString()}</span>
          </div>

          {routine.frequency && routine.frequency !== 'custom' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Frequency:</span>
              <span className="text-muted-foreground">
                {ROUTINE_FREQUENCY_OPTIONS.find(opt => opt.value === routine.frequency)?.label}
              </span>
            </div>
          )}

          {routine.scheduled_days && routine.scheduled_days.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Scheduled Days:</span>
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
            <h2 className="text-2xl font-bold">Exercises</h2>
            {routine.exercises && routine.exercises.length > 1 && (
              <p className="text-sm text-muted-foreground mt-1">
                Drag the grip icon (⋮⋮) to reorder exercises
              </p>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isReordering}>
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Exercise to Routine</DialogTitle>
                <DialogDescription>
                  Select an exercise and set your target sets, reps, and weight
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(handleAddExercise)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise">Exercise</Label>
                  <ExerciseSelect
                    value={selectedExerciseId || ''}
                    onChange={(value) => setValue('exercise_id', value)}
                    disabled={isSubmitting}
                  />
                  {errors.exercise_id && (
                    <p className="text-sm text-destructive">{errors.exercise_id.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_sets">Target Sets</Label>
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
                    <Label htmlFor="target_reps">Target Reps</Label>
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
                    <Label htmlFor="target_weight">Weight (kg)</Label>
                    <Input
                      id="target_weight"
                      type="number"
                      min="0"
                      step="0.5"
                      {...register('target_weight')}
                      disabled={isSubmitting}
                      placeholder="Optional"
                    />
                    {errors.target_weight && (
                      <p className="text-xs text-destructive">{errors.target_weight.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Exercise to Routine'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!routine.exercises || routine.exercises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No exercises yet</p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Exercise
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Exercise to Routine</DialogTitle>
                    <DialogDescription>
                      Select an exercise and set your target sets, reps, and weight
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit(handleAddExercise)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="exercise-empty">Exercise</Label>
                      <ExerciseSelect
                        value={selectedExerciseId || ''}
                        onChange={(value) => setValue('exercise_id', value)}
                        disabled={isSubmitting}
                      />
                      {errors.exercise_id && (
                        <p className="text-sm text-destructive">{errors.exercise_id.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="target_sets_empty">Target Sets</Label>
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
                        <Label htmlFor="target_reps_empty">Target Reps</Label>
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
                        <Label htmlFor="target_weight_empty">Weight (kg)</Label>
                        <Input
                          id="target_weight_empty"
                          type="number"
                          min="0"
                          step="0.5"
                          {...register('target_weight')}
                          disabled={isSubmitting}
                          placeholder="Optional"
                        />
                        {errors.target_weight && (
                          <p className="text-xs text-destructive">{errors.target_weight.message}</p>
                        )}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Adding...' : 'Add Exercise to Routine'}
                    </Button>
                  </form>
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
              <div className="space-y-3">
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
              <h3 className="font-semibold mb-2">Ready to train?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start a workout using this routine
              </p>
              <Button onClick={() => router.push(`/workouts/new-from-routine/${routineId}`)} size="lg">
                <Dumbbell className="h-4 w-4 mr-2" />
                Start Workout from Routine
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

