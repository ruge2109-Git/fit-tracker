/**
 * Create Workout from Routine
 * Start a new workout using a routine template
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { WorkoutRestTimer } from '@/components/workouts/workout-rest-timer'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { RoutineWithExercises, SetFormData } from '@/types'
import { ROUTES } from '@/lib/constants'

interface WorkoutSet extends SetFormData {
  tempId: string
  exerciseName: string
}

export default function NewWorkoutFromRoutinePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { createWorkout, isLoading: isSaving } = useWorkoutStore()
  
  const routineId = params.routineId as string
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [sets, setSets] = useState<WorkoutSet[]>([])

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
      // Pre-fill sets based on routine exercises
      const initialSets: WorkoutSet[] = []
      result.data.exercises?.forEach((routineExercise) => {
        for (let i = 0; i < routineExercise.target_sets; i++) {
          initialSets.push({
            tempId: `${routineExercise.id}-${i}`,
            exercise_id: routineExercise.exercise_id,
            exerciseName: routineExercise.exercise.name,
            reps: routineExercise.target_reps,
            weight: routineExercise.target_weight || 0,
            rest_time: 90,
          })
        }
      })
      setSets(initialSets)
    } else {
      toast.error('Routine not found')
      router.push(ROUTES.ROUTINES)
    }
    setIsLoading(false)
  }

  const handleUpdateSet = (tempId: string, field: keyof SetFormData, value: number) => {
    setSets(prev => prev.map(set => 
      set.tempId === tempId ? { ...set, [field]: value } : set
    ))
  }

  const handleRemoveSet = (tempId: string) => {
    setSets(prev => prev.filter(set => set.tempId !== tempId))
  }

  const handleAddSet = (exerciseId: string, exerciseName: string) => {
    const lastSet = sets.filter(s => s.exercise_id === exerciseId).pop()
    setSets(prev => [...prev, {
      tempId: `${exerciseId}-${Date.now()}`,
      exercise_id: exerciseId,
      exerciseName,
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
      rest_time: 90,
    }])
  }

  const handleSave = async () => {
    if (!user) return

    if (sets.length === 0) {
      toast.error('Add at least one set')
      return
    }

    const workoutData = { date, duration, notes, routine_id: routineId }
    const setsData = sets.map(({ tempId, exerciseName, ...set }) => set)

    const workoutId = await createWorkout(user.id, workoutData, setsData)

    if (workoutId) {
      toast.success('Workout created successfully!')
      router.push(ROUTES.WORKOUT_DETAIL(workoutId))
    }
  }

  if (isLoading || !routine) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Group sets by exercise
  const exerciseGroups = sets.reduce((acc, set) => {
    if (!acc[set.exercise_id]) {
      acc[set.exercise_id] = {
        name: set.exerciseName,
        sets: [],
      }
    }
    acc[set.exercise_id].sets.push(set)
    return acc
  }, {} as Record<string, { name: string; sets: WorkoutSet[] }>)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Workout'}
        </Button>
      </div>

      {/* Routine Info */}
      <Card>
        <CardHeader>
          <CardTitle>Starting from: {routine.name}</CardTitle>
          <CardDescription>Adjust the sets as needed for today's workout</CardDescription>
        </CardHeader>
      </Card>

      {/* Workout Details */}
      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
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
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling today?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercise Sets */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Exercises</h2>
        {Object.entries(exerciseGroups).map(([exerciseId, group]) => (
          <Card key={exerciseId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{group.name}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSet(exerciseId, group.name)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Set
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.sets.map((set, index) => (
                  <div key={set.tempId} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-16">Set {index + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(set.tempId, 'reps', parseInt(e.target.value))}
                          placeholder="Reps"
                          min="1"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={set.weight}
                          onChange={(e) => handleUpdateSet(set.tempId, 'weight', parseFloat(e.target.value))}
                          placeholder="Weight (kg)"
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSet(set.tempId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
        {isSaving ? 'Saving Workout...' : 'Save Workout'}
      </Button>

      {/* Floating Rest Timer */}
      <WorkoutRestTimer />
    </div>
  )
}

