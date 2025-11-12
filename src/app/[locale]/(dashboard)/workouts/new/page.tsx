'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkoutForm } from '@/components/workouts/workout-form'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { WorkoutRestTimer } from '@/components/workouts/workout-rest-timer'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { WorkoutFormData, SetFormData } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useWorkoutPersistence, loadWorkoutProgress, clearWorkoutProgress, WorkoutProgress } from '@/hooks/use-workout-persistence'
import { useTranslations } from 'next-intl'

export default function NewWorkoutPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { createWorkout, isLoading } = useWorkoutStore()
  const t = useTranslations('workouts')
  const [workoutData, setWorkoutData] = useState<WorkoutFormData | null>(null)
  const [sets, setSets] = useState<SetFormData[]>([])
  const [currentSet, setCurrentSet] = useState<Partial<SetFormData>>({
    exercise_id: '',
    reps: 10,
    weight: 0,
    rest_time: 90,
  })

  useEffect(() => {
    const savedProgress = loadWorkoutProgress()
    if (savedProgress) {
      if (savedProgress.workoutData) {
        setWorkoutData(savedProgress.workoutData)
      }
      if (savedProgress.sets && savedProgress.sets.length > 0) {
        setSets(savedProgress.sets as SetFormData[])
        toast.success(t('progressRestored') || 'Your workout progress has been restored!')
      }
      if (savedProgress.currentSet) {
        setCurrentSet(savedProgress.currentSet)
      }
    }
  }, [t])

  useEffect(() => {
    if (workoutData || sets.length > 0) {
      const progress: WorkoutProgress = {
        date: workoutData?.date || new Date().toISOString().split('T')[0],
        duration: workoutData?.duration || 60,
        notes: workoutData?.notes || '',
        sets: sets.map(set => ({
          exercise_id: set.exercise_id,
          reps: set.reps,
          weight: set.weight,
          rest_time: set.rest_time || 90,
        })),
        workoutData: workoutData ? {
          date: workoutData.date,
          duration: workoutData.duration,
          notes: workoutData.notes || '',
        } : undefined,
        currentSet: currentSet.exercise_id ? {
          exercise_id: currentSet.exercise_id,
          reps: currentSet.reps || 10,
          weight: currentSet.weight || 0,
          rest_time: currentSet.rest_time || 90,
        } : undefined,
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('workout_progress_new', JSON.stringify({
            ...progress,
            savedAt: new Date().toISOString(),
          }))
        } catch (error) {
          console.error('Failed to save workout progress:', error)
        }
      }
    }
  }, [workoutData, sets, currentSet])

  const handleWorkoutSubmit = (data: WorkoutFormData) => {
    setWorkoutData(data)
    toast.success('Workout info saved. Now add exercises!')
  }

  const handleAddSet = () => {
    if (!currentSet.exercise_id) {
      toast.error('Please select an exercise')
      return
    }

    setSets([...sets, currentSet as SetFormData])
    setCurrentSet({
      exercise_id: '',
      reps: 10,
      weight: 0,
      rest_time: 90,
    })
    toast.success('Set added!')
  }

  const handleRemoveSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index))
  }

  const handleFinalSubmit = async () => {
    if (!user || !workoutData) return

    if (sets.length === 0) {
      toast.error('Add at least one set')
      return
    }

    const workoutId = await createWorkout(user.id, workoutData, sets)

    if (workoutId) {
      clearWorkoutProgress()
      toast.success('Workout created successfully!')
      router.push(ROUTES.WORKOUT_DETAIL(workoutId))
    } else {
      toast.error('Failed to create workout')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">New Workout</h1>
        <p className="text-muted-foreground">Record your training session</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workout Information</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutForm
            onSubmit={handleWorkoutSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {workoutData && (
        <Card>
          <CardHeader>
            <CardTitle>Add Exercises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Exercise</Label>
                <ExerciseSelect
                  value={currentSet.exercise_id || ''}
                  onChange={(value) => setCurrentSet({ ...currentSet, exercise_id: value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  value={currentSet.reps}
                  onChange={(e) => setCurrentSet({ ...currentSet, reps: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.5"
                  value={currentSet.weight}
                  onChange={(e) => setCurrentSet({ ...currentSet, weight: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rest">Rest (sec)</Label>
                <Input
                  id="rest"
                  type="number"
                  min="0"
                  value={currentSet.rest_time}
                  onChange={(e) => setCurrentSet({ ...currentSet, rest_time: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <Button onClick={handleAddSet} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Set
            </Button>

            {sets.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Sets ({sets.length})</h3>
                <div className="space-y-2">
                  {sets.map((set, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <span className="text-sm">
                        Set {index + 1}: {set.reps} reps × {set.weight} kg
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSet(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sets.length > 0 && (
              <Button onClick={handleFinalSubmit} className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Complete Workout'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <WorkoutRestTimer />
    </div>
  )
}

