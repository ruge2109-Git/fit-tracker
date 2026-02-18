/**
 * CreateExerciseDialog Component
 * Modal to create a new exercise in-place
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ExerciseType, MuscleGroup } from '@/types'
import { getExerciseTypeOptions, getMuscleGroupOptions } from '@/lib/constants'
import { exerciseRepository } from '@/domain/repositories/exercise.repository'
import { useExerciseStore } from '@/store/exercise.store'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { logger } from '@/lib/logger'

const exerciseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.nativeEnum(ExerciseType),
  muscle_group: z.nativeEnum(MuscleGroup),
  description: z.string().optional(),
})

type ExerciseFormData = z.infer<typeof exerciseSchema>

interface CreateExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (exerciseId: string) => void
}

export function CreateExerciseDialog({ open, onOpenChange, onSuccess }: CreateExerciseDialogProps) {
  const t = useTranslations('exercises')
  const tCommon = useTranslations('common')
  const tMuscleGroups = useTranslations('muscleGroups')
  const { loadExercises } = useExerciseStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const exerciseTypeOptions = getExerciseTypeOptions(t)
  const muscleGroupOptions = getMuscleGroupOptions(tMuscleGroups)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      type: ExerciseType.STRENGTH,
      muscle_group: MuscleGroup.FULL_BODY,
    },
  })

  const selectedType = watch('type')
  const selectedMuscleGroup = watch('muscle_group')

  const onSubmit = async (data: ExerciseFormData) => {
    setIsSubmitting(true)
    try {
      const result = await exerciseRepository.create(data)

      if (result.error) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to create exercise')
      }

      if (result.data) {
        toast.success(t('exerciseCreated') || 'Exercise created successfully')
        await loadExercises()
        
        await logAuditEvent({
          action: 'create_exercise',
          entityType: 'exercise',
          entityId: result.data.id,
          details: { name: data.name },
        })

        reset()
        onOpenChange(false)
        if (onSuccess) onSuccess(result.data.id)
      }
    } catch (error) {
      logger.error('Error creating exercise:', error as Error)
      toast.error(t('failedToCreateExercise') || 'Failed to create exercise')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('createNewExercise') || 'Create New Exercise'}</DialogTitle>
          <DialogDescription>
            {t('createExerciseDescription') || 'Add a new exercise to the database'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="new-exercise-name">{t('exerciseName') || 'Exercise Name'}</Label>
            <Input id="new-exercise-name" {...register('name')} placeholder="e.g. Incline Bench Press" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('type') || 'Type'}</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue('type', value as ExerciseType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exerciseTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('muscleGroup') || 'Muscle Group'}</Label>
              <Select
                value={selectedMuscleGroup}
                onValueChange={(value) => setValue('muscle_group', value as MuscleGroup)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroupOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-exercise-description">{tCommon('description') || 'Description'}</Label>
            <Textarea
              id="new-exercise-description"
              {...register('description')}
              placeholder={t('descriptionPlaceholder') || 'How to perform this exercise...'}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {tCommon('cancel') || 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon('saving') || 'Saving...' : tCommon('save') || 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
