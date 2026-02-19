/**
 * Sortable Exercise Item Component
 * Draggable exercise card for routine exercises
 */

'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, GripVertical, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RoutineExercise } from '@/types'
import { useTranslations } from 'next-intl'
import { getExerciseTypeOptions, getMuscleGroupOptions } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SortableExerciseItemProps {
  routineExercise: RoutineExercise
  index: number
  onRemove?: (id: string) => void
  onEdit?: (exercise: RoutineExercise) => void
}

export function SortableExerciseItem({
  routineExercise,
  index,
  onRemove,
  onEdit,
}: SortableExerciseItemProps) {
  const t = useTranslations('common')
  const tRoutines = useTranslations('routines')
  const tExerciseTypes = useTranslations('exerciseTypes')
  const tMuscleGroups = useTranslations('muscleGroups')
  
  const exerciseTypeOptions = getExerciseTypeOptions(tExerciseTypes)
  const muscleGroupOptions = getMuscleGroupOptions(tMuscleGroups)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: routineExercise.id })
  
  const getTypeLabel = (type: string) => {
    return exerciseTypeOptions.find((option) => option.value === type)?.label ?? type
  }
  
  const getMuscleLabel = (muscle: string) => {
    return muscleGroupOptions.find((option) => option.value === muscle)?.label ?? muscle
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group relative animate-in fade-in slide-in-from-right-4 duration-300",
        isDragging && "z-50"
      )}
    >
      <Card className={cn(
        "rounded-2xl border-none bg-background/50 backdrop-blur-sm shadow-sm transition-all duration-300",
        isDragging ? "ring-2 ring-primary shadow-xl scale-[1.02]" : "hover:shadow-md hover:bg-background/80",
      )}>
        <div className="p-4 flex items-center gap-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary transition-colors touch-manipulation p-1"
            aria-label={t('dragToReorder')}
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black italic tracking-tighter text-primary/40 tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-bold text-sm break-words uppercase tracking-tight text-foreground/90 leading-tight">
                {routineExercise.exercise.name}
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {routineExercise.target_sets}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('sets')}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">
                  {routineExercise.target_reps}
                  {routineExercise.target_reps_max ? `-${routineExercise.target_reps_max}` : ''}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('reps')}</span>
              </div>

              {routineExercise.target_weight && routineExercise.target_weight > 0 && (
                <div className="flex items-center gap-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">
                    {routineExercise.target_weight}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('kg')}</span>
                </div>
              )}

              {routineExercise.target_rest_time && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/5 border border-orange-500/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500/80">
                    ⏱️ {routineExercise.target_rest_time}s
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(routineExercise)}
                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(routineExercise.id)}
                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

