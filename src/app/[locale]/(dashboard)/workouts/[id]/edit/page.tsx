/**
 * Edit Workout Page
 * Modify existing workout details and sets
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { WorkoutRestTimer } from '@/components/workouts/workout-rest-timer'
import { useWorkoutStore } from '@/store/workout.store'
import { workoutRepository } from '@/domain/repositories/workout.repository'
import { setRepository } from '@/domain/repositories/set.repository'
import { SetWithExercise } from '@/types'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/logger'

interface WorkoutSet extends SetWithExercise {
  isNew?: boolean
  isModified?: boolean
  isDeleted?: boolean
}

export default function EditWorkoutPage() {
  const params = useParams()
  const router = useRouter()
  const { currentWorkout, loadWorkout } = useWorkoutStore()
  const t = useTranslations('workouts')
  const tCommon = useTranslations('common')
  const workoutId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [sets, setSets] = useState<WorkoutSet[]>([])

  useEffect(() => {
    if (workoutId) {
      loadWorkoutData()
    }
  }, [workoutId])

  const loadWorkoutData = async () => {
    setIsLoading(true)
    await loadWorkout(workoutId)
    setIsLoading(false)
  }

  useEffect(() => {
    if (currentWorkout) {
      setDate(currentWorkout.date)
      setDuration(currentWorkout.duration)
      setNotes(currentWorkout.notes || '')
      setSets(currentWorkout.sets || [])
    }
  }, [currentWorkout])

  const handleUpdateSet = (setId: string, field: 'reps' | 'weight' | 'rest_time', value: number) => {
    setSets(prev => prev.map(set => 
      set.id === setId 
        ? { ...set, [field]: value, isModified: !set.isNew } 
        : set
    ))
  }

  const handleDeleteSet = (setId: string) => {
    setSets(prev => prev.map(set => 
      set.id === setId ? { ...set, isDeleted: true } : set
    ))
  }

  const handleAddSet = () => {
    const newSet: WorkoutSet = {
      id: `temp-${Date.now()}`,
      workout_id: workoutId,
      exercise_id: '',
      reps: 10,
      weight: 0,
      rest_time: 90,
      set_order: sets.filter(s => !s.isDeleted).length + 1,
      created_at: new Date().toISOString(),
      exercise: {
        id: '',
        name: t('selectExercise') || 'Select Exercise',
        type: 'strength' as any,
        muscle_group: 'chest' as any,
        created_at: new Date().toISOString(),
      },
      isNew: true,
    }
    setSets(prev => [...prev, newSet])
  }

  const handleExerciseChange = (setId: string, exerciseId: string) => {
    setSets(prev => prev.map(set => 
      set.id === setId 
        ? { ...set, exercise_id: exerciseId, isModified: !set.isNew } 
        : set
    ))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Update workout basic info
      const workoutResult = await workoutRepository.update(workoutId, {
        date,
        duration,
        notes,
      })

      if (workoutResult.error) {
        throw new Error('Failed to update workout')
      }

      // Process sets changes
      const promises = []

      // Delete removed sets
      for (const set of sets.filter(s => s.isDeleted && !s.isNew)) {
        promises.push(setRepository.delete(set.id))
      }

      // Update modified sets
      for (const set of sets.filter(s => s.isModified && !s.isNew && !s.isDeleted)) {
        promises.push(setRepository.update(set.id, {
          exercise_id: set.exercise_id,
          reps: set.reps,
          weight: set.weight,
          rest_time: set.rest_time,
        }))
      }

      // Create new sets
      const newSets = sets.filter(s => s.isNew && !s.isDeleted && s.exercise_id)
      if (newSets.length > 0) {
        promises.push(setRepository.createMany(
          newSets.map((set, index) => ({
            workout_id: workoutId,
            exercise_id: set.exercise_id,
            reps: set.reps,
            weight: set.weight,
            rest_time: set.rest_time,
            set_order: index + 1,
          }))
        ))
      }

      await Promise.all(promises)

      toast.success(t('workoutUpdatedSuccessfully') || 'Workout updated successfully!')
      router.push(ROUTES.WORKOUT_DETAIL(workoutId))
    } catch (error) {
      toast.error(t('failedToUpdateWorkout') || 'Failed to update workout')
      logger.error('Failed to update workout', error as Error, 'EditWorkoutPage')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !currentWorkout) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Group sets by exercise (excluding deleted)
  const activeSets = sets.filter(s => !s.isDeleted)
  const exerciseGroups = activeSets.reduce((acc, set) => {
    const exerciseName = set.exercise.name || t('selectExercise') || 'Select Exercise'
    if (!acc[exerciseName]) {
      acc[exerciseName] = []
    }
    acc[exerciseName].push(set)
    return acc
  }, {} as Record<string, WorkoutSet[]>)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back') || 'Back'}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? t('saving') || 'Saving...' : t('saveChanges') || 'Save Changes'}
        </Button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold">{t('editWorkout') || 'Edit Workout'}</h1>
        <p className="text-muted-foreground">{t('modifyDetails') || 'Modify your workout details'}</p>
      </div>

      {/* Workout Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('workoutInformation') || 'Workout Information'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">{t('date') || 'Date'}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">{t('durationMinutes') || 'Duration (minutes)'}</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{tCommon('notes') || 'Notes'}</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('howFeel') || 'How did it feel?'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercise Sets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{tCommon('exercises') || 'Exercises'} & {t('sets') || 'Sets'}</h2>
          <Button onClick={handleAddSet}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addSet') || 'Add Set'}
          </Button>
        </div>

        {Object.entries(exerciseGroups).map(([exerciseName, exerciseSets]) => (
          <Card key={exerciseName}>
            <CardHeader>
              <CardTitle>{exerciseName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exerciseSets.map((set, index) => (
                  <div key={set.id} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-16">{t('set') || 'Set'} {index + 1}</span>
                    
                    {set.isNew && (
                      <div className="flex-1">
                        <ExerciseSelect
                          value={set.exercise_id}
                          onChange={(value) => handleExerciseChange(set.id, value)}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(set.id, 'reps', parseInt(e.target.value))}
                          placeholder={t('reps') || 'Reps'}
                          min="1"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={set.weight}
                          onChange={(e) => handleUpdateSet(set.id, 'weight', parseFloat(e.target.value))}
                          placeholder={t('weightKg') || 'Weight (kg)'}
                          min="0"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={set.rest_time || 90}
                          onChange={(e) => handleUpdateSet(set.id, 'rest_time', parseInt(e.target.value))}
                          placeholder={t('rest') || 'Rest (s)'}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSet(set.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {activeSets.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('noSetsYet') || 'No sets yet'}</p>
              <Button onClick={handleAddSet}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addFirstSet') || 'Add First Set'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? t('savingChanges') || 'Saving Changes...' : t('saveWorkout') || 'Save Workout'}
      </Button>

      {/* Floating Rest Timer */}
      <WorkoutRestTimer />
    </div>
  )
}

