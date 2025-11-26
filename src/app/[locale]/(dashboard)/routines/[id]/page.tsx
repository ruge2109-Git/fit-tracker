/**
 * Routine Detail Page
 * View and manage routine exercises
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
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
import { ArrowLeft, Plus, Trash2, Dumbbell, Edit, Copy, MoreVertical, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SortableExerciseItem } from '@/components/routines/sortable-exercise-item'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { RoutineWithExercises } from '@/types'
import { ROUTES, ROUTINE_FREQUENCY_OPTIONS, DAYS_OF_WEEK_OPTIONS } from '@/lib/constants'
import { logger } from '@/lib/logger'


export default function RoutineDetailPage() {
  const params = useParams()
  const router = useNavigationRouter()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const routineId = params.id as string

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


  useEffect(() => {
    if (routineId) {
      loadRoutine()
    }
  }, [routineId])

  const loadRoutine = async () => {
    setIsLoading(true)
    try {
      const result = await routineRepository.findById(routineId)
      if (result.data) {
        setRoutine(result.data)
      } else {
        toast.error(t('failedToLoad') || 'Failed to load routine')
      }
    } catch (error) {
      logger.error('Error loading routine', error as Error, 'RoutineDetailPage')
      toast.error(t('failedToLoad') || 'Failed to load routine')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete') || 'Are you sure you want to delete this routine?')) return

    const result = await routineRepository.delete(routineId)
    if (result.data) {
      // Log delete routine event
      logAuditEvent({
        action: 'delete_routine',
        entityType: 'routine',
        entityId: routineId,
      })
      
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
      // Log update routine event
      logAuditEvent({
        action: 'update_routine',
        entityType: 'routine',
        entityId: routineId,
        details: { is_active: !routine.is_active },
      })
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

  const handleShare = () => {
    if (!routine) return
    const url = `${window.location.origin}${ROUTES.ROUTINE_DETAIL(routineId)}`
    setShareLink(url)
    setShareDialogOpen(true)
    
    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success(t('linkCopied') || 'Link copied to clipboard')
      })
    }
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
            onClick={handleShare}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            <Share2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('share') || 'Share'}</span>
          </Button>
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
          <Button 
            disabled={isReordering}
            onClick={() => router.push(ROUTES.ROUTINE_ADD_EXERCISE(routineId))}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addExercise') || 'Add Exercise'}
          </Button>
        </div>

        {!routine.exercises || routine.exercises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{t('noExercisesYet') || 'No exercises yet'}</p>
              <Button onClick={() => router.push(ROUTES.ROUTINE_ADD_EXERCISE(routineId))}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addFirstExercise') || 'Add Your First Exercise'}
              </Button>
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

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('shareRoutine') || 'Share Routine'}</DialogTitle>
            <DialogDescription>
              {t('shareRoutineDescription') || 'Copy this link to share your routine'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button
                variant="outline"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareLink)
                    toast.success(t('linkCopied') || 'Link copied to clipboard')
                  }
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

