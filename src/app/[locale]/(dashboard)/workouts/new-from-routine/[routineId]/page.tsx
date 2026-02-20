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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from '@/components/ui/drawer'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { SortableExerciseCard } from '@/components/workouts/sortable-exercise-card'
import { ExerciseProgressDialog } from '@/components/workouts/exercise-progress-dialog'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { workoutRepository } from '@/domain/repositories/workout.repository'
import { WorkoutRestTimer } from '@/components/workouts/workout-rest-timer'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { useExerciseStore } from '@/store/exercise.store'
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
              rest_time: routineExercise.target_rest_time || 90,
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

  const { exercises: availableExercises } = useExerciseStore()
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)

  const handleRemoveExercise = (exerciseId: string) => {
      // Remove all sets for this exercise
      setSets(prev => prev.filter(set => set.exercise_id !== exerciseId))
      // Remove from order
      setExerciseOrder(prev => prev.filter(id => id !== exerciseId))
      
      // Cleanup inputs
      setLastLbsInput(prev => {
          const newInput = { ...prev }
          Object.keys(newInput).forEach(key => {
              if (key.startsWith(exerciseId)) {
                  delete newInput[key]
              }
          })
          return newInput
      })
      
      toast.success(t('exerciseRemoved') || 'Exercise removed')
  }

  const handleAddExerciseFromSelect = (exerciseId: string) => {
    const exercise = availableExercises.find(e => e.id === exerciseId)
    if (!exercise) return

    if (exerciseOrder.includes(exerciseId)) {
        toast.error(t('exerciseAlreadyAdded') || 'Exercise already added')
        return
    }

    // Add initial set
    const newSet: WorkoutSet = {
        tempId: `${exerciseId}-${Date.now()}`,
        exercise_id: exerciseId,
        exerciseName: exercise.name,
        reps: 0,
        weight: 0,
        rest_time: 90,
        completed: false
    }

    setSets(prev => [...prev, newSet])
    setExerciseOrder(prev => [...prev, exerciseId])
    setAddExerciseOpen(false)
    toast.success(t('exerciseAdded') || 'Exercise added')
  }

  const handleAddSet = (exerciseId: string, exerciseName: string) => {
    const lastSet = sets.filter(s => s.exercise_id === exerciseId).pop()
    setSets(prev => [...prev, {
      tempId: `${exerciseId}-${Date.now()}`,
      exercise_id: exerciseId,
      exerciseName,
      reps: lastSet?.reps || 0,
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
    <div className="max-w-7xl mx-auto sm:p-6 lg:p-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Info & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="rounded-full hover:bg-accent/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xs font-medium text-muted-foreground mb-1">
                  {t('startWorkout') || 'Start Workout'}
                </h1>
                <h2 className="text-2xl font-bold text-foreground">
                   {routine.name}
                </h2>
              </div>
            </div>

            {/* Workout Details Card */}
            <Card className="rounded-[2rem] border-none shadow-sm bg-accent/5 overflow-hidden">
                <CardHeader className="pb-2">
                     <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        {t('sessionDetails') || 'Session Details'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="date" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">
                                {t('date') || 'Date'}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-12 rounded-2xl bg-background/50 border-input/10 focus:border-primary/30 focus:ring-primary/20 font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">
                                {t('durationMinutes') || 'Duration'}
                            </Label>
                             <div className="relative">
                                <Input
                                    id="duration"
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                    min="1"
                                    className="h-12 rounded-2xl bg-background/50 border-input/10 focus:border-primary/30 focus:ring-primary/20 font-medium"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50 pointer-events-none">
                                    min
                                </span>
                            </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="notes" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">
                            {t('notesOptional') || 'Notes'}
                        </Label>
                        <Input
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('howFeeling') || 'How are you feeling?'}
                            className="h-12 rounded-2xl bg-background/50 border-input/10 focus:border-primary/30 focus:ring-primary/20"
                        />
                     </div>
                </CardContent>
            </Card>

             {/* Action Button (Desktop) */}
             <div className="hidden lg:block">
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    {isSaving ? t('saving') || 'Saving...' : t('finishWorkout') || 'Finish Workout'}
                </Button>
             </div>
             
             <WorkoutRestTimer className="bottom-24 lg:bottom-8 right-6 lg:right-8" />
          </div>
        </div>

        {/* Right Column - Exercises */}
        <div className="lg:col-span-7 space-y-6">
             <div className="flex items-center justify-between lg:hidden mb-4">
                 <h3 className="text-lg font-bold">
                    {t('exercises') || 'Exercises'}
                 </h3>
             </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={orderedExerciseIds}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {orderedExerciseIds.map((exerciseId, index) => {
                            const group = exerciseGroups[exerciseId]
                            if (!group) return null

                            // Routine target details
                            const targetReps = routine?.exercises.find(ex => ex.exercise_id === exerciseId)?.target_reps
                            const targetRepsMax = routine?.exercises.find(ex => ex.exercise_id === exerciseId)?.target_reps_max
                            const targetRest = group.sets[0]?.rest_time || 90

                            return (
                                <SortableExerciseCard
                                    key={exerciseId}
                                    id={exerciseId}
                                    exerciseName={group.name}
                                    value={exerciseId}
                                    className="bg-accent/5 rounded-[2rem] overflow-hidden"
                                    onRemove={() => handleRemoveExercise(exerciseId)}
                                    defaultOpen={index === 0}
                                >
                                    <div className="p-1">
                                        {/* Exercise Header Info */}
                                        <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/5 bg-background/20 rounded-t-[1.5rem]">
                                             <div className="flex items-center gap-2 text-xs">
                                                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Goal</span>
                                                  <span className="font-black text-foreground">
                                                    {targetReps}{targetRepsMax ? `-${targetRepsMax}` : ''} reps
                                                  </span>
                                             </div>
                                             <div className="flex items-center gap-2 text-xs">
                                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                                  <span className="font-black text-foreground">{targetRest}s</span>
                                             </div>
                                             
                                             <div className="ml-auto flex items-center gap-2">
                                                 <ExerciseProgressDialog
                                                    exerciseId={exerciseId}
                                                    exerciseName={group.name}
                                                >
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0">
                                                        <TrendingUp className="h-3.5 w-3.5" />
                                                    </Button>
                                                </ExerciseProgressDialog>
                                                
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleAddSet(exerciseId, group.name)}
                                                    className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3"
                                                >
                                                    <Plus className="h-3 w-3 mr-1.5" />
                                                    {t('addSet') || 'Add Set'}
                                                </Button>
                                             </div>
                                        </div>

                                        {/* Sets Table */}
                                        <div className="p-2 sm:p-4 overflow-x-auto">
                                                <Table className="border-separate border-spacing-y-2">
                                                    <TableHeader>
                                                        <TableRow className="border-none hover:bg-transparent">
                                                            <TableHead className="w-[40px] px-2 text-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent">#</TableHead>
                                                            <TableHead className="px-2 text-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent">{t('reps') || 'Reps'}</TableHead>
                                                            <TableHead className="px-2 text-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent">{t('weightKg') || 'kg'}</TableHead>
                                                            <TableHead className="px-2 text-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent">{t('weightLbs') || 'lbs'}</TableHead>
                                                            <TableHead className="w-[40px] px-2 text-right text-[10px] uppercase font-bold text-muted-foreground bg-transparent">Done</TableHead>
                                                            <TableHead className="w-[40px] px-0 bg-transparent"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {group.sets.map((set, setIndex) => (
                                                            <TableRow 
                                                                key={set.tempId} 
                                                                className={`border-none transition-all shadow-sm ${
                                                                    set.completed 
                                                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/15' 
                                                                    : 'bg-background/40 hover:bg-background/60'
                                                                }`}
                                                            >
                                                                <TableCell className="px-2 py-3 text-center font-bold text-xs text-muted-foreground rounded-l-2xl">
                                                                    {setIndex + 1}
                                                                </TableCell>
                                                                <TableCell className="px-1 py-1">
                                                                    <Input
                                                                        type="number"
                                                                        value={set.reps}
                                                                        onChange={(e) => handleUpdateSet(set.tempId, 'reps', parseInt(e.target.value))}
                                                                        className="h-10 text-center font-bold bg-background/50 border-transparent focus:border-primary/20 focus:bg-background transition-all p-0 rounded-xl"
                                                                        min="1"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="px-1 py-1">
                                                                    <Input
                                                                        type="number"
                                                                        value={set.weight ? formatWeightForInput(set.weight) : ''}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                                                            if (!isNaN(value)) {
                                                                                handleWeightChange(set.tempId, value, 'kg')
                                                                            }
                                                                        }}
                                                                        className="h-10 text-center font-bold bg-background/50 border-transparent focus:border-primary/20 focus:bg-background transition-all p-0 rounded-xl"
                                                                        placeholder="0"
                                                                        step="0.5"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="px-1 py-1">
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
                                                                        className="h-10 text-center font-bold bg-background/50 border-transparent focus:border-primary/20 focus:bg-background transition-all p-0 text-muted-foreground rounded-xl"
                                                                        placeholder="0"
                                                                        step="1"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="px-2 py-3 text-right">
                                                                     <Checkbox
                                                                        checked={set.completed || false}
                                                                        onCheckedChange={() => handleToggleSetCompleted(set.tempId)}
                                                                        className="h-6 w-6 rounded-lg data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 border-2"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="px-0 py-3 text-center rounded-r-2xl">
                                                                     <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleRemoveSet(set.tempId)}
                                                                        className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 -ml-2 rounded-full"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                        </div>
                                    </div>
                                </SortableExerciseCard>
                            )
                        })}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Add Exercise Button */}
            <div className="pt-4">
                <Drawer open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
                    <DrawerTrigger asChild>
                         <Button
                            variant="outline"
                            className="w-full h-12 rounded-2xl border-dashed border-2 hover:bg-accent/5 font-bold text-muted-foreground"
                         >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('addExercise') || 'Add Exercise'}
                         </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[85vh]">
                         <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted/20" />
                         <DrawerHeader className="px-6 pb-2">
                             <DrawerTitle className="text-xl font-bold text-left">
                                 {t('addExercise') || 'Add Exercise'}
                             </DrawerTitle>
                             <DrawerDescription className="text-left font-medium">
                                 {t('selectExercise') || 'Select an exercise to add to your workout'}
                             </DrawerDescription>
                         </DrawerHeader>
                         <div className="px-6 pb-8 pt-2">
                             <ExerciseSelect
                                 value=""
                                 onChange={handleAddExerciseFromSelect}
                             />
                         </div>
                    </DrawerContent>
                </Drawer>
            </div>
             
             {/* Bottom Save Button (Mobile) - Centered between coach (left) and timer (right) */}
             <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-auto">
                 <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="w-full h-12 rounded-full text-base font-bold shadow-2xl shadow-primary/30 bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all border-none"
                >
                     {isSaving ? t('saving') || 'Saving...' : t('finishWorkout') || 'Finish Workout'}
                </Button>
             </div>
        </div>
      </div>
    </div>
  )
}

