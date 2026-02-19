/**
 * Routine Detail Page
 * View and manage routine exercises
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
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
import { ArrowLeft, Plus, Trash2, Dumbbell, Edit, Copy, MoreVertical, Share2, Calendar, Info, Clock, CheckCircle2, ChevronRight, Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { SortableExerciseItem } from '@/components/routines/sortable-exercise-item'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { RoutineWithExercises, RoutineExercise, DayOfWeek } from '@/types'
import { ROUTES, DAYS_OF_WEEK_OPTIONS } from '@/lib/constants'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/store/auth.store'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'


export default function RoutineDetailPage() {
  const params = useParams()
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [editExerciseDialogOpen, setEditExerciseDialogOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<RoutineExercise | null>(null)
  const [isUpdatingExercise, setIsUpdatingExercise] = useState(false)
  const [isUpdatingRoutine, setIsUpdatingRoutine] = useState(false)
  const [isEditingRoutine, setIsEditingRoutine] = useState(false)
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [newExerciseData, setNewExerciseData] = useState({
    exercise_id: '',
    target_sets: 3,
    target_reps: 10,
    target_reps_max: undefined as number | undefined,
    target_weight: undefined as number | undefined,
    target_rest_time: 60 as number | undefined,
  })
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editScheduledDays, setEditScheduledDays] = useState<DayOfWeek[]>([])
  const [editIsPublic, setEditIsPublic] = useState(false)
  const routineId = params.id as string

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


  useEffect(() => {
    if (routineId) {
      loadRoutine()
    }
  }, [routineId])

  const loadRoutine = async () => {
    setIsLoading(true)
    try {
      const result = await routineRepository.findById(routineId)
      if (result.data) {
        setRoutine(result.data)
        // Initialize edit states
        setEditName(result.data.name)
        setEditDescription(result.data.description || '')
        setEditScheduledDays(result.data.scheduled_days || [])
        setEditIsPublic(result.data.is_public || false)
      } else {
        toast.error(t('failedToLoad') || 'Failed to load routine')
      }
    } catch (error) {
      logger.error('Error loading routine', error as Error, 'RoutineDetailPage')
      toast.error(t('failedToLoad') || 'Failed to load routine')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete') || 'Are you sure you want to delete this routine?')) return

    const result = await routineRepository.delete(routineId)
    if (result.data) {
      // Log delete routine event
      logAuditEvent({
        action: 'delete_routine',
        entityType: 'routine',
        entityId: routineId,
      })
      
      toast.success(t('routineDeleted') || 'Routine deleted')
      router.push(ROUTES.ROUTINES)
    } else {
      toast.error(t('failedToDelete') || 'Failed to delete routine')
    }
  }

  const handleUpdateRoutine = async () => {
    if (!routine) return

    setIsUpdatingRoutine(true)
    try {
      const result = await routineRepository.update(routineId, {
        name: editName,
        description: editDescription,
        scheduled_days: editScheduledDays,
        is_public: editIsPublic,
      })

      if (result.data) {
        logAuditEvent({
          action: 'update_routine',
          entityType: 'routine',
          entityId: routineId,
        })
        toast.success(t('routineUpdatedSuccessfully') || 'Routine updated successfully!')
        setRoutine({ ...routine, ...result.data })
        setIsEditingRoutine(false)
      } else {
        toast.error(t('failedToUpdateRoutine') || 'Failed to update routine')
      }
    } catch (error) {
      logger.error('Error updating routine', error as Error, 'RoutineDetailPage')
      toast.error(t('failedToUpdateRoutine') || 'Failed to update routine')
    } finally {
      setIsUpdatingRoutine(false)
    }
  }

  const handleToggleActive = async () => {
    if (!routine) return

    const result = await routineRepository.update(routineId, {
      is_active: !routine.is_active,
    })

    if (result.data) {
      // Log update routine event
      logAuditEvent({
        action: 'update_routine',
        entityType: 'routine',
        entityId: routineId,
        details: { is_active: !routine.is_active },
      })
      toast.success(routine.is_active ? t('routineDeactivated') || 'Routine deactivated' : t('routineActivated') || 'Routine activated')
      loadRoutine()
    } else {
      toast.error(t('failedToUpdate') || 'Failed to update routine')
    }
  }

  const handleDuplicate = async () => {
    if (!routine) return

    if (!user) {
        toast.error(tCommon('pleaseLogin') || 'Please login to duplicate routines')
        // Optional: redirect to login
        router.push('/auth/login')
        return
    }

    setIsDuplicating(true)
    try {
      // Create new routine with "Copy of" prefix for the CURRENT USER
      const newRoutineResult = await routineRepository.create({
        user_id: user.id,
        name: `${t('copyOf') || 'Copy of'} ${routine.name}`,
        description: routine.description,
        is_active: false,
        scheduled_days: routine.scheduled_days,
        is_public: false, // Copies should be private by default
      })

      if (newRoutineResult.error || !newRoutineResult.data) {
        throw new Error('Failed to create routine copy')
      }

      const newRoutineId = newRoutineResult.data.id

      // Copy all exercises
      if (routine.exercises && routine.exercises.length > 0) {
        for (const exercise of routine.exercises) {
          await routineRepository.addExercise({
            routine_id: newRoutineId,
            exercise_id: exercise.exercise_id,
            target_sets: exercise.target_sets,
            target_reps: exercise.target_reps,
            target_reps_max: exercise.target_reps_max,
            target_weight: exercise.target_weight,
            target_rest_time: exercise.target_rest_time,
            order: exercise.order,
          })
        }
      }

      toast.success(t('routineDuplicated') || 'Routine duplicated successfully!')
      router.push(ROUTES.ROUTINE_DETAIL(newRoutineId))
    } catch (error) {
      toast.error(t('failedToDuplicate') || 'Failed to duplicate routine')
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleShare = () => {
    if (!routine) return
    const url = `${window.location.origin}${ROUTES.ROUTINE_DETAIL(routineId)}`
    setShareLink(url)
    setShareDialogOpen(true)
    
    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success(t('linkCopied') || 'Link copied to clipboard')
      })
    }
  }


  const handleRemoveExercise = async (routineExerciseId: string) => {
    if (!confirm(t('confirmRemoveExercise') || 'Remove this exercise from the routine?')) return

    const result = await routineRepository.removeExercise(routineExerciseId)
    
    if (result.error) {
      toast.error(t('failedToRemoveExercise') || 'Failed to remove exercise')
    } else {
      toast.success(t('exerciseRemoved') || 'Exercise removed')
      loadRoutine()
    }
  }

  const handleEditClick = (exercise: RoutineExercise) => {
    setEditingExercise(exercise)
    setEditExerciseDialogOpen(true)
  }

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExerciseData.exercise_id) {
        toast.error(t('pleaseSelectExercise') || 'Please select an exercise')
        return
    }

    setIsAddingExercise(true)
    try {
      const nextOrder = routine?.exercises ? routine.exercises.length + 1 : 1
      const result = await routineRepository.addExercise({
        routine_id: routineId,
        exercise_id: newExerciseData.exercise_id,
        target_sets: newExerciseData.target_sets,
        target_reps: newExerciseData.target_reps,
        target_reps_max: newExerciseData.target_reps_max,
        target_weight: newExerciseData.target_weight,
        target_rest_time: newExerciseData.target_rest_time,
        order: nextOrder,
      })

      if (result.data) {
        toast.success(t('exerciseAdded') || 'Exercise added successfully!')
        setAddExerciseDialogOpen(false)
        setNewExerciseData({
          exercise_id: '',
          target_sets: 3,
          target_reps: 10,
          target_reps_max: undefined,
          target_weight: undefined,
          target_rest_time: 60,
        })
        loadRoutine()
      } else {
        toast.error(t('failedToAddExercise') || 'Failed to add exercise')
      }
    } catch (error) {
      logger.error('Error adding exercise', error as Error, 'RoutineDetailPage')
      toast.error(t('failedToAddExercise') || 'Failed to add exercise')
    } finally {
      setIsAddingExercise(false)
    }
  }

  const handleUpdateExercise = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingExercise) return

    setIsUpdatingExercise(true)
    try {
      const result = await routineRepository.updateExercise(editingExercise.id, {
        target_sets: editingExercise.target_sets,
        target_reps: editingExercise.target_reps,
        target_reps_max: editingExercise.target_reps_max,
        target_weight: editingExercise.target_weight,
        target_rest_time: editingExercise.target_rest_time,
      })

      if (result.error) throw new Error('Failed to update exercise')

      toast.success(t('exerciseUpdated') || 'Exercise updated successfully')
      setEditExerciseDialogOpen(false)
      loadRoutine()
    } catch (error) {
      logger.error('Error updating routine exercise', error as Error, 'RoutineDetailPage')
      toast.error(t('failedToUpdate') || 'Failed to update exercise')
    } finally {
      setIsUpdatingExercise(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !routine || !routine.exercises) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Find indices
    const oldIndex = routine.exercises.findIndex(ex => ex.id === activeId)
    const newIndex = routine.exercises.findIndex(ex => ex.id === overId)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder in state (optimistic update)
    const sortedExercises = [...routine.exercises].sort((a, b) => a.order - b.order)
    const newExercises = arrayMove(sortedExercises, oldIndex, newIndex)

    // Update order values
    const updates = newExercises.map((exercise, index) => ({
      id: exercise.id,
      order: index + 1,
    }))

    // Update UI immediately
    setRoutine({
      ...routine,
      exercises: newExercises.map((ex, idx) => ({ ...ex, order: idx + 1 })),
    })

    // Save to database
    setIsReordering(true)
    const result = await routineRepository.updateExercisesOrder(updates)

    if (result.error) {
      toast.error('Failed to reorder exercises')
      // Revert on error
      loadRoutine()
    } else {
      toast.success(t('exercisesReordered') || 'Exercises reordered')
    }
    setIsReordering(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Routine not found</p>
        <Button onClick={() => router.push(ROUTES.ROUTINES)} className="mt-4">
          {t('backToRoutines') || 'Back to Routines'}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header - Simple & Elegant */}
      <div className="flex items-center justify-between px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(ROUTES.ROUTINES)}
          className="rounded-full bg-accent/10 h-9 w-9 hover:bg-accent/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground/80 italic">{t('routineDetail')}</h1>
        <div className="flex items-center gap-2">
           <Button 
            variant="ghost" 
            size="icon"
            onClick={handleShare}
            className="rounded-full bg-accent/10 h-9 w-9 hover:bg-accent/20 transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {routine.user_id === user?.id && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDelete}
              className="rounded-full bg-destructive/10 h-9 w-9 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Routine Info - Take 5 columns */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-[2rem] border-none shadow-sm bg-accent/5 overflow-hidden transition-all duration-300">
            <CardHeader className="pb-0 pt-6 px-6">
              <div className="flex items-center justify-between mb-4">
                 <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary/60" />
                  {t('routineInformation')}
                </CardTitle>
                <div className="flex gap-1">
                  {!isEditingRoutine ? (
                    <>
                      {routine.user_id === user?.id && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsEditingRoutine(true)}
                          className="h-8 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-accent/10"
                        >
                          <Edit className="h-3 w-3 mr-1.5" />
                          {tCommon('edit')}
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleDuplicate}
                        disabled={isDuplicating}
                        className={cn(
                          "h-8 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-accent/10",
                          // Highlight duplicate button if viewing someone else's routine
                          routine.user_id !== user?.id && "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                        )}
                      >
                        <Copy className="h-3 w-3 mr-1.5" />
                        {isDuplicating ? t('duplicating') : t('duplicate')}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setIsEditingRoutine(false)
                        setEditName(routine.name)
                        setEditDescription(routine.description || '')
                        setEditScheduledDays(routine.scheduled_days || [])
                        setEditIsPublic(routine.is_public || false)
                      }}
                      className="h-8 rounded-full text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10"
                    >
                      {tCommon('cancel')}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2 p-6">
              {isEditingRoutine ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5 px-0.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      {t('routineName')}
                    </Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 bg-background/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5 px-0.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      {t('routineDescription')}
                    </Label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full min-h-[80px] bg-background/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 font-medium p-3 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground/90 leading-tight">
                    {routine.name}
                  </h2>
                  {routine.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2 italic font-medium">
                      "{routine.description}"
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="bg-background/40 rounded-2xl p-4 border border-accent/5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{tCommon('status')}</p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleToggleActive}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-bold transition-colors",
                        routine.is_active ? "text-emerald-500" : "text-amber-500"
                      )}
                    >
                      {routine.is_active ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> {tCommon('active')}</>
                      ) : (
                        <><Clock className="h-3.5 w-3.5" /> {t('inactive') || 'Inactive'}</>
                      )}
                    </button>
                  </div>
                  {/* Public Badge */}
                  {routine.is_public && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase tracking-widest mt-1">
                      <Globe className="h-3 w-3" />
                      {t('public') || 'Public'}
                    </div>
                  )}
                </div>
                {/* Only show public status if not editing, or read-only info if viewing others */}
                {routine.user_id !== user?.id && (
                  <div className="bg-background/40 rounded-2xl p-4 border border-accent/5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{t('author') || 'Author'}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        ?
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{t('viewOnlyMode') || 'View Only Mode'}</span>
                    </div>
                  </div>
                )}
                  {isEditingRoutine && (
                    <div className="pt-2 px-0.5 flex items-center justify-between bg-accent/5 p-3 rounded-xl border border-accent/5">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                          {editIsPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {t('publicAccess') || 'Public Access'}
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          {editIsPublic 
                            ? (t('publicAccessDescription') || 'Anyone with the link can view this routine') 
                            : (t('privateAccessDescription') || 'Only you can view this routine')}
                        </p>
                      </div>
                      <Switch
                        checked={editIsPublic}
                        onCheckedChange={setEditIsPublic}
                      />
                    </div>
                  )}
                </div>

              <div className="space-y-3 pt-2">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 px-0.5 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {t('scheduledDays')}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK_OPTIONS.map((day) => {
                    const isSelectedStatic = routine.scheduled_days?.includes(day.value as any)
                    const isSelectedEdit = editScheduledDays.includes(day.value as any)
                    
                    if (isEditingRoutine) {
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            if (isSelectedEdit) {
                              setEditScheduledDays(editScheduledDays.filter(d => d !== day.value))
                            } else {
                              setEditScheduledDays([...editScheduledDays, day.value as any])
                            }
                          }}
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                            isSelectedEdit 
                              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                              : "bg-background/20 border-accent/5 text-muted-foreground/30 hover:bg-background/40"
                          )}
                        >
                          {day.label.substring(0, 1).toUpperCase()}
                        </button>
                      )
                    }

                    return (
                      <div
                        key={day.value}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                          isSelectedStatic 
                            ? "bg-primary/10 border-primary/20 text-primary shadow-sm" 
                            : "bg-background/20 border-accent/5 text-muted-foreground/30"
                        )}
                      >
                        {day.label.substring(0, 1).toUpperCase()}
                      </div>
                    )
                  })}
                </div>
              </div>

              {isEditingRoutine && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Button
                    onClick={handleUpdateRoutine}
                    disabled={isUpdatingRoutine}
                    className="w-full h-11 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isUpdatingRoutine ? tCommon('saving') : tCommon('saveChanges')}
                  </Button>
                </div>
              )}

              {/* Start Workout Card - Premium style */}
              {!isEditingRoutine && routine.exercises && routine.exercises.length > 0 && (
                <div className="pt-4">
                  <Button 
                    onClick={() => router.push(ROUTES.WORKOUT_FROM_ROUTINE(routineId))} 
                    size="lg"
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.15em] text-xs bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                  >
                    <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    {t('startWorkout')}
                  </Button>
                </div>
              )}
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
                  {tCommon('exercises')} ({routine.exercises?.length || 0})
                </CardTitle>
                <div className="flex gap-2">
                  {routine.user_id === user?.id && (
                    <Button 
                      onClick={() => setAddExerciseDialogOpen(true)}
                      size="sm"
                      className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      {t('addExercise')}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 p-6">
              {!routine.exercises || routine.exercises.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
                  <Dumbbell className="h-12 w-12 mb-4 stroke-[1px]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('noExercisesYet')}</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={routine.exercises
                      .sort((a, b) => a.order - b.order)
                      .map(ex => ex.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {routine.exercises
                        .sort((a, b) => a.order - b.order)
                        .map((routineExercise, index) => (
                          <SortableExerciseItem
                            key={routineExercise.id}
                            routineExercise={routineExercise}
                            index={index}
                            onRemove={routine.user_id === user?.id ? handleRemoveExercise : undefined}
                            onEdit={routine.user_id === user?.id ? handleEditClick : undefined}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="rounded-t-[2.5rem] sm:rounded-3xl p-0 border-none bg-background shadow-2xl max-w-md">
          <DialogHeader className="pt-8 px-8">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
              {t('shareRoutine')}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground pt-1">
              {t('shareRoutineDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4">
            <div className="flex gap-2 bg-accent/5 p-2 rounded-2xl border border-accent/5">
              <Input value={shareLink} readOnly className="flex-1 bg-transparent border-none focus-visible:ring-0 font-medium text-xs text-muted-foreground/60 h-10 px-2" />
              <Button
                variant="default"
                size="sm"
                className="rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest bg-primary text-white"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareLink)
                    toast.success(tCommon('linkCopied') || 'Link copied!')
                  }
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-2" />
                {tCommon('copy') || 'Copy'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Exercise Drawer */}
      <Drawer open={editExerciseDialogOpen} onOpenChange={setEditExerciseDialogOpen}>
        <DrawerContent className="max-w-md mx-auto rounded-t-[2.5rem] border-none bg-background/95 backdrop-blur-xl shadow-2xl">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted/20" />
          <DrawerHeader className="px-8 pt-6 pb-2">
            <DrawerTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold tracking-[0.2em] text-primary/60 mb-0.5">{tCommon('edit')}</span>
                <span className="truncate max-w-[250px]">{editingExercise?.exercise.name}</span>
              </div>
            </DrawerTitle>
            <DrawerDescription className="text-xs font-medium italic opacity-60 text-left pl-14">
              {t('modifyExerciseDetails') || 'Modify exercise targets and rest time'}
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleUpdateExercise} className="px-8 py-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t('targetSets')}
                </Label>
                <Input
                  type="number"
                  value={editingExercise?.target_sets || ''}
                  onChange={(e) => setEditingExercise(prev => prev ? { ...prev, target_sets: parseInt(e.target.value) || 0 } : null)}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="1"
                />
              </div>
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {tCommon('kg')} {t('optional')}
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  value={editingExercise?.target_weight ?? ''}
                  onChange={(e) => setEditingExercise(prev => prev ? { ...prev, target_weight: parseFloat(e.target.value) || 0 } : null)}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="0"
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
                  value={editingExercise?.target_reps || ''}
                  onChange={(e) => setEditingExercise(prev => prev ? { ...prev, target_reps: parseInt(e.target.value) || 0 } : null)}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="1"
                />
              </div>
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t('maxReps') || 'Max Reps'}
                </Label>
                <Input
                  type="number"
                  value={editingExercise?.target_reps_max ?? ''}
                  onChange={(e) => setEditingExercise(prev => prev ? { ...prev, target_reps_max: parseInt(e.target.value) || undefined } : null)}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="1"
                  placeholder="Opt"
                />
              </div>
            </div>

            <div className="space-y-1.5 px-0.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {t('restTime')} (s)
              </Label>
              <Input
                type="number"
                value={editingExercise?.target_rest_time ?? ''}
                onChange={(e) => setEditingExercise(prev => prev ? { ...prev, target_rest_time: parseInt(e.target.value) || undefined } : null)}
                className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                min="0"
                placeholder="90"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                >
                  {tCommon('cancel')}
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                disabled={isUpdatingExercise}
                className="h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isUpdatingExercise ? tCommon('saving') : tCommon('saveChanges')}
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Add Exercise Drawer */}
      <Drawer open={addExerciseDialogOpen} onOpenChange={setAddExerciseDialogOpen}>
        <DrawerContent className="max-w-md mx-auto rounded-t-[2.5rem] border-none bg-background/95 backdrop-blur-xl shadow-2xl">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted/20" />
          <DrawerHeader className="px-8 pt-6 pb-2">
            <DrawerTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold tracking-[0.2em] text-primary/60 mb-0.5">{t('addExercise')}</span>
                <span className="truncate max-w-[250px]">{routine?.name || 'Routine'}</span>
              </div>
            </DrawerTitle>
             <DrawerDescription className="text-xs font-medium italic opacity-60 text-left pl-14">
              {t('selectAndConfigure') || 'Select an exercise and configure targets'}
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleAddExercise} className="px-8 py-6 space-y-6">
            <div className="space-y-1.5 px-0.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {tCommon('exercises')}
              </Label>
              <ExerciseSelect
                value={newExerciseData.exercise_id}
                onChange={(val) => setNewExerciseData({ ...newExerciseData, exercise_id: val })}
                onCreateExercise={() => router.push(`${ROUTES.NEW_EXERCISE}?returnTo=${encodeURIComponent(ROUTES.ROUTINE_DETAIL(routineId))}`)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t('targetSets')}
                </Label>
                <Input
                  type="number"
                  value={newExerciseData.target_sets}
                  onChange={(e) => setNewExerciseData({ ...newExerciseData, target_sets: parseInt(e.target.value) || 1 })}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="1"
                />
              </div>
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {tCommon('kg')}
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  value={newExerciseData.target_weight ?? ''}
                  onChange={(e) => setNewExerciseData({ ...newExerciseData, target_weight: parseFloat(e.target.value) || undefined })}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t('reps')}
                </Label>
                <Input
                  type="number"
                  value={newExerciseData.target_reps}
                  onChange={(e) => setNewExerciseData({ ...newExerciseData, target_reps: parseInt(e.target.value) || 1 })}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  min="1"
                />
              </div>
              <div className="space-y-1.5 px-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t('restTime')} (s)
                </Label>
                <Input
                  type="number"
                  value={newExerciseData.target_rest_time ?? ''}
                  onChange={(e) => setNewExerciseData({ ...newExerciseData, target_rest_time: parseInt(e.target.value) || undefined })}
                  className="h-12 bg-accent/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-center text-lg tabular-nums"
                  placeholder="60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                >
                  {tCommon('cancel')}
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                disabled={isAddingExercise || !newExerciseData.exercise_id}
                className="h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isAddingExercise ? t('adding') : t('addExercise')}
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

