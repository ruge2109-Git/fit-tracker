/**
 * GoalForm Component
 * Form for creating/editing goals
 * Using React Hook Form + Zod for validation
 */

'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GoalFormData, GoalType } from '@/types'
import { useTranslations } from 'next-intl'

interface GoalFormProps {
  onSubmit: (data: GoalFormData) => void
  defaultValues?: Partial<GoalFormData>
  isLoading?: boolean
}

const goalSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  type: z.nativeEnum(GoalType),
  target_value: z.number().positive('Target value must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  start_date: z.string().min(1, 'Start date is required'),
  target_date: z.string().optional(),
})

export function GoalForm({ onSubmit, defaultValues, isLoading }: GoalFormProps) {
  const t = useTranslations('goals')
  const tCommon = useTranslations('common')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      type: defaultValues?.type || GoalType.CUSTOM,
      target_value: defaultValues?.target_value || 0,
      unit: defaultValues?.unit || '',
      start_date: defaultValues?.start_date || new Date().toISOString().split('T')[0],
      target_date: defaultValues?.target_date || undefined,
    },
  })

  // Normalize form data before submission: convert empty strings to undefined
  const normalizeFormData = (data: GoalFormData): GoalFormData => {
    return {
      ...data,
      description: data.description?.trim() || undefined,
      target_date: data.target_date?.trim() || undefined,
    }
  }

  const goalTypeOptions = [
    { value: GoalType.WEIGHT, label: t('types.weight') },
    { value: GoalType.VOLUME, label: t('types.volume') },
    { value: GoalType.FREQUENCY, label: t('types.frequency') },
    { value: GoalType.STRENGTH, label: t('types.strength') },
    { value: GoalType.ENDURANCE, label: t('types.endurance') },
    { value: GoalType.CUSTOM, label: t('types.custom') },
  ]

  const getDefaultUnit = (type: GoalType) => {
    const unitMap: Record<GoalType, string> = {
      [GoalType.WEIGHT]: 'kg',
      [GoalType.VOLUME]: 'kg',
      [GoalType.FREQUENCY]: 'times',
      [GoalType.STRENGTH]: 'kg',
      [GoalType.ENDURANCE]: 'minutes',
      [GoalType.CUSTOM]: '',
    }
    return unitMap[type] || ''
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(normalizeFormData(data)))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t('goalTitle')} *</Label>
        <Input
          id="title"
          placeholder={t('titlePlaceholder')}
          {...register('title')}
          disabled={isLoading}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('goalDescription')} ({tCommon('optional')})</Label>
        <Textarea
          id="description"
          placeholder={t('descriptionPlaceholder')}
          {...register('description')}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">{t('goalType')} *</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  // Auto-set unit based on type
                  const defaultUnit = getDefaultUnit(value as GoalType)
                  if (!defaultValues?.unit || defaultValues.unit === '') {
                    // This would need to be handled differently, but for now we'll let user set it
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {goalTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">{t('goalUnit')} *</Label>
          <Input
            id="unit"
            placeholder={t('unitPlaceholder')}
            {...register('unit')}
            disabled={isLoading}
          />
          {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="target_value">{t('targetValue')} *</Label>
          <Input
            id="target_value"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            {...register('target_value', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.target_value && (
            <p className="text-sm text-destructive">{errors.target_value.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">{t('startDate')} *</Label>
          <Input
            id="start_date"
            type="date"
            {...register('start_date')}
            disabled={isLoading}
          />
          {errors.start_date && (
            <p className="text-sm text-destructive">{errors.start_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_date">{t('targetDate')} ({tCommon('optional')})</Label>
        <Input
          id="target_date"
          type="date"
          {...register('target_date')}
          disabled={isLoading}
        />
        {errors.target_date && (
          <p className="text-sm text-destructive">{errors.target_date.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? tCommon('saving') : tCommon('save')}
        </Button>
      </div>
    </form>
  )
}

