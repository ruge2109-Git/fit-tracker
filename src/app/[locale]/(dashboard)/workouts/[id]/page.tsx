/**
 * Workout Detail Page
 * View details of a specific workout
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Calendar, Clock, ArrowLeft, Trash2, Edit, Copy, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useWorkoutStore } from '@/store/workout.store'
import { useAuthStore } from '@/store/auth.store'
import { formatDate, formatDuration, formatWeight } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { exportWorkoutToPDF } from '@/lib/pdf-export'
import { useLocale } from 'next-intl'
import { QuickNotes } from '@/components/workouts/quick-notes'
import { workoutService } from '@/domain/services/workout.service'
import { WorkoutTags } from '@/components/workouts/workout-tags'
import { InlineEdit } from '@/components/ui/inline-edit'
import { logger } from '@/lib/logger'

export default function WorkoutDetailPage() {
  const params = useParams()
  const router = useNavigationRouter()
  const { currentWorkout, loadWorkout, deleteWorkout, createWorkout, updateWorkout, isLoading } = useWorkoutStore()
  const { user } = useAuthStore()
  const t = useTranslations('workouts')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [workoutTagIds, setWorkoutTagIds] = useState<string[]>([])
  const workoutId = params.id as string

  useEffect(() => {
    if (workoutId) {
      loadWorkout(workoutId).catch((error) => {
        logger.error('Error loading workout', error as Error, 'WorkoutDetailPage')
      })
    }
  }, [workoutId, loadWorkout])

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete') || 'Are you sure you want to delete this workout?')) return

    const success = await deleteWorkout(workoutId)
    if (success) {
      toast.success(t('workoutDeleted') || 'Workout deleted')
      router.push(ROUTES.WORKOUTS)
    } else {
      toast.error(t('failedToDelete') || 'Failed to delete workout')
    }
  }

  const handleDuplicate = async () => {
    if (!currentWorkout || !user) return

    setIsDuplicating(true)
    try {
      // Create workout data with today's date
      const workoutData = {
        date: new Date().toISOString().split('T')[0],
        duration: currentWorkout.duration,
        notes: currentWorkout.notes ? `${t('copyOf') || 'Copy of'}: ${currentWorkout.notes}` : t('duplicatedWorkout') || 'Duplicated workout',
        routine_id: currentWorkout.routine_id,
      }

      // Create sets data
      const setsData = currentWorkout.sets.map(set => ({
        exercise_id: set.exercise_id,
        reps: set.reps,
        weight: set.weight,
        rest_time: set.rest_time,
      }))

      const newWorkoutId = await createWorkout(user.id, workoutData, setsData)

      if (newWorkoutId) {
        toast.success(t('workoutDuplicated') || 'Workout duplicated successfully!')
        router.push(ROUTES.WORKOUT_DETAIL(newWorkoutId))
      }
    } catch (error) {
      toast.error(t('failedToDuplicate') || 'Failed to duplicate workout')
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleExportPDF = () => {
    if (!currentWorkout) return
    try {
      exportWorkoutToPDF(currentWorkout, locale)
      toast.success(t('workoutExported') || 'Workout exported to PDF')
    } catch (error) {
      toast.error(t('failedToExport') || 'Failed to export workout')
    }
  }

  const handleShare = () => {
    if (!currentWorkout) return
    const url = `${window.location.origin}${ROUTES.WORKOUT_DETAIL(workoutId)}`
    setShareLink(url)
    setShareDialogOpen(true)
    
    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success(t('linkCopied') || 'Link copied to clipboard')
      })
    }
  }

  // Show loading only if actually loading or workout not loaded yet
  if (isLoading && !currentWorkout) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If workout failed to load, show error
  if (!isLoading && !currentWorkout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">{t('failedToLoadWorkout') || 'Failed to load workout'}</p>
        <Button onClick={() => loadWorkout(workoutId)}>
          {tCommon('retry') || 'Retry'}
        </Button>
      </div>
    )
  }

  // TypeScript guard: currentWorkout is guaranteed to be non-null here
  if (!currentWorkout) return null

  // Group sets by exercise
  const exerciseGroups = currentWorkout.sets.reduce((acc, set) => {
    const exerciseName = set.exercise.name
    if (!acc[exerciseName]) {
      acc[exerciseName] = []
    }
    acc[exerciseName].push(set)
    return acc
  }, {} as Record<string, typeof currentWorkout.sets>)

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
            onClick={handleExportPDF}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('exportPDF') || 'Export PDF'}</span>
          </Button>
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
            onClick={() => router.push(ROUTES.WORKOUT_EDIT(workoutId))}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{tCommon('edit') || 'Edit'}</span>
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

      {/* Workout Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('workoutDetails') || 'Workout Details'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <InlineEdit
                value={currentWorkout.date}
                onSave={async (newDate) => {
                  const success = await updateWorkout(workoutId, { date: newDate })
                  if (success) {
                    await loadWorkout(workoutId)
                    toast.success(t('workoutUpdated') || 'Workout updated successfully')
                  } else {
                    toast.error(t('failedToUpdate') || 'Failed to update workout')
                  }
                }}
                type="date"
                className="min-w-[150px]"
                placeholder={tCommon('date') || 'Date'}
              />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <InlineEdit
                value={currentWorkout.duration.toString()}
                onSave={async (newDuration) => {
                  const durationNum = parseInt(newDuration)
                  if (isNaN(durationNum) || durationNum < 1) {
                    throw new Error(t('invalidDuration') || 'Invalid duration')
                  }
                  const success = await updateWorkout(workoutId, { duration: durationNum })
                  if (success) {
                    await loadWorkout(workoutId)
                    toast.success(t('workoutUpdated') || 'Workout updated successfully')
                  } else {
                    toast.error(t('failedToUpdate') || 'Failed to update workout')
                  }
                }}
                type="number"
                min={1}
                validate={(value) => {
                  const num = parseInt(value)
                  if (isNaN(num) || num < 1) {
                    return t('durationMustBePositive') || 'Duration must be at least 1 minute'
                  }
                  return true
                }}
                formatDisplay={(value) => formatDuration(parseInt(value))}
                className="min-w-[100px]"
                placeholder={tCommon('duration') || 'Duration'}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{tCommon('notes') || 'Notes'}</h3>
              <QuickNotes
                notes={currentWorkout.notes}
                onSave={async (notes) => {
                  const success = await updateWorkout(workoutId, { notes })
                  if (success) {
                    await loadWorkout(workoutId)
                    toast.success(t('notesUpdated') || 'Notes updated successfully')
                  } else {
                    toast.error(t('failedToUpdateNotes') || 'Failed to update notes')
                  }
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('tags') || 'Tags'}</h3>
              <WorkoutTags
                workoutId={workoutId}
                selectedTagIds={workoutTagIds}
                onTagsChange={setWorkoutTagIds}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{tCommon('exercises') || 'Exercises'}</h2>
        {Object.entries(exerciseGroups).map(([exerciseName, sets]) => (
          <Card key={exerciseName}>
            <CardHeader>
              <CardTitle className="text-xl">{exerciseName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sets.map((set, index) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="font-medium">Set {index + 1}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{set.reps} reps</span>
                      <span>×</span>
                      <span>{formatWeight(set.weight)}</span>
                      {set.rest_time && (
                        <>
                          <span>•</span>
                          <span className="text-muted-foreground">{set.rest_time}s rest</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Exercise Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Volume</span>
                  <span className="font-bold">
                    {sets.reduce((sum, set) => sum + (set.weight * set.reps), 0).toFixed(1)} kg
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('shareWorkout') || 'Share Workout'}</DialogTitle>
            <DialogDescription>
              {t('shareWorkoutDescription') || 'Copy this link to share your workout'}
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
    </div>
  )
}

