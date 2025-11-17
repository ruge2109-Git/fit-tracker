'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, TrendingUp, Clock } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion } from '@/components/ui/accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SortableExerciseGroup } from '@/components/workouts/sortable-exercise-group'
import { ExerciseProgressDialog } from '@/components/workouts/exercise-progress-dialog'
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
  const router = useNavigationRouter()
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
      toast.error(t('routineNotFound') || 'Routine not found')
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
    
    if (value > 0) {
      setSets(prev => prev.map(set => 
        set.tempId === tempId ? { ...set, completed: true } : set
      ))
    }
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
      toast.error(t('atLeastOneSet') || 'Add at least one set')
      return
    }

    const workoutData = { date, duration, notes, routine_id: routineId }
    const setsData = sets.map(({ tempId, exerciseName, ...set }) => set)

    const workoutId = await createWorkout(user.id, workoutData, setsData)

    if (workoutId) {
      clearWorkoutProgress(routineId)
      toast.success(t('workoutSavedSuccessfully') || 'Workout saved successfully!')
      setTimeout(() => {
        router.push(ROUTES.WORKOUT_DETAIL(workoutId))
      }, 500)
    } else {
      toast.error(t('failedToSaveWorkout') || 'Failed to save workout')
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
          {t('back') || 'Back'}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('saving') || 'Saving...' : t('saveWorkout') || 'Save Workout'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('fromRoutine') || 'Starting from'}: {routine.name}</CardTitle>
          <CardDescription>
            {routine.description || t('adjustSets') || 'Adjust the sets as needed for today\'s workout'}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('workoutDetails') || 'Workout Details'}</CardTitle>
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
            <Label htmlFor="notes">{t('notesOptional') || 'Notes (optional)'}</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('howFeeling') || 'How are you feeling today?'}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('exercises') || 'Exercises'}</h2>
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
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <ExerciseProgressDialog
                            exerciseId={exerciseId}
                            exerciseName={group.name}
                          >
                            <Button variant="outline" size="sm">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              {t('viewProgress') || 'View Progress'}
                            </Button>
                          </ExerciseProgressDialog>
                          {group.sets.length > 0 && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {t('restTime') || 'Rest'}: {group.sets[0]?.rest_time || 90}s
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSet(exerciseId, group.name)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('addSet') || 'Add Set'}
                        </Button>
                      </div>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b">
                              <TableHead className="w-8 sm:w-12 px-1 sm:px-4 py-2 text-xs sm:text-sm"></TableHead>
                              <TableHead className="w-10 sm:w-16 text-center px-1 sm:px-4 py-2 text-xs sm:text-sm">{t('set') || 'Set'}</TableHead>
                              <TableHead className="min-w-[60px] sm:min-w-[80px] px-1 sm:px-4 py-2 text-xs sm:text-sm">{t('reps') || 'Reps'}</TableHead>
                              <TableHead className="min-w-[70px] sm:min-w-[100px] px-1 sm:px-4 py-2 text-xs sm:text-sm">{t('weightKg') || 'Weight (kg)'}</TableHead>
                              <TableHead className="min-w-[70px] sm:min-w-[100px] px-1 sm:px-4 py-2 text-xs sm:text-sm">{t('weightLbs') || 'Weight (lbs)'}</TableHead>
                              <TableHead className="w-8 sm:w-12 px-1 sm:px-4 py-2 text-xs sm:text-sm"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.sets.map((set, index) => (
                              <TableRow 
                                key={set.tempId} 
                                className={`border-b ${set.completed ? 'bg-muted/50' : ''}`}
                              >
                                <TableCell className="w-8 sm:w-12 px-1 sm:px-4 py-1.5 sm:py-2">
                                  <Checkbox
                                    checked={set.completed || false}
                                    onCheckedChange={() => handleToggleSetCompleted(set.tempId)}
                                    id={`set-${set.tempId}`}
                                    className="h-4 w-4 sm:h-5 sm:w-5"
                                  />
                                </TableCell>
                                <TableCell className="w-10 sm:w-16 text-center px-1 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="px-1 sm:px-4 py-1.5 sm:py-2">
                                  <Input
                                    id={`reps-${set.tempId}`}
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) => handleUpdateSet(set.tempId, 'reps', parseInt(e.target.value))}
                                    className="w-full h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-3"
                                    min="1"
                                  />
                                </TableCell>
                                <TableCell className="px-1 sm:px-4 py-1.5 sm:py-2">
                                  <Input
                                    id={`weight-kg-${set.tempId}`}
                                    type="number"
                                    value={set.weight ? formatWeightForInput(set.weight) : ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                      if (!isNaN(value)) {
                                        handleWeightChange(set.tempId, value, 'kg')
                                      }
                                    }}
                                    className="w-full h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-3"
                                    min="0"
                                    step="0.01"
                                  />
                                </TableCell>
                                <TableCell className="px-1 sm:px-4 py-1.5 sm:py-2">
                                  <Input
                                    id={`weight-lbs-${set.tempId}`}
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
                                    className="w-full h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-3"
                                    min="0"
                                    step="0.01"
                                  />
                                </TableCell>
                                <TableCell className="w-8 sm:w-12 px-1 sm:px-4 py-1.5 sm:py-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveSet(set.tempId)}
                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </SortableExerciseGroup>
                )
              })}
            </Accordion>
          </SortableContext>
        </DndContext>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
        {isSaving ? t('saving') || 'Saving...' : t('saveWorkout') || 'Save Workout'}
      </Button>

      <WorkoutRestTimer />
    </div>
  )
}

