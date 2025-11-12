/**
 * Exercises Page
 * Browse and manage exercise catalog
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { EXERCISE_TYPE_OPTIONS, MUSCLE_GROUP_OPTIONS } from '@/lib/constants'
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
  const router = useRouter()
  const t = useTranslations('exercises')
  const tCommon = useTranslations('common')
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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query) {
      searchExercises(query)
    } else {
      loadExercises()
    }
  }

  const handleCreateExercise = async (data: ExerciseFormData) => {
    const id = await createExercise(data)
    if (id) {
      toast.success('Exercise created!')
      setDialogOpen(false)
      reset()
    } else {
      toast.error('Failed to create exercise')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exercises</h1>
          <p className="text-muted-foreground">Browse and manage your exercise library</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Exercise</DialogTitle>
              <DialogDescription>Add a new exercise to your library</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleCreateExercise)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} placeholder="Bench Press" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select onValueChange={(value) => setValue('type', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPE_OPTIONS.map((option) => (
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
                    {MUSCLE_GROUP_OPTIONS.map((option) => (
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

        <Select onValueChange={(value) => filterByType(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filterByType') || 'Filter by type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTypes') || 'All Types'}</SelectItem>
            {EXERCISE_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => filterByMuscleGroup(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filterByMuscle') || 'Filter by muscle'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allMuscles') || 'All Muscles'}</SelectItem>
            {MUSCLE_GROUP_OPTIONS.map((option) => (
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
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => router.push(`/exercises/${exercise.id}/stats`)}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                </div>
                <CardDescription className="capitalize">
                  {exercise.type} • {exercise.muscle_group.replace('_', ' ')}
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
          ))}
        </div>
      )}
    </div>
  )
}

