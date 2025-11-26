'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { toast } from 'sonner'
import { Sparkles, List, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { Routine } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'

export default function NewWorkoutPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const t = useTranslations('workouts')
  const tRoutines = useTranslations('routines')
  const tCommon = useTranslations('common')
  const [workoutMode, setWorkoutMode] = useState<'routine' | 'free'>('free')
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('')
  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([])
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false)
  const [routineSearch, setRoutineSearch] = useState('')

  const loadAvailableRoutines = useCallback(async () => {
    if (!user) return
    setIsLoadingRoutines(true)
    const result = await routineRepository.findByUserId(user.id)
    if (result.data) {
      setAvailableRoutines(result.data)
    } else if (result.error) {
      toast.error(tRoutines('failedToLoad') || 'Failed to load routines')
    }
    setIsLoadingRoutines(false)
  }, [user, tRoutines])

  useEffect(() => {
    if (user && workoutMode === 'routine' && availableRoutines.length === 0 && !isLoadingRoutines) {
      loadAvailableRoutines()
    }
  }, [user, workoutMode, availableRoutines.length, isLoadingRoutines, loadAvailableRoutines])

  const filteredRoutines = useMemo(() => {
    if (!routineSearch) return availableRoutines
    return availableRoutines.filter((routine) =>
      `${routine.name} ${routine.description || ''}`.toLowerCase().includes(routineSearch.toLowerCase()),
    )
  }, [availableRoutines, routineSearch])

  const handleStartFreeWorkout = () => {
    router.push(ROUTES.NEW_WORKOUT_FREE)
  }

  const handleSelectRoutine = (routineId: string) => {
    router.push(ROUTES.WORKOUT_FROM_ROUTINE(routineId))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('newWorkout') || 'New Workout'}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t('recordSession') || 'Record your training session'}</p>
      </div>

      {/* Workout Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('workoutType') || 'Workout Type'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              type="button"
              variant={workoutMode === 'free' ? 'default' : 'outline'}
              className="h-auto py-4 sm:py-6 flex flex-col items-center gap-2 w-full"
              onClick={() => {
                setWorkoutMode('free')
                setSelectedRoutineId('')
                setRoutineSearch('')
              }}
            >
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              <div className="text-center px-2">
                <div className="font-semibold text-sm sm:text-base">{t('freeWorkout') || 'Free Workout'}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2" style={{ textWrap: 'wrap' }}>
                  {t('freeWorkoutDescription') || 'Start from scratch and add exercises manually'}
                </div>
              </div>
            </Button>

            <Button
              type="button"
              variant={workoutMode === 'routine' ? 'default' : 'outline'}
              className="h-auto py-4 sm:py-6 flex flex-col items-center gap-2 w-full"
              onClick={() => {
                setWorkoutMode('routine')
              }}
            >
              <List className="h-5 w-5 sm:h-6 sm:w-6" />
              <div className="text-center px-2">
                <div className="font-semibold text-sm sm:text-base">{t('startFromRoutine') || 'From Routine'}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t('startFromRoutineDescription') || 'Use a routine template'}
                </div>
              </div>
            </Button>
          </div>

          {workoutMode === 'free' && (
            <div className="pt-4 border-t">
              <Button onClick={handleStartFreeWorkout} className="w-full" size="lg">
                {t('startFreeWorkout') || 'Start Free Workout'}
              </Button>
            </div>
          )}

          {workoutMode === 'routine' && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>{tRoutines('selectRoutine') || 'Select Routine'}</Label>
                {availableRoutines.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRoutineSearch(routineSearch ? '' : ' ')}
                    className="h-8"
                  >
                    {routineSearch ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        {tCommon('clear') || 'Clear'}
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-1" />
                        {tCommon('search') || 'Search'}
                      </>
                    )}
                  </Button>
                )}
              </div>
              {routineSearch && (
                <Input
                  placeholder={t('searchRoutinePlaceholder') || 'Search routine by name'}
                  value={routineSearch}
                  onChange={(e) => setRoutineSearch(e.target.value)}
                  className="mb-2"
                  autoFocus
                />
              )}
              {isLoadingRoutines ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t('loading') || 'Loading...'}
                </div>
              ) : filteredRoutines.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {availableRoutines.length === 0
                    ? tRoutines('noRoutines') || 'No routines yet'
                    : t('noRoutinesMatchSearch') || 'No routines match your search'}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRoutines.map((routine) => (
                    <Card
                      key={routine.id}
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedRoutineId === routine.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleSelectRoutine(routine.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base break-words">{routine.name}</CardTitle>
                        {routine.description && (
                          <CardDescription className="break-words">{routine.description}</CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
