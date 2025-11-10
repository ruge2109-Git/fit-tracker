/**
 * WorkoutForm Component
 * Form for creating/editing workouts
 * Using React Hook Form + Zod for validation
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkoutFormData } from '@/types'
import { useTranslations } from 'next-intl'

interface WorkoutFormProps {
  onSubmit: (data: WorkoutFormData) => void
  defaultValues?: Partial<WorkoutFormData>
  isLoading?: boolean
}

export function WorkoutForm({ onSubmit, defaultValues, isLoading }: WorkoutFormProps) {
  const t = useTranslations('workouts')
  
  const workoutSchema = z.object({
    date: z.string().min(1, t('dateRequired')),
    duration: z.coerce.number().min(1, t('durationRequired')),
    notes: z.string().optional(),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: defaultValues || {
      date: new Date().toISOString().split('T')[0],
      duration: 60,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">{t('date')}</Label>
        <Input
          id="date"
          type="date"
          {...register('date')}
          disabled={isLoading}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">{t('durationMinutes')}</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          {...register('duration')}
          disabled={isLoading}
        />
        {errors.duration && (
          <p className="text-sm text-destructive">{errors.duration.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('notesOptional')}</Label>
        <Input
          id="notes"
          {...register('notes')}
          placeholder={t('howFeel')}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? t('saving') : t('saveWorkout')}
      </Button>
    </form>
  )
}

