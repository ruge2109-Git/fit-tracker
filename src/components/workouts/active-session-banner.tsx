/**
 * ActiveSessionBanner Component
 * Shows an active workout session banner above the bottom navigation
 */

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from '@/i18n/routing'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Dumbbell, ArrowRight, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadWorkoutProgress, clearWorkoutProgress } from '@/hooks/use-workout-persistence'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'

export function ActiveSessionBanner() {
  const router = useNavigationRouter()
  const pathname = usePathname()
  const t = useTranslations('workouts')
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null)

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeRoutineId) {
      clearWorkoutProgress(activeRoutineId)
      setActiveRoutineId(null)
      toast.info('Sesión descartada')
    }
  }

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
    <div className="md:hidden fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-1 shadow-2xl flex items-center gap-1">
        <button
          onClick={() => router.push(activeRoutinePath)}
          className="flex-1 flex items-center gap-3 p-2 h-12 rounded-xl hover:bg-white/5 active:scale-[0.98] transition-all overflow-hidden"
        >
          <div className="bg-primary/20 p-2 rounded-lg shrink-0">
            <Play className="h-4 w-4 text-primary fill-current" />
          </div>
          <div className="flex flex-col items-start leading-none truncate">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
              {t('activeSession') || 'Sesión Activa'}
            </span>
            <span className="text-xs font-bold text-white truncate w-full">
              {t('continueWorkout') || 'Continuar Entrenamiento'}
            </span>
          </div>
        </button>

        <button
          onClick={handleClear}
          className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all active:scale-[0.95]"
          title="Descartar sesión"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
