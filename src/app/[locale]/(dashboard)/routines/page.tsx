/**
 * Routines Page
 * Manage workout routines
 */

'use client'

import { useEffect, useState } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/store/auth.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { useNotifications } from '@/hooks/use-notifications'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { Routine, DayOfWeek, RoutineFrequency } from '@/types'
import { ROUTINE_FREQUENCY_OPTIONS, DAYS_OF_WEEK_OPTIONS } from '@/lib/constants'
import { useTranslations } from 'next-intl'

const routineSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  frequency: z.string().optional(),
  scheduled_days: z.array(z.string()).optional(),
})

type RoutineFormData = z.infer<typeof routineSchema>

export default function RoutinesPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      frequency: RoutineFrequency.CUSTOM,
      scheduled_days: [],
    },
  })

  const selectedFrequency = watch('frequency')

  useEffect(() => {
    if (user) {
      loadRoutines()
    }
  }, [user])

  // Initialize notifications for active routines
  useNotifications(routines.filter(r => r.is_active))

  const loadRoutines = async () => {
    if (!user) return
    
    // Don't block - show page immediately
    setIsLoading(true)
    try {
      const result = await routineRepository.findByUserId(user.id)
      if (result.data) {
        setRoutines(result.data)
      }
    } catch (error) {
      console.error('Error loading routines:', error)
      toast.error(t('failedToLoad') || 'Failed to load routines')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRoutine = async (data: RoutineFormData) => {
    if (!user) return

    setIsSubmitting(true)
    const result = await routineRepository.create({
      user_id: user.id,
      name: data.name,
      description: data.description,
      is_active: true,
      frequency: data.frequency as RoutineFrequency || RoutineFrequency.CUSTOM,
      scheduled_days: selectedDays as DayOfWeek[],
    })

    if (result.error) {
      toast.error(t('failedToCreate') || 'Failed to create routine')
    } else {
      toast.success(t('routineCreated') || 'Routine created successfully!')
      
      // Log create routine event
      if (result.data) {
        // Get exercises count from the routine data if available
        const exercisesCount = (result.data as any).exercises?.length || 0
        logAuditEvent({
          action: 'create_routine',
          entityType: 'routine',
          entityId: result.data.id,
          details: { name: data.name, exercisesCount },
        })
      }
      
      reset()
      setSelectedDays([])
      setDialogOpen(false)
      loadRoutines()
    }
    setIsSubmitting(false)
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title') || 'My Routines'}</h1>
          <p className="text-muted-foreground">{t('subtitle') || 'Create and manage workout templates'}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('newRoutine') || 'New Routine'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            <DialogDescription className="sr-only">
              {t('createRoutineDescription') ||
                'Create a workout template to quickly start your training sessions'}
            </DialogDescription>
            <div className="flex flex-col md:flex-row">
              <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 md:w-5/12 space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary-foreground/80">
                    {t('newRoutine') || 'New Routine'}
                  </p>
                  <h3 className="text-2xl font-semibold mt-2">{t('createRoutine') || 'Create Routine'}</h3>
                  <p className="text-sm text-primary-foreground/85 mt-2">
                    {t('createRoutineDescription') ||
                      'Create a workout template to quickly start your training sessions'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-primary-foreground/70">
                      {tCommon('routines') || 'Routines'}
                    </p>
                    <p className="text-2xl font-semibold">{routines.length}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-primary-foreground/70">
                      {t('scheduledDays') || 'Scheduled Days'}
                    </p>
                    <p className="text-2xl font-semibold">{selectedDays.length}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-white/10 px-4 py-3 text-xs leading-relaxed">
                  <p>{t('createRoutinesDescription') || 'Create routines to quickly start workouts with predefined exercises'}</p>
                </div>
              </div>
              <div className="flex-1 bg-background p-6">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-xl">{t('createRoutine') || 'Create New Routine'}</DialogTitle>
                  <DialogDescription>
                    {t('createRoutineDescription') ||
                      'Create a workout template to quickly start your training sessions'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleCreateRoutine)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('routineName') || 'Routine Name'}</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Push Day, Leg Day"
                      {...register('name')}
                      disabled={isSubmitting}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {tCommon('description') || 'Description'} ({t('optional') || 'optional'})
                    </Label>
                    <Input
                      id="description"
                      placeholder={t('routineDescriptionPlaceholder') || 'Brief description of this routine'}
                      {...register('description')}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">{t('frequency') || 'Frequency'}</Label>
                    <Controller
                      name="frequency"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('howOften') || 'How often?'} />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {ROUTINE_FREQUENCY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {selectedFrequency === RoutineFrequency.CUSTOM && (
                    <div className="space-y-2">
                      <Label>{t('scheduledDays') || 'Scheduled Days'}</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {DAYS_OF_WEEK_OPTIONS.map((day) => (
                          <Button
                            key={day.value}
                            type="button"
                            variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                            size="sm"
                            className="justify-center text-xs font-semibold"
                            onClick={() => toggleDay(day.value)}
                            disabled={isSubmitting}
                          >
                            {day.short}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('selectScheduledDays') || 'Select the days you plan to do this routine'}
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? t('creating') || 'Creating...' : t('createRoutine') || 'Create Routine'}
                  </Button>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routines Grid */}
      {routines.length === 0 && isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{t('noRoutines') || 'No routines yet'}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {t('createRoutinesDescription') || 'Create routines to quickly start workouts with predefined exercises'}
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('createFirst') || 'Create Your First Routine'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 overflow-hidden">
              <DialogDescription className="sr-only">
                {t('createRoutineDescription') ||
                  'Create a workout template to quickly start your training sessions'}
              </DialogDescription>
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 md:w-5/12 space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-primary-foreground/80">
                      {t('newRoutine') || 'New Routine'}
                    </p>
                    <h3 className="text-2xl font-semibold mt-2">{t('createRoutine') || 'Create Routine'}</h3>
                    <p className="text-sm text-primary-foreground/85 mt-2">
                      {t('createRoutineDescription') ||
                        'Create a workout template to quickly start your training sessions'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg bg-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-primary-foreground/70">
                        {tCommon('routines') || 'Routines'}
                      </p>
                      <p className="text-2xl font-semibold">{routines.length}</p>
                    </div>
                    <div className="rounded-lg bg-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-primary-foreground/70">
                        {t('scheduledDays') || 'Scheduled Days'}
                      </p>
                      <p className="text-2xl font-semibold">{selectedDays.length}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/10 px-4 py-3 text-xs leading-relaxed">
                    <p>
                      {t('createRoutinesDescription') ||
                        'Create routines to quickly start workouts with predefined exercises'}
                    </p>
                  </div>
                </div>
                <div className="flex-1 bg-background p-6">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl">{t('createRoutine') || 'Create New Routine'}</DialogTitle>
                    <DialogDescription>
                      {t('createRoutineDescription') ||
                        'Create a workout template to quickly start your training sessions'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit(handleCreateRoutine)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name-empty">{t('routineName') || 'Routine Name'}</Label>
                      <Input
                        id="name-empty"
                        placeholder="e.g., Push Day, Leg Day"
                        {...register('name')}
                        disabled={isSubmitting}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description-empty">
                        {tCommon('description') || 'Description'} ({t('optional') || 'optional'})
                      </Label>
                      <Input
                        id="description-empty"
                        placeholder={t('routineDescriptionPlaceholder') || 'Brief description of this routine'}
                        {...register('description')}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="frequency-empty">{t('frequency') || 'Frequency'}</Label>
                      <Controller
                        name="frequency"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('howOften') || 'How often?'} />
                            </SelectTrigger>
                            <SelectContent className="max-h-56">
                              {ROUTINE_FREQUENCY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {selectedFrequency === RoutineFrequency.CUSTOM && (
                      <div className="space-y-2">
                        <Label>{t('scheduledDays') || 'Scheduled Days'}</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {DAYS_OF_WEEK_OPTIONS.map((day) => (
                            <Button
                              key={day.value}
                              type="button"
                              variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                              size="sm"
                              className="justify-center text-xs font-semibold"
                              onClick={() => toggleDay(day.value)}
                              disabled={isSubmitting}
                            >
                              {day.short}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('selectScheduledDays') || 'Select the days you plan to do this routine'}
                        </p>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? t('creating') || 'Creating...' : t('createRoutine') || 'Create Routine'}
                    </Button>
                  </form>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {routines.map((routine) => (
            <Card key={routine.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{routine.name}</CardTitle>
                  {routine.is_active && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {tCommon('active') || 'Active'}
                    </span>
                  )}
                </div>
                {routine.description && (
                  <CardDescription>{routine.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/routines/${routine.id}`)}
                >
                  {t('viewDetails') || 'View Details'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

