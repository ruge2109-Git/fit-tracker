/**
 * Workout Detail Page — Premium redesign
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import {
  Calendar, Clock, ArrowLeft, Trash2, Edit, Copy,
  Download, Dumbbell, Flame, BarChart2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkoutStore } from '@/store/workout.store'
import { useAuthStore } from '@/store/auth.store'
import { formatDate, formatDuration, formatWeight } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { exportWorkoutToPDF } from '@/lib/pdf-export'
import { useLocale } from 'next-intl'
import { QuickNotes } from '@/components/workouts/quick-notes'
import { workoutService } from '@/domain/services/workout.service'
import { WorkoutTags } from '@/components/workouts/workout-tags'
import { InlineEdit } from '@/components/ui/inline-edit'
import { logger } from '@/lib/logger'
import { WorkoutShareCardButton } from '@/components/workouts/workout-share-card'
import { cn } from '@/lib/utils'

export default function WorkoutDetailPage() {
  const params = useParams()
  const router = useNavigationRouter()
  const { currentWorkout, loadWorkout, deleteWorkout, createWorkout, updateWorkout, isLoading } = useWorkoutStore()
  const { user } = useAuthStore()
  const t = useTranslations('workouts')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [workoutTagIds, setWorkoutTagIds] = useState<string[]>([])
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())
  const workoutId = params.id as string

  useEffect(() => {
    if (workoutId) {
      loadWorkout(workoutId).catch((error) => {
        logger.error('Error loading workout', error as Error, 'WorkoutDetailPage')
      })
    }
  }, [workoutId, loadWorkout])

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete') || 'Are you sure?')) return
    const success = await deleteWorkout(workoutId)
    if (success) {
      toast.success(t('workoutDeleted'))
      router.push(ROUTES.WORKOUTS)
    } else {
      toast.error(t('failedToDelete'))
    }
  }

  const handleDuplicate = async () => {
    if (!currentWorkout || !user) return
    setIsDuplicating(true)
    try {
      const newWorkoutId = await createWorkout(
        user.id,
        {
          date: new Date().toISOString().split('T')[0],
          duration: currentWorkout.duration,
          notes: currentWorkout.notes ? `${t('copyOf')}: ${currentWorkout.notes}` : t('duplicatedWorkout'),
          routine_id: currentWorkout.routine_id,
        },
        currentWorkout.sets.map(set => ({
          exercise_id: set.exercise_id,
          reps: set.reps,
          weight: set.weight,
          rest_time: set.rest_time,
        }))
      )
      if (newWorkoutId) {
        toast.success(t('workoutDuplicated'))
        router.push(ROUTES.WORKOUT_DETAIL(newWorkoutId))
      }
    } catch {
      toast.error(t('failedToDuplicate'))
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleExportPDF = () => {
    if (!currentWorkout) return
    try {
      exportWorkoutToPDF(currentWorkout, locale)
      toast.success(t('workoutExported'))
    } catch {
      toast.error(t('failedToExport'))
    }
  }

  const toggleExercise = (name: string) => {
    setExpandedExercises(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  if (isLoading && !currentWorkout) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isLoading && !currentWorkout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">{t('failedToLoadWorkout')}</p>
        <Button onClick={() => loadWorkout(workoutId)}>{tCommon('retry')}</Button>
      </div>
    )
  }

  if (!currentWorkout) return null

  // ── derived stats ──────────────────────────────────────────────────────────
  const exerciseGroups = currentWorkout.sets.reduce((acc, set) => {
    const name = set.exercise.name
    if (!acc[name]) acc[name] = []
    acc[name].push(set)
    return acc
  }, {} as Record<string, typeof currentWorkout.sets>)

  const totalVolume = currentWorkout.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
  const totalSets   = currentWorkout.sets.length
  const uniqueEx    = Object.keys(exerciseGroups).length
  const routineName = (currentWorkout as any).routine?.name ?? currentWorkout.routine_name

  const statCards = [
    { icon: <Flame className="h-4 w-4" />, label: 'Volumen', value: `${Math.round(totalVolume).toLocaleString()} kg`, color: 'text-orange-400' },
    { icon: <BarChart2 className="h-4 w-4" />, label: 'Series', value: String(totalSets), color: 'text-blue-400' },
    { icon: <Dumbbell className="h-4 w-4" />, label: 'Ejercicios', value: String(uniqueEx), color: 'text-violet-400' },
    { icon: <Clock className="h-4 w-4" />, label: 'Duración', value: formatDuration(currentWorkout.duration), color: 'text-emerald-400' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-0 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full px-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back')}
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <WorkoutShareCardButton workout={currentWorkout} routineName={routineName} />
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="rounded-xl">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('exportPDF')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isDuplicating} className="rounded-xl">
            <Copy className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{isDuplicating ? t('duplicating') : t('duplicate')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.WORKOUT_EDIT(workoutId))} className="rounded-xl">
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{tCommon('edit')}</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="rounded-xl">
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{tCommon('delete')}</span>
          </Button>
        </div>
      </div>

      {/* ── Hero header ── */}
      <div className="rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-border/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              {routineName ? 'Rutina' : 'Entrenamiento Libre'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground truncate">
              {routineName ?? 'Free Workout'}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <InlineEdit
                  value={currentWorkout.date}
                  onSave={async (v) => {
                    const ok = await updateWorkout(workoutId, { date: v })
                    if (ok) { await loadWorkout(workoutId); toast.success(t('workoutUpdated')) }
                    else toast.error(t('failedToUpdate'))
                  }}
                  type="date"
                  className="min-w-[130px]"
                  placeholder={tCommon('date')}
                />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <InlineEdit
                  value={currentWorkout.duration.toString()}
                  onSave={async (v) => {
                    const n = parseInt(v)
                    if (isNaN(n) || n < 1) throw new Error(t('invalidDuration'))
                    const ok = await updateWorkout(workoutId, { duration: n })
                    if (ok) { await loadWorkout(workoutId); toast.success(t('workoutUpdated')) }
                    else toast.error(t('failedToUpdate'))
                  }}
                  type="number" min={1}
                  validate={(v) => { const n = parseInt(v); return (isNaN(n) || n < 1) ? t('durationMustBePositive') : true }}
                  formatDisplay={(v) => formatDuration(parseInt(v))}
                  className="min-w-[80px]"
                  placeholder={tCommon('duration')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {statCards.map(({ icon, label, value, color }) => (
            <div key={label} className="rounded-2xl bg-background/60 border border-border/20 p-4 text-center backdrop-blur-sm">
              <div className={cn('flex justify-center mb-1', color)}>{icon}</div>
              <p className="text-lg font-black">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: meta ─────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Notes */}
          <div className="rounded-[1.5rem] border border-border/20 bg-accent/5 p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tCommon('notes')}</p>
            <QuickNotes
              notes={currentWorkout.notes}
              onSave={async (notes) => {
                const ok = await updateWorkout(workoutId, { notes })
                if (ok) { await loadWorkout(workoutId); toast.success(t('notesUpdated')) }
                else toast.error(t('failedToUpdateNotes'))
              }}
            />
          </div>

          {/* Tags */}
          <div className="rounded-[1.5rem] border border-border/20 bg-accent/5 p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('tags')}</p>
            <WorkoutTags
              workoutId={workoutId}
              selectedTagIds={workoutTagIds}
              onTagsChange={setWorkoutTagIds}
            />
          </div>
        </div>

        {/* Right: exercises ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            {tCommon('exercises')} · {uniqueEx}
          </p>

          {Object.entries(exerciseGroups).map(([exerciseName, sets], idx) => {
            const isExpanded = expandedExercises.has(exerciseName)
            const exVolume   = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
            const maxWeight  = Math.max(...sets.map(s => s.weight))
            const muscle     = sets[0]?.exercise?.muscle_group

            return (
              <div
                key={exerciseName}
                className="rounded-[1.5rem] border border-border/20 bg-accent/5 overflow-hidden"
              >
                {/* Exercise header — always visible, click to expand */}
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-accent/10 transition-colors"
                  onClick={() => toggleExercise(exerciseName)}
                >
                  {/* Number badge */}
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-black text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{exerciseName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {muscle && (
                        <Badge variant="secondary" className="text-[9px] px-2 py-0 h-4 rounded-full capitalize font-bold">
                          {muscle}
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {sets.length} series · {Math.round(exVolume).toLocaleString()} kg vol
                        {maxWeight > 0 && ` · máx ${maxWeight} kg`}
                      </span>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  }
                </button>

                {/* Expanded: sets table */}
                {isExpanded && (
                  <div className="border-t border-border/10 px-5 py-3 space-y-2">
                    {/* Column headers */}
                    <div className="grid grid-cols-4 gap-2 px-2">
                      {['Serie', 'Reps', 'Peso kg', 'Volumen'].map(h => (
                        <p key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 text-center">{h}</p>
                      ))}
                    </div>
                    {sets.map((set, si) => {
                      const vol = set.weight * set.reps
                      return (
                        <div
                          key={set.id}
                          className="grid grid-cols-4 gap-2 bg-background/40 rounded-xl px-2 py-2.5 border border-border/10"
                        >
                          <p className="text-xs font-black text-center text-muted-foreground">{si + 1}</p>
                          <p className="text-xs font-black text-center">{set.reps}</p>
                          <p className="text-xs font-black text-center text-primary">{set.weight > 0 ? `${set.weight}` : '—'}</p>
                          <p className="text-xs font-bold text-center text-muted-foreground">{vol > 0 ? `${Math.round(vol)}` : '—'}</p>
                        </div>
                      )
                    })}
                    {/* Exercise total */}
                    <div className="flex justify-between items-center px-2 pt-1">
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Volumen total</span>
                      <span className="text-sm font-black text-primary">{Math.round(exVolume).toLocaleString()} kg</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Expand all hint when collapsed */}
          {expandedExercises.size === 0 && uniqueEx > 0 && (
            <p className="text-center text-xs text-muted-foreground/50 pt-2">
              Toca un ejercicio para ver las series
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
