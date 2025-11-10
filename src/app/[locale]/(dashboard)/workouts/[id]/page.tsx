/**
 * Workout Detail Page
 * View details of a specific workout
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Clock, ArrowLeft, Trash2, Edit, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkoutStore } from '@/store/workout.store'
import { useAuthStore } from '@/store/auth.store'
import { formatDate, formatDuration, formatWeight } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'

export default function WorkoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentWorkout, loadWorkout, deleteWorkout, createWorkout, isLoading } = useWorkoutStore()
  const { user } = useAuthStore()
  const [isDuplicating, setIsDuplicating] = useState(false)
  const workoutId = params.id as string

  useEffect(() => {
    if (workoutId) {
      loadWorkout(workoutId)
    }
  }, [workoutId, loadWorkout])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    const success = await deleteWorkout(workoutId)
    if (success) {
      toast.success('Workout deleted')
      router.push(ROUTES.WORKOUTS)
    } else {
      toast.error('Failed to delete workout')
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
        notes: currentWorkout.notes ? `Copy of: ${currentWorkout.notes}` : 'Duplicated workout',
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
        toast.success('Workout duplicated successfully!')
        router.push(ROUTES.WORKOUT_DETAIL(newWorkoutId))
      }
    } catch (error) {
      toast.error('Failed to duplicate workout')
    } finally {
      setIsDuplicating(false)
    }
  }

  if (isLoading || !currentWorkout) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

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
          <Button variant="outline" onClick={() => router.push(ROUTES.WORKOUT_EDIT(workoutId))}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Workout Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{formatDate(currentWorkout.date, 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>{formatDuration(currentWorkout.duration)}</span>
            </div>
          </div>

          {currentWorkout.notes && (
            <div>
              <h3 className="font-semibold mb-1">Notes</h3>
              <p className="text-muted-foreground">{currentWorkout.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Exercises</h2>
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
    </div>
  )
}

