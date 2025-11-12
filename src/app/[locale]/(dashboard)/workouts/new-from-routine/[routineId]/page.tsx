'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion } from '@/components/ui/accordion'
import { SortableExerciseGroup } from '@/components/workouts/sortable-exercise-group'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { WorkoutRestTimer } from '@/components/workouts/workout-rest-timer'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { RoutineWithExercises, SetFormData } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useWorkoutPersistence, loadWorkoutProgress, clearWorkoutProgress, WorkoutProgress } from '@/hooks/use-workout-persistence'
import { useTranslations } from 'next-intl'

interface WorkoutSet extends SetFormData {
  tempId: string
  exerciseName: string
  completed?: boolean
}

const KG_TO_LBS = 2.20462
const LBS_TO_KG = 1 / KG_TO_LBS

const convertKgToLbs = (kg: number): number => {
  return kg * KG_TO_LBS
}

const convertLbsToKg = (lbs: number): number => {
  return lbs * LBS_TO_KG
}

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100
}

export default function NewWorkoutFromRoutinePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { createWorkout, isLoading: isSaving } = useWorkoutStore()
  const t = useTranslations('workouts')
  
  const routineId = params.routineId as string
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false)
  const [isRestoring, setIsRestoring] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastLbsInput, setLastLbsInput] = useState<Record<string, number>>({})
  const [exerciseOrder, setExerciseOrder] = useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useWorkoutPersistence(
    routineId,
    { 
      date, 
      duration, 
      notes, 
      sets: sets.map(set => ({
        tempId: set.tempId,
        exercise_id: set.exercise_id,
        exerciseName: set.exerciseName,
        reps: set.reps,
        weight: set.weight,
        rest_time: set.rest_time || 90,
        completed: set.completed,
      }))
    },
    undefined,
    isRestoring || !isInitialized
  )

  useEffect(() => {
    if (routineId) {
      loadRoutine()
    }
  }, [routineId])

  const loadRoutine = async () => {
    setIsLoading(true)
    setIsRestoring(true)
    
    const savedProgress = loadWorkoutProgress(routineId)
    const result = await routineRepository.findById(routineId)
    
    if (result.data) {
      setRoutine(result.data)
      
      if (savedProgress && savedProgress.sets && savedProgress.sets.length > 0) {
        setDate(savedProgress.date || new Date().toISOString().split('T')[0])
        setDuration(savedProgress.duration || 60)
        setNotes(savedProgress.notes || '')
        const restoredSets = savedProgress.sets as WorkoutSet[]
        setSets(restoredSets)
        
        const order = Array.from(new Set(restoredSets.map(set => set.exercise_id)))
        setExerciseOrder(order)
        setHasRestoredProgress(true)
        
        setTimeout(() => {
          setIsRestoring(false)
          setIsInitialized(true)
        }, 200)
        
        toast.success(t('progressRestored') || 'Your workout progress has been restored!')
      } else {
        const initialSets: WorkoutSet[] = []
        const order: string[] = []
        result.data.exercises?.forEach((routineExercise) => {
          order.push(routineExercise.exercise_id)
          for (let i = 0; i < routineExercise.target_sets; i++) {
            initialSets.push({
              tempId: `${routineExercise.id}-${i}`,
              exercise_id: routineExercise.exercise_id,
              exerciseName: routineExercise.exercise.name,
              reps: routineExercise.target_reps,
              weight: routineExercise.target_weight || 0,
              rest_time: 90,
              completed: false,
            })
          }
        })
        setSets(initialSets)
        setExerciseOrder(order)
        setTimeout(() => {
          setIsRestoring(false)
          setIsInitialized(true)
        }, 200)
      }
    } else {
      toast.error('Routine not found')
      router.push(ROUTES.ROUTINES)
      setIsRestoring(false)
    }
    setIsLoading(false)
  }

  const handleUpdateSet = (tempId: string, field: keyof SetFormData, value: number) => {
    setSets(prev => prev.map(set => 
      set.tempId === tempId ? { ...set, [field]: value } : set
    ))
  }

  const handleToggleSetCompleted = (tempId: string) => {
    setSets(prev => prev.map(set => 
      set.tempId === tempId ? { ...set, completed: !set.completed } : set
    ))
  }

  const handleWeightChange = (tempId: string, value: number, unit: 'kg' | 'lbs') => {
    let weightInKg: number
    if (unit === 'kg') {
      weightInKg = roundToTwoDecimals(value)
      delete lastLbsInput[tempId]
    } else {
      const roundedLbs = roundToTwoDecimals(value)
      setLastLbsInput(prev => ({ ...prev, [tempId]: roundedLbs }))
      weightInKg = convertLbsToKg(roundedLbs)
      weightInKg = roundToTwoDecimals(weightInKg)
    }
    handleUpdateSet(tempId, 'weight', weightInKg)
  }

  const getWeightInLbs = (weightInKg: number): number => {
    return convertKgToLbs(weightInKg)
  }

  const formatWeight = (weight: number): string => {
    const rounded = roundToTwoDecimals(weight)
    return rounded.toFixed(2).replace(/\.?0+$/, '')
  }

  const formatWeightForInput = (weight: number): number => {
    return roundToTwoDecimals(weight)
  }

  const handleRemoveSet = (tempId: string) => {
    setSets(prev => prev.filter(set => set.tempId !== tempId))
    setLastLbsInput(prev => {
      const newInput = { ...prev }
      delete newInput[tempId]
      return newInput
    })
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
      completed: false,
    }])
    
    if (!exerciseOrder.includes(exerciseId)) {
      setExerciseOrder(prev => [...prev, exerciseId])
    }
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
      clearWorkoutProgress(routineId)
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = exerciseOrder.indexOf(active.id as string)
    const newIndex = exerciseOrder.indexOf(over.id as string)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(exerciseOrder, oldIndex, newIndex)
      setExerciseOrder(newOrder)
    }
  }

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

  const orderedExerciseIds = exerciseOrder.length > 0 
    ? exerciseOrder.filter(id => exerciseGroups[id])
    : Object.keys(exerciseGroups)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Workout'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Starting from: {routine.name}</CardTitle>
          <CardDescription>Adjust the sets as needed for today's workout</CardDescription>
        </CardHeader>
      </Card>

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

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Exercises</h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedExerciseIds}
            strategy={verticalListSortingStrategy}
          >
            <Accordion type="multiple" className="space-y-2">
              {orderedExerciseIds.map((exerciseId) => {
                const group = exerciseGroups[exerciseId]
                if (!group) return null

                return (
                  <SortableExerciseGroup
                    key={exerciseId}
                    id={exerciseId}
                    exerciseName={group.name}
                    value={exerciseId}
                  >
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-end mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSet(exerciseId, group.name)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Set
                        </Button>
                      </div>
                      {group.sets.map((set, index) => (
                        <div key={set.tempId} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${set.completed ? 'bg-muted/50 border-primary/50' : 'border-border'}`}>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={set.completed || false}
                              onCheckedChange={() => handleToggleSetCompleted(set.tempId)}
                              id={`set-${set.tempId}`}
                            />
                            <Label htmlFor={`set-${set.tempId}`} className="text-sm font-medium w-16 cursor-pointer">
                              Set {index + 1}
                            </Label>
                          </div>
                          <div className="flex-1 grid grid-cols-3 gap-2">
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
                                value={set.weight ? formatWeightForInput(set.weight) : ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                  if (!isNaN(value)) {
                                    handleWeightChange(set.tempId, value, 'kg')
                                  }
                                }}
                                placeholder={t('weightKg') || 'Weight (kg)'}
                                min="0"
                                step="0.01"
                              />
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {set.weight && set.weight > 0 ? `≈ ${formatWeight(getWeightInLbs(set.weight))} ${t('lbs') || 'lbs'}` : ''}
                              </span>
                            </div>
                            <div>
                              <Input
                                type="number"
                                value={lastLbsInput[set.tempId] !== undefined 
                                  ? formatWeightForInput(lastLbsInput[set.tempId])
                                  : (set.weight && set.weight > 0 ? formatWeightForInput(getWeightInLbs(set.weight)) : '')
                                }
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                  if (!isNaN(value)) {
                                    handleWeightChange(set.tempId, value, 'lbs')
                                  }
                                }}
                                placeholder={t('weightLbs') || 'Weight (lbs)'}
                                min="0"
                                step="0.01"
                              />
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {set.weight && set.weight > 0 ? `≈ ${formatWeight(set.weight)} ${t('kg') || 'kg'}` : ''}
                              </span>
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
                  </SortableExerciseGroup>
                )
              })}
            </Accordion>
          </SortableContext>
        </DndContext>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
        {isSaving ? 'Saving Workout...' : 'Save Workout'}
      </Button>

      <WorkoutRestTimer />
    </div>
  )
}

