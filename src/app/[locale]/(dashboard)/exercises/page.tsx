/**
 * Exercises Page
 * Browse and manage exercise catalog
 */

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Search, Plus, Dumbbell } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseMedia } from '@/components/exercises/exercise-media'
import { ExerciseCardSkeleton } from '@/components/ui/loading-skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useExerciseStore } from '@/store/exercise.store'
import { debounce } from '@/lib/utils'
import { getExerciseTypeOptions, getMuscleGroupOptions } from '@/lib/constants'
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

export default function ExercisesPage() {
  const router = useNavigationRouter()
  const t = useTranslations('exercises')
  const tCommon = useTranslations('common')
  const tExerciseTypes = useTranslations('exerciseTypes')
  const tMuscleGroups = useTranslations('muscleGroups')
  
  const exerciseTypeOptions = getExerciseTypeOptions(tExerciseTypes)
  const muscleGroupOptions = getMuscleGroupOptions(tMuscleGroups)
  const {
    exercises,
    loadExercises,
    searchExercises,
    filterByType,
    filterByMuscleGroup,
    createExercise,
    resetFilters,
    isLoading,
  } = useExerciseStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
  })

  useEffect(() => {
    // Load immediately without blocking
    loadExercises()
  }, [loadExercises])

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      if (query) {
        searchExercises(query)
      } else {
        loadExercises()
      }
    }, 300),
    [searchExercises, loadExercises]
  )

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    debouncedSearch(query)
  }, [debouncedSearch])

  const handleCreateExercise = useCallback(async (data: ExerciseFormData) => {
    const id = await createExercise(data)
    if (id) {
      toast.success(t('exerciseCreated') || 'Exercise created!')
      setDialogOpen(false)
      reset()
    } else {
      toast.error(t('failedToCreateExercise') || 'Failed to create exercise')
    }
  }, [createExercise, t, reset])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title') || 'Exercises'}</h1>
          <p className="text-muted-foreground">{t('subtitle') || 'Browse and manage your exercise library'}</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('newExercise') || 'New Exercise'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createExercise') || 'Create Exercise'}</DialogTitle>
              <DialogDescription>{t('createExerciseDescription') || 'Add a new exercise to your library'}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleCreateExercise)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{tCommon('name') || 'Name'}</Label>
                <Input id="name" {...register('name')} placeholder="Bench Press" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{tCommon('type') || 'Type'}</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="muscle_group">{t('muscleGroup') || 'Muscle Group'}</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{tCommon('description') || 'Description'} ({t('optional') || 'optional'})</Label>
                <Input
                  id="description"
                  {...register('description')}
                  placeholder={t('exerciseDescriptionPlaceholder') || 'Exercise description'}
                />
              </div>

              <Button type="submit" className="w-full">
                {t('createExercise') || 'Create Exercise'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchExercises') || 'Search exercises...'}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select onValueChange={(value) => filterByType(value === 'all' ? null : (value as any))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filterByType') || 'Filter by type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTypes') || 'All Types'}</SelectItem>
            {exerciseTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => filterByMuscleGroup(value === 'all' ? null : (value as any))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filterByMuscle') || 'Filter by muscle'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allMuscles') || 'All Muscles'}</SelectItem>
            {muscleGroupOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={resetFilters}>
          {tCommon('reset') || 'Reset'}
        </Button>
      </div>

      {/* Exercises Grid */}
      {exercises.length === 0 && isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
          {Array.from({ length: 6 }).map((_, i) => (
            <ExerciseCardSkeleton key={i} />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('noExercises') || 'No exercises found'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {exercises.map((exercise) => {
            const typeLabel = exerciseTypeOptions.find((opt) => opt.value === exercise.type)?.label ?? exercise.type
            const muscleLabel = muscleGroupOptions.find((opt) => opt.value === exercise.muscle_group)?.label ?? exercise.muscle_group
            
            return (
              <Card key={exercise.id} className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => router.push(`/exercises/${exercise.id}/stats`)}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  </div>
                  <CardDescription>
                    {typeLabel} • {muscleLabel}
                  </CardDescription>
                </CardHeader>
              <CardContent className="space-y-3">
                {exercise.description && (
                  <p className="text-sm text-muted-foreground">{exercise.description}</p>
                )}
                <ExerciseMedia exercise={exercise} />
                <p className="text-xs text-primary mt-2">{t('viewStats') || 'Click to view stats'} →</p>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

