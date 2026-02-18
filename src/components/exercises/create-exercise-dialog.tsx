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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
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
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

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
  const isMobile = useIsMobile()

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

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 pb-6 md:px-0 md:pb-0">
      <div className="space-y-2">
        <Label htmlFor="new-exercise-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
          {t('exerciseName') || 'Exercise Name'}
        </Label>
        <Input 
          id="new-exercise-name" 
          {...register('name')} 
          placeholder="e.g. Incline Bench Press" 
          className="rounded-2xl border-accent/10 bg-accent/5 h-11 focus-visible:ring-primary/20 transition-all font-medium"
        />
        {errors.name && <p className="text-[10px] text-destructive font-bold px-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {t('type') || 'Type'}
          </Label>
          <Select
            value={selectedType}
            onValueChange={(value) => setValue('type', value as ExerciseType)}
          >
            <SelectTrigger className="rounded-2xl border-accent/10 bg-accent/5 h-11 font-medium italic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-accent/10">
              {exerciseTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs font-medium">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {t('muscleGroup') || 'Muscle'}
          </Label>
          <Select
            value={selectedMuscleGroup}
            onValueChange={(value) => setValue('muscle_group', value as MuscleGroup)}
          >
            <SelectTrigger className="rounded-2xl border-accent/10 bg-accent/5 h-11 font-medium italic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-accent/10">
              {muscleGroupOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs font-medium">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-exercise-description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
          {tCommon('description') || 'Description'}
        </Label>
        <Textarea
          id="new-exercise-description"
          {...register('description')}
          placeholder={t('descriptionPlaceholder') || 'How to perform this exercise...'}
          className="rounded-2xl border-accent/10 bg-accent/5 resize-none min-h-[100px] focus-visible:ring-primary/20 transition-all font-medium text-sm"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        {!isMobile && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isSubmitting}
            className="flex-1 rounded-2xl h-12 font-bold text-xs uppercase tracking-widest"
          >
            {tCommon('cancel') || 'Cancel'}
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-[2] rounded-2xl h-12 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          {isSubmitting ? tCommon('saving') || 'Saving...' : tCommon('save') || 'Save'}
        </Button>
      </div>
    </form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="rounded-t-[2.5rem] p-0 border-none bg-background shadow-2xl">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-accent/20" />
          <DrawerHeader className="pt-6 px-6">
            <DrawerTitle className="text-xl font-black uppercase italic tracking-tighter text-center">
              {t('newExercise')}
            </DrawerTitle>
            <p className="sr-only">Form to create a new exercise</p>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[85vh]">
            {FormContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-8 bg-background">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
            {t('newExercise')}
          </DialogTitle>
          <p className="sr-only">Fill in the details to add a new exercise to your library</p>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  )
}
