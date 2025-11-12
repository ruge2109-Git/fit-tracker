'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from '@/i18n/routing'
import { Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadWorkoutProgress } from '@/hooks/use-workout-persistence'
import { useTranslations } from 'next-intl'

export function ActiveRoutineButton() {
  const router = useRouter()
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
      router.push(`/workouts/new-from-routine/${activeRoutineId}`)
    }
  }

  if (!activeRoutineId) return null

  const isOnRoutinePage = pathname.includes(`/workouts/new-from-routine/${activeRoutineId}`)
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

