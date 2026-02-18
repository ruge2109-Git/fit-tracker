/**
 * ActiveSessionBanner Component
 * Shows an active workout session banner above the bottom navigation
 */

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from '@/i18n/routing'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Dumbbell, ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadWorkoutProgress } from '@/hooks/use-workout-persistence'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/lib/constants'

export function ActiveSessionBanner() {
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
    return () => clearInterval(interval)
  }, [])

  if (!activeRoutineId) return null

  const activeRoutinePath = ROUTES.WORKOUT_FROM_ROUTINE(activeRoutineId)
  const isOnRoutinePage = pathname.includes(activeRoutinePath)
  if (isOnRoutinePage) return null

  return (
    <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 animate-in slide-in-from-bottom-2 duration-300">
      <Button
        onClick={() => router.push(activeRoutinePath)}
        variant="default"
        className="w-full h-12 shadow-lg rounded-xl flex items-center justify-between px-4 bg-primary text-primary-foreground group"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary-foreground/20 p-1.5 rounded-lg animate-pulse">
            <Play className="h-4 w-4 fill-current" />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
              {t('activeSession') || 'Active Session'}
            </span>
            <span className="text-sm font-bold">
              {t('continueWorkout') || 'Continue Workout'}
            </span>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  )
}
