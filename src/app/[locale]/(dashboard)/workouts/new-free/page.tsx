'use client'

import { useEffect, useState } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, TrendingUp, Clock, Sparkles } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from '@/components/ui/drawer'
import { SortableExerciseCard } from '@/components/workouts/sortable-exercise-card'
import { ExerciseProgressDialog } from '@/components/workouts/exercise-progress-dialog'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { WorkoutRestTimer } from '@/components/workouts/workout-rest-timer'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { useExerciseStore } from '@/store/exercise.store'
import { SetFormData } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useWorkoutPersistence, loadWorkoutProgress, clearWorkoutProgress } from '@/hooks/use-workout-persistence'
import { useTranslations } from 'next-intl'

interface WorkoutSet extends SetFormData {
  tempId: string
  exerciseName: string
  completed?: boolean
}

const KG_TO_LBS = 2.20462
const LBS_TO_KG = 1 / KG_TO_LBS
const FREE_WORKOUT_ID = 'free-workout'

const convertLbsToKg = (lbs: number) => Math.round(lbs * LBS_TO_KG * 100) / 100
const convertKgToLbs = (kg: number) => Math.round(kg * KG_TO_LBS * 100) / 100
const round2 = (v: number) => Math.round(v * 100) / 100

export default function NewFreeWorkoutPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const { createWorkout, isLoading: isSaving } = useWorkoutStore()
  const { exercises: availableExercises, loadExercises } = useExerciseStore()
  const t = useTranslations('workouts')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [isRestoring, setIsRestoring] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastLbsInput, setLastLbsInput] = useState<Record<string, number>>({})
  const [exerciseOrder, setExerciseOrder] = useState<string[]>([])
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useWorkoutPersistence(
    FREE_WORKOUT_ID,
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
      })),
    },
    undefined,
    isRestoring || !isInitialized
  )

  useEffect(() => {
    if (user) {
      loadExercises()
    }
    // Restore saved progress
    setIsRestoring(true)
    const saved = loadWorkoutProgress(FREE_WORKOUT_ID)
    if (saved?.sets?.length) {
      setDate(saved.date || new Date().toISOString().split('T')[0])
      setDuration(saved.duration || 60)
      setNotes(saved.notes || '')
      const restoredSets = saved.sets as WorkoutSet[]
      setSets(restoredSets)
      setExerciseOrder(Array.from(new Set(restoredSets.map(s => s.exercise_id))))
      toast.success(t('progressRestored') || 'Workout progress restored!')
    }
    setTimeout(() => { setIsRestoring(false); setIsInitialized(true) }, 200)
  }, [user])

  // ─── Set handlers ────────────────────────────────────────────────────────
  const handleUpdateSet = (tempId: string, field: keyof SetFormData, value: number) =>
    setSets(prev => prev.map(s => s.tempId === tempId ? { ...s, [field]: value } : s))

  const handleToggleCompleted = (tempId: string) =>
    setSets(prev => prev.map(s => s.tempId === tempId ? { ...s, completed: !s.completed } : s))

  const handleWeightChange = (tempId: string, value: number, unit: 'kg' | 'lbs') => {
    let kg: number
    if (unit === 'kg') {
      kg = round2(value)
      setLastLbsInput(prev => { const n = { ...prev }; delete n[tempId]; return n })
    } else {
      setLastLbsInput(prev => ({ ...prev, [tempId]: round2(value) }))
      kg = round2(convertLbsToKg(value))
    }
    handleUpdateSet(tempId, 'weight', kg)
    if (value > 0) setSets(prev => prev.map(s => s.tempId === tempId ? { ...s, completed: true } : s))
  }

  const handleRemoveSet = (tempId: string) => {
    setSets(prev => prev.filter(s => s.tempId !== tempId))
    setLastLbsInput(prev => { const n = { ...prev }; delete n[tempId]; return n })
  }

  // ─── Exercise handlers ───────────────────────────────────────────────────
  const handleAddExercise = (exerciseId: string) => {
    const exercise = availableExercises.find(e => e.id === exerciseId)
    if (!exercise) return
    if (exerciseOrder.includes(exerciseId)) {
      toast.error(t('exerciseAlreadyAdded') || 'Exercise already added')
      return
    }
    setSets(prev => [...prev, {
      tempId: `${exerciseId}-${Date.now()}`,
      exercise_id: exerciseId,
      exerciseName: exercise.name,
      reps: 10,
      weight: 0,
      rest_time: 90,
      completed: false,
    }])
    setExerciseOrder(prev => [...prev, exerciseId])
    setAddExerciseOpen(false)
    toast.success(t('exerciseAdded') || 'Exercise added')
  }

  const handleAddSet = (exerciseId: string, exerciseName: string) => {
    const last = sets.filter(s => s.exercise_id === exerciseId).pop()
    setSets(prev => [...prev, {
      tempId: `${exerciseId}-${Date.now()}`,
      exercise_id: exerciseId,
      exerciseName,
      reps: last?.reps || 10,
      weight: last?.weight || 0,
      rest_time: 90,
      completed: false,
    }])
  }

  const handleRemoveExercise = (exerciseId: string) => {
    setSets(prev => prev.filter(s => s.exercise_id !== exerciseId))
    setExerciseOrder(prev => prev.filter(id => id !== exerciseId))
    setLastLbsInput(prev => {
      const n = { ...prev }
      Object.keys(n).forEach(k => { if (k.startsWith(exerciseId)) delete n[k] })
      return n
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = exerciseOrder.indexOf(active.id as string)
    const newIndex = exerciseOrder.indexOf(over.id as string)
    if (oldIndex !== -1 && newIndex !== -1) setExerciseOrder(arrayMove(exerciseOrder, oldIndex, newIndex))
  }

  const handleSave = async () => {
    if (!user) return
    if (sets.length === 0) { toast.error(t('atLeastOneSet') || 'Add at least one set'); return }
    const workoutId = await createWorkout(user.id, { date, duration, notes }, sets.map(({ tempId, exerciseName, ...s }) => s))
    if (workoutId) {
      clearWorkoutProgress(FREE_WORKOUT_ID)
      toast.success(t('workoutSavedSuccessfully') || 'Workout saved!')
      setTimeout(() => router.push(ROUTES.WORKOUT_DETAIL(workoutId)), 500)
    } else {
      toast.error(t('failedToSaveWorkout') || 'Failed to save workout')
    }
  }

  // ─── Derived state ────────────────────────────────────────────────────────
  const exerciseGroups = sets.reduce((acc, set) => {
    if (!acc[set.exercise_id]) acc[set.exercise_id] = { name: set.exerciseName, sets: [] }
    acc[set.exercise_id].sets.push(set)
    return acc
  }, {} as Record<string, { name: string; sets: WorkoutSet[] }>)

  const orderedIds = exerciseOrder.length > 0
    ? exerciseOrder.filter(id => exerciseGroups[id])
    : Object.keys(exerciseGroups)

  const completedSets = sets.filter(s => s.completed).length

  return (
    <div className="max-w-7xl mx-auto sm:p-6 lg:p-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left column — sticky info panel ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">

            {/* Header */}
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
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('newWorkout')}
                </p>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t('freeWorkout') || 'Free Workout'}
                </h1>
              </div>
            </div>

            {/* Progress pill */}
            {sets.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">{completedSets}</span>
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                    {completedSets}/{sets.length} series completadas
                  </p>
                  <div className="mt-1 h-1 w-32 bg-emerald-500/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${sets.length > 0 ? (completedSets / sets.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Session details */}
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
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="h-12 rounded-2xl bg-background/50 border-input/10 focus:border-primary/30 focus:ring-primary/20 font-medium"
                    />
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
                        onChange={e => setDuration(parseInt(e.target.value))}
                        min="1"
                        className="h-12 rounded-2xl bg-background/50 border-input/10 focus:border-primary/30 focus:ring-primary/20 font-medium"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50 pointer-events-none">min</span>
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
                    onChange={e => setNotes(e.target.value)}
                    placeholder={t('howFeeling') || 'How are you feeling?'}
                    className="h-12 rounded-2xl bg-background/50 border-input/10 focus:border-primary/30 focus:ring-primary/20"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save — desktop */}
            <div className="hidden lg:block">
              <Button
                onClick={handleSave}
                disabled={isSaving || sets.length === 0}
                className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isSaving ? t('saving') || 'Saving...' : t('finishWorkout') || 'Finish Workout'}
              </Button>
            </div>

            <WorkoutRestTimer className="bottom-24 lg:bottom-8 right-6 lg:right-8" />
          </div>
        </div>

        {/* ── Right column — exercises ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between lg:hidden mb-2">
            <h2 className="text-lg font-bold">{t('exercises') || 'Exercises'}</h2>
          </div>

          {orderedIds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2rem] border-2 border-dashed border-accent/20">
              <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">
                {t('noExercisesYet') || 'No exercises yet'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {t('addFirstExercise') || 'Add your first exercise below'}
              </p>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {orderedIds.map((exerciseId, index) => {
                  const group = exerciseGroups[exerciseId]
                  if (!group) return null
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
                        {/* Exercise sub-header */}
                        <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/5 bg-background/20 rounded-t-[1.5rem]">
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-black text-foreground">{targetRest}s</span>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <ExerciseProgressDialog exerciseId={exerciseId} exerciseName={group.name}>
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

                        {/* Sets table */}
                        <div className="p-2 sm:p-4 overflow-x-auto">
                          <Table className="border-separate border-spacing-y-2">
                            <TableHeader>
                              <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="w-[40px] px-2 text-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent">#</TableHead>
                                <TableHead className="px-2 text-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent">{t('reps') || 'Reps'}</TableHead>
                                <TableHead className="px-2 text-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent">{t('weightKg') || 'kg'}</TableHead>
                                <TableHead className="px-2 text-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent">{t('weightLbs') || 'lbs'}</TableHead>
                                <TableHead className="w-[40px] px-2 text-right text-[10px] uppercase font-bold text-muted-foreground bg-transparent">Done</TableHead>
                                <TableHead className="w-[40px] px-0 bg-transparent" />
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
                                      onChange={e => handleUpdateSet(set.tempId, 'reps', parseInt(e.target.value))}
                                      className="h-10 text-center font-bold bg-background/50 border-transparent focus:border-primary/20 focus:bg-background transition-all p-0 rounded-xl"
                                      min="1"
                                    />
                                  </TableCell>
                                  <TableCell className="px-1 py-1">
                                    <Input
                                      type="number"
                                      value={set.weight ? round2(set.weight) : ''}
                                      onChange={e => {
                                        const v = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                        if (!isNaN(v)) handleWeightChange(set.tempId, v, 'kg')
                                      }}
                                      className="h-10 text-center font-bold bg-background/50 border-transparent focus:border-primary/20 focus:bg-background transition-all p-0 rounded-xl"
                                      placeholder="0"
                                      step="0.5"
                                    />
                                  </TableCell>
                                  <TableCell className="px-1 py-1">
                                    <Input
                                      type="number"
                                      value={
                                        lastLbsInput[set.tempId] !== undefined
                                          ? round2(lastLbsInput[set.tempId])
                                          : set.weight && set.weight > 0
                                            ? round2(convertKgToLbs(set.weight))
                                            : ''
                                      }
                                      onChange={e => {
                                        const v = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                        if (!isNaN(v)) handleWeightChange(set.tempId, v, 'lbs')
                                      }}
                                      className="h-10 text-center font-bold bg-background/50 border-transparent focus:border-primary/20 focus:bg-background transition-all p-0 text-muted-foreground rounded-xl"
                                      placeholder="0"
                                      step="1"
                                    />
                                  </TableCell>
                                  <TableCell className="px-2 py-3 text-right">
                                    <Checkbox
                                      checked={set.completed || false}
                                      onCheckedChange={() => handleToggleCompleted(set.tempId)}
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

          {/* Add exercise button */}
          <div className="pt-2">
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
                  <ExerciseSelect value="" onChange={handleAddExercise} />
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Save — mobile fixed, centered between coach (left) and timer (right) */}
          <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-auto">
            <Button
              onClick={handleSave}
              disabled={isSaving || sets.length === 0}
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
