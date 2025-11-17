'use client'

import { useState, useEffect } from 'react'
import { usePathname } from '@/i18n/routing'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadWorkoutProgress } from '@/hooks/use-workout-persistence'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/lib/constants'

export function ActiveRoutineButton() {
  const router = useNavigationRouter()
  const pathname = usePathname()
  const t = useTranslations('workouts')
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null)

  useEffect(() => {
    const checkActiveRoutine = () => {
      if (typeof window === 'undefined') return

      try {
        const keys = Object.keys(localStorage)
        const routineKeys = keys.filter(key => key.startsWith('workout_progress_routine_'))
        
        if (routineKeys.length > 0) {
          const routineId = routineKeys[0].replace('workout_progress_routine_', '')
          const progress = loadWorkoutProgress(routineId)
          
          if (progress && progress.sets && progress.sets.length > 0) {
            setActiveRoutineId(routineId)
          } else {
            setActiveRoutineId(null)
          }
        } else {
          setActiveRoutineId(null)
        }
      } catch (error) {
        setActiveRoutineId(null)
      }
    }

    checkActiveRoutine()
    
    const interval = setInterval(checkActiveRoutine, 2000)
    
    const handleStorageChange = () => {
      checkActiveRoutine()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const handleReturnToRoutine = () => {
    if (activeRoutineId) {
      router.push(ROUTES.WORKOUT_FROM_ROUTINE(activeRoutineId))
    }
  }

  if (!activeRoutineId) return null

  const activeRoutinePath = ROUTES.WORKOUT_FROM_ROUTINE(activeRoutineId)
  const isOnRoutinePage = pathname.includes(activeRoutinePath)
  if (isOnRoutinePage) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={handleReturnToRoutine}
        size="lg"
        className="rounded-full shadow-lg h-14 w-14 p-0"
        title={t('returnToActiveRoutine') || 'Return to active routine'}
      >
        <Dumbbell className="h-6 w-6 text-primary-foreground" />
      </Button>
    </div>
  )
}

