/**
 * New Routine Page
 * Create a new workout routine
 */

'use client'

import { useState } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Plus, Trash2, Dumbbell, Edit, Clock, Calendar, Info, CheckCircle2, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { useAuthStore } from '@/store/auth.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { DayOfWeek } from '@/types'
import { getDaysOfWeekOptions, ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import { useExerciseStore } from '@/store/exercise.store'
import { cn } from '@/lib/utils'

const routineSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  scheduled_days: z.array(z.string()).optional(),
})

type RoutineFormData = z.infer<typeof routineSchema>

interface RoutineExercise {
  id?: string // temp id for UI
  exercise_id: string
  target_sets: number
  target_reps: number // min
  target_reps_max?: number // max
  target_rest_time?: number // seconds
  target_weight?: number
  order: number
}

export default function NewRoutinePage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const { exercises: availableExercises } = useExerciseStore()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const tWorkout = useTranslations('workouts')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [exercises, setExercises] = useState<RoutineExercise[]>([])

  const dayOptions = getDaysOfWeekOptions(t)
  
  // Exercise creation state
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false)
  const [currentExercise, setCurrentExercise] = useState<Partial<RoutineExercise>>({
    exercise_id: '',
    target_sets: undefined,
    target_reps: undefined,
    target_reps_max: undefined,
    target_rest_time: undefined,
    target_weight: undefined,
  })

  // Edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editExerciseDialogOpen, setEditExerciseDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue
  } = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      name: '',
      description: '',
      scheduled_days: [],
    },
  })

  const toggleDay = (day: string) => {
    const dayValue = day as DayOfWeek
    setSelectedDays((prev) => {
        const newDays = prev.includes(dayValue) 
            ? prev.filter((d) => d !== dayValue) 
            : [...prev, dayValue]
        setValue('scheduled_days', newDays)
        return newDays
    })
  }

  const handleDayClick = (dayValue: string) => {
    toggleDay(dayValue)
  }


  const handleAddExercise = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!currentExercise.exercise_id) {
      toast.error(tWorkout('pleaseSelectExercise') || 'Please select an exercise')
      return
    }

    const newExercise: RoutineExercise = {
      id: Math.random().toString(36).substr(2, 9), // Temp ID
      exercise_id: currentExercise.exercise_id,
      target_sets: currentExercise.target_sets || 0,
      target_reps: currentExercise.target_reps || 0,
      target_reps_max: currentExercise.target_reps_max,
      target_rest_time: currentExercise.target_rest_time,
      target_weight: currentExercise.target_weight,
      order: exercises.length + 1,
    }

    setExercises([...exercises, newExercise])
    setCurrentExercise({
        exercise_id: '',
        target_sets: undefined,
        target_reps: undefined,
        target_reps_max: undefined,
        target_rest_time: undefined,
        target_weight: undefined,
    })
    setAddExerciseDialogOpen(false)
    toast.success(t('exerciseAdded') || 'Exercise added!')
  }

  const handleInitiateEdit = (index: number) => {
    setEditingIndex(index)
    setCurrentExercise({ ...exercises[index] })
    setEditExerciseDialogOpen(true)
  }

  const handleUpdateExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingIndex === null) return

    const updatedExercises = [...exercises]
    updatedExercises[editingIndex] = {
        ...updatedExercises[editingIndex],
        ...currentExercise as RoutineExercise
    }
    
    setExercises(updatedExercises)
    setEditExerciseDialogOpen(false)
    setEditingIndex(null)
    toast.success(t('exerciseUpdated') || 'Exercise updated')
  }

  const handleRemoveExercise = (index: number) => {
    if (!confirm(t('confirmRemoveExercise') || 'Remove this exercise?')) return
    
    setExercises(exercises.filter((_, i) => i !== index).map((ex, i) => ({ ...ex, order: i + 1 })))
    if (editingIndex === index) {
        setEditExerciseDialogOpen(false)
        setEditingIndex(null)
    }
  }


  const handleCreateRoutine = async (data: RoutineFormData) => {
    if (!user) return

    if (exercises.length === 0) {
      toast.error(t('addAtLeastOneExercise') || 'Please add at least one exercise')
      return
    }

    setIsSubmitting(true)
    try {
      const routineData = {
        user_id: user.id,
        name: data.name,
        description: data.description,
        is_active: true,
        scheduled_days: selectedDays,
      }

      const result = await routineRepository.create(routineData)

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to create routine')
      }

      const routineId = result.data.id

      // Add exercises
      if (exercises.length > 0) {
        for (const exercise of exercises) {
            await routineRepository.addExercise({
              routine_id: routineId,
              exercise_id: exercise.exercise_id,
              target_sets: exercise.target_sets,
              target_reps: exercise.target_reps,
              target_reps_max: exercise.target_reps_max,
              target_rest_time: exercise.target_rest_time,
              target_weight: exercise.target_weight,
              order: exercise.order,
            })
        }
      }

      logAuditEvent({
        action: 'create_routine',
        entityType: 'routine',
        entityId: routineId,
        details: { name: routineData.name },
      })

      toast.success(t('routineCreated') || 'Routine created successfully!')
      router.push(ROUTES.ROUTINES)
    } catch (error) {
      logger.error('Error creating routine', error as Error, 'NewRoutinePage')
      toast.error(t('failedToCreateRoutine') || 'Failed to create routine. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header - Simple & Elegant to match Detail Page */}
      <div className="flex items-center justify-between px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(ROUTES.ROUTINES)}
          className="rounded-full bg-accent/10 h-9 w-9 hover:bg-accent/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground/80 italic">{t('createRoutine') || 'NEW ROUTINE'}</h1>
        <div className="w-9" /> {/* Spacer to center title */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Routine Info - Take 5 columns */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-[2rem] border-none shadow-sm bg-accent/5 overflow-hidden transition-all duration-300">
            <CardHeader className="pb-0 pt-6 px-6">
               <div className="flex items-center justify-between mb-4">
                 <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary/60" />
                  {t('routineInformation') || 'Information'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2 p-6">
                <div className="space-y-4">
                  <div className="space-y-1.5 px-0.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      {t('routineName')}
                    </Label>
                    <Input
                      {...register('name')}
                      placeholder="e.g. Push Day"
                      className="h-10 bg-background/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 font-bold"
                    />
                    {errors.name && <p className="text-[10px] text-destructive font-medium ml-1">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5 px-0.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      {t('routineDescription')}
                    </Label>
                    <textarea
                      {...register('description')}
                      placeholder={t('descriptionPlaceholder') || "Optional description..."}
                      className="w-full min-h-[80px] bg-background/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 font-medium p-3 text-xs resize-none"
                    />
                  </div>
                </div>

              <div className="space-y-3 pt-2">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 px-0.5 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {t('scheduledDays')}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => {
                    const isSelected = selectedDays.includes(day.value as DayOfWeek)
                    return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleDayClick(day.value)}
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                            isSelected 
                              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                              : "bg-background/20 border-accent/5 text-muted-foreground/30 hover:bg-background/40"
                          )}
                        >
                          {day.label.substring(0, 1).toUpperCase()}
                        </button>
                    )
                  })}
                </div>
              </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSubmit(handleCreateRoutine)}
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isSubmitting ? tCommon('saving') : t('createRoutine')}
                  </Button>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Exercises - Take 7 columns */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-[2rem] border-none shadow-sm bg-accent/5 overflow-hidden min-h-[500px]">
             <CardHeader className="pb-0 pt-6 px-6">
               <div className="flex items-center justify-between mb-4">
                 <CardTitle className="text-base font-bold flex items-center gap-2">
                   <Dumbbell className="h-4 w-4 text-primary/60" />
                   {tWorkout('exercises')} ({exercises.length})
                 </CardTitle>
                 <div className="flex gap-2">
                   <Button 
                     onClick={() => {
                        setCurrentExercise({
                            exercise_id: '',
                            target_sets: undefined,
                            target_reps: undefined,
                            target_reps_max: undefined,
                            target_rest_time: undefined,
                            target_weight: undefined,
                        })
                        setAddExerciseDialogOpen(true)
                     }}
                     size="sm"
                     className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
                   >
                     <Plus className="h-3.5 w-3.5 mr-1.5" />
                     {t('addExercise')}
                   </Button>
                 </div>
               </div>
             </CardHeader>
            <CardContent className="pt-4 p-6">
              {exercises.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
                  <Dumbbell className="h-12 w-12 mb-4 stroke-[1px]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('noExercisesYet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                    {exercises.map((exercise, index) => {
                        const exerciseName = availableExercises.find(e => e.id === exercise.exercise_id)?.name || `Exercise ${index + 1}`
                        const muscleGroup = availableExercises.find(e => e.id === exercise.exercise_id)?.muscle_group
                        
                        return (
                          <div 
                            key={index}
                            onClick={() => handleInitiateEdit(index)}
                            className="bg-background/60 hover:bg-background/80 border border-transparent hover:border-accent/10 rounded-2xl p-4 transition-all group cursor-pointer"
                          >
                             <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent-foreground/50 shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm truncate pr-4">{exerciseName}</h4>
                                     <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/5">
                                            <span className="text-[10px] font-black text-primary">{exercise.target_sets}</span>
                                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">{tCommon('sets')}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/5">
                                            <span className="text-[10px] font-black text-primary">
                                                {exercise.target_reps}{exercise.target_reps_max ? `-${exercise.target_reps_max}` : ''}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">{tCommon('reps')}</span>
                                        </div>
                                        {exercise.target_weight ? (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/5">
                                                <span className="text-[10px] font-black text-primary">{exercise.target_weight}</span>
                                                <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">{tCommon('kg')}</span>
                                            </div>
                                        ) : null}
                                         {exercise.target_rest_time ? (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/5">
                                                <span className="text-[10px] font-black text-primary">{exercise.target_rest_time}s</span>
                                                <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">{t('restTime')}</span>
                                            </div>
                                        ) : null}
                                     </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveExercise(index)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                          </div>
                        )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

       {/* Add/Edit Exercise Drawer - Reusing similar style to detail page */}
      <Drawer open={addExerciseDialogOpen || editExerciseDialogOpen} onOpenChange={(open) => {
        if (!open) {
            setAddExerciseDialogOpen(false)
            setEditExerciseDialogOpen(false)
            setEditingIndex(null)
        }
      }}>
        <DrawerContent className="max-w-md mx-auto rounded-t-[2.5rem] border-none bg-background/95 backdrop-blur-xl shadow-2xl">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted/20" />
          <DrawerHeader className="px-8 pt-6 pb-2">
            <DrawerTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                {editExerciseDialogOpen ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold tracking-[0.2em] text-primary/60 mb-0.5">
                    {editExerciseDialogOpen ? tCommon('edit') : tCommon('add')}
                </span>
                <span className="truncate max-w-[250px]">
                    {availableExercises.find(e => e.id === currentExercise.exercise_id)?.name || t('exerciseDetails')}
                </span>
              </div>
            </DrawerTitle>
            <DrawerDescription className="text-xs font-medium italic opacity-60 text-left pl-14">
              {t('modifyExerciseDetails') || 'Set your targets for this exercise'}
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={editExerciseDialogOpen ? handleUpdateExercise : handleAddExercise} className="px-8 py-6 space-y-6">
            {!editExerciseDialogOpen && (
                <div className="space-y-1.5 px-0.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        {tWorkout('exercise')}
                    </Label>
                    <ExerciseSelect
                        value={currentExercise.exercise_id || ''}
                        onChange={(val) => setCurrentExercise({ ...currentExercise, exercise_id: val })}
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t('targetSets')}
                </Label>
                <Input
                  type="number"
                  value={currentExercise.target_sets ?? ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, target_sets: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="1"
                  placeholder="-"
                />
              </div>
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {tCommon('kg')} {t('optional')}
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  value={currentExercise.target_weight ?? ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, target_weight: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="0"
                  placeholder="-" // Optional
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t('minReps') || 'Min Reps'}
                </Label>
                <Input
                  type="number"
                  value={currentExercise.target_reps ?? ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, target_reps: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="1"
                  placeholder="-"
                />
              </div>
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t('maxReps') || 'Max Reps'}
                </Label>
                <Input
                  type="number"
                  value={currentExercise.target_reps_max || ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, target_reps_max: parseInt(e.target.value) || undefined })}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="1"
                  placeholder="-"
                />
              </div>
            </div>

             <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t('restTime') || 'Rest Time (seconds)'}
                </Label>
                <Input
                  type="number"
                  value={currentExercise.target_rest_time ?? ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, target_rest_time: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="0"
                  placeholder="60"
                />
              </div>

            <Button 
                type="submit" 
                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                {editExerciseDialogOpen ? tCommon('saveChanges') : t('addExercise')}
            </Button>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
