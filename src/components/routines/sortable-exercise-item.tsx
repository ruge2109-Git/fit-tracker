/**
 * Sortable Exercise Item Component
 * Draggable exercise card for routine exercises
 */

'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RoutineExercise } from '@/types'
import { useTranslations } from 'next-intl'
import { getExerciseTypeOptions, getMuscleGroupOptions } from '@/lib/constants'

interface SortableExerciseItemProps {
  routineExercise: RoutineExercise
  index: number
  onRemove: (id: string) => void
}

export function SortableExerciseItem({
  routineExercise,
  index,
  onRemove,
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
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? 'ring-2 ring-primary' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Drag Handle */}
              <button
                {...attributes}
                {...listeners}
                className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-manipulation -ml-1 p-1"
                aria-label={t('dragToReorder')}
                style={{ touchAction: 'none' }}
              >
                <GripVertical className="h-5 w-5" />
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                  <CardTitle className="text-lg">
                    {routineExercise.exercise.name}
                  </CardTitle>
                </div>
                <CardDescription className="mt-1">
                  {getTypeLabel(routineExercise.exercise.type)} • {getMuscleLabel(routineExercise.exercise.muscle_group)}
                </CardDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(routineExercise.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">{tRoutines('targetSets')}: </span>
              <span className="font-medium">{routineExercise.target_sets}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{tRoutines('targetReps')}: </span>
              <span className="font-medium">{routineExercise.target_reps}</span>
            </div>
            {routineExercise.target_weight && (
              <div>
                <span className="text-muted-foreground">{tRoutines('targetWeight')}: </span>
                <span className="font-medium">{routineExercise.target_weight} {t('kg')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

