/**
 * New Exercise Page
 * Create a new exercise
 */

'use client'

import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExerciseStore } from '@/store/exercise.store'
import { getExerciseTypeOptions, getMuscleGroupOptions, ROUTES } from '@/lib/constants'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ExerciseFormData } from '@/types'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

const exerciseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string(),
  muscle_group: z.string(),
  description: z.string().optional(),
})

export default function NewExercisePage() {
  const router = useNavigationRouter()
  const t = useTranslations('exercises')
  const tCommon = useTranslations('common')
  const tExerciseTypes = useTranslations('exerciseTypes')
  const tMuscleGroups = useTranslations('muscleGroups')
  
  const exerciseTypeOptions = getExerciseTypeOptions(tExerciseTypes)
  const muscleGroupOptions = getMuscleGroupOptions(tMuscleGroups)
  const { createExercise } = useExerciseStore()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
  })

  const handleCreateExercise = async (data: ExerciseFormData) => {
    const id = await createExercise(data)
    if (id) {
      toast.success(t('exerciseCreated') || 'Exercise created!')
      router.push(ROUTES.EXERCISES)
    } else {
      toast.error(t('failedToCreateExercise') || 'Failed to create exercise')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('createExercise') || 'Create Exercise'}</h1>
          <p className="text-muted-foreground">{t('createExerciseDescription') || 'Add a new exercise to your library'}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('exerciseDetails') || 'Exercise Details'}</CardTitle>
          <CardDescription>{t('fillExerciseInformation') || 'Fill in the information below to create a new exercise'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleCreateExercise)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{tCommon('name') || 'Name'} *</Label>
              <Input id="name" {...register('name')} placeholder="Bench Press" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{tCommon('type') || 'Type'} *</Label>
              <Select onValueChange={(value) => setValue('type', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectType') || 'Select type'} />
                </SelectTrigger>
                <SelectContent>
                  {exerciseTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="muscle_group">{t('muscleGroup') || 'Muscle Group'} *</Label>
              <Select onValueChange={(value) => setValue('muscle_group', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectMuscleGroup') || 'Select muscle group'} />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroupOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.muscle_group && <p className="text-sm text-destructive">{errors.muscle_group.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{tCommon('description') || 'Description'} ({t('optional') || 'optional'})</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder={t('exerciseDescriptionPlaceholder') || 'Exercise description'}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                {tCommon('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" className="flex-1">
                {t('createExercise') || 'Create Exercise'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

