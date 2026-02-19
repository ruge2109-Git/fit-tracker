/**
 * MeasurementForm Component
 * Form for creating/editing body measurements
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
import { BodyMeasurementFormData, MeasurementType } from '@/types'
import { useTranslations } from 'next-intl'

interface MeasurementFormProps {
  onSubmit: (data: BodyMeasurementFormData) => void
  defaultValues?: Partial<BodyMeasurementFormData>
  isLoading?: boolean
}

const measurementSchema = z.object({
  measurement_type: z.nativeEnum(MeasurementType),
  value: z.number().positive('Value must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional(),
  measurement_date: z.string().min(1, 'Date is required'),
})

export function MeasurementForm({ onSubmit, defaultValues, isLoading }: MeasurementFormProps) {
  const t = useTranslations('bodyMeasurements')
  const tCommon = useTranslations('common')

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<BodyMeasurementFormData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      measurement_type: defaultValues?.measurement_type || MeasurementType.WEIGHT,
      value: defaultValues?.value || 0,
      unit: defaultValues?.unit || 'kg',
      notes: defaultValues?.notes || '',
      measurement_date: defaultValues?.measurement_date || new Date().toISOString().split('T')[0],
    },
  })

  const selectedType = watch('measurement_type')

  // Normalize form data before submission
  const normalizeFormData = (data: BodyMeasurementFormData): BodyMeasurementFormData => {
    return {
      ...data,
      notes: data.notes?.trim() || undefined,
    }
  }

  const measurementTypeOptions = [
    { value: MeasurementType.WEIGHT, label: t('types.weight') },
    { value: MeasurementType.BODY_FAT, label: t('types.bodyFat') },
    { value: MeasurementType.CHEST, label: t('types.chest') },
    { value: MeasurementType.WAIST, label: t('types.waist') },
    { value: MeasurementType.HIPS, label: t('types.hips') },
    { value: MeasurementType.BICEPS, label: t('types.biceps') },
    { value: MeasurementType.THIGHS, label: t('types.thighs') },
    { value: MeasurementType.NECK, label: t('types.neck') },
    { value: MeasurementType.SHOULDERS, label: t('types.shoulders') },
    { value: MeasurementType.FOREARMS, label: t('types.forearms') },
    { value: MeasurementType.CALVES, label: t('types.calves') },
    { value: MeasurementType.CUSTOM, label: t('types.custom') },
  ]

  const getDefaultUnit = (type: MeasurementType) => {
    const unitMap: Record<MeasurementType, string> = {
      [MeasurementType.WEIGHT]: 'kg',
      [MeasurementType.BODY_FAT]: '%',
      [MeasurementType.CHEST]: 'cm',
      [MeasurementType.WAIST]: 'cm',
      [MeasurementType.HIPS]: 'cm',
      [MeasurementType.BICEPS]: 'cm',
      [MeasurementType.THIGHS]: 'cm',
      [MeasurementType.NECK]: 'cm',
      [MeasurementType.SHOULDERS]: 'cm',
      [MeasurementType.FOREARMS]: 'cm',
      [MeasurementType.CALVES]: 'cm',
      [MeasurementType.CUSTOM]: '',
    }
    return unitMap[type] || ''
  }

  const getUnitOptions = (type: MeasurementType) => {
    if (type === MeasurementType.WEIGHT) {
      return ['kg', 'lbs']
    }
    if (type === MeasurementType.BODY_FAT) {
      return ['%']
    }
    if (type === MeasurementType.CUSTOM) {
      return ['kg', 'lbs', 'cm', 'inches', '%', 'other']
    }
    // For measurements (chest, waist, etc.)
    return ['cm', 'inches']
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(normalizeFormData(data)))} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="measurement_type">{t('type')} *</Label>
          <Controller
            name="measurement_type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  // Auto-set unit based on type
                  const defaultUnit = getDefaultUnit(value as MeasurementType)
                  if (!defaultValues?.unit || defaultValues.unit === '') {
                    // This would need to be handled differently, but for now we'll let user set it
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {measurementTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.measurement_type && (
            <p className="text-sm text-destructive">{errors.measurement_type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">{t('unit')} *</Label>
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectUnit')} />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {getUnitOptions(selectedType).map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="value">{t('value')} *</Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            {...register('value', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="measurement_date">{t('date')} *</Label>
          <Input
            id="measurement_date"
            type="date"
            {...register('measurement_date')}
            disabled={isLoading}
          />
          {errors.measurement_date && (
            <p className="text-sm text-destructive">{errors.measurement_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{tCommon('notes')} ({tCommon('optional')})</Label>
        <Textarea
          id="notes"
          placeholder={t('notesPlaceholder')}
          {...register('notes')}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? tCommon('saving') : tCommon('save')}
        </Button>
      </div>
    </form>
  )
}

