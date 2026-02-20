'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dumbbell, Plus, Sparkles, Zap } from 'lucide-react'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { workoutRepository } from '@/domain/repositories/workout.repository'
import { Routine } from '@/types'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface QuickStartRoutinesProps {
  userId: string
}

export function QuickStartRoutines({ userId }: QuickStartRoutinesProps) {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useNavigationRouter()

  useEffect(() => {
    loadRoutines()
  }, [userId])

  const loadRoutines = async () => {
    try {
      // Fetch routines
      const res = await routineRepository.findByUserId(userId)
      if (res.data) {
        // If we have many, we could try to sort by frequency by fetching workouts
        // For now, let's just take the most recent 4 active routines
        setRoutines(res.data.filter(r => r.is_active).slice(0, 4))
      }
    } catch (error) {
      console.error('Failed to load routines for quick start', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || (routines.length === 0)) return null

  return (
    <div className="space-y-3 px-1">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
          <Zap className="h-3 w-3 fill-primary text-primary" />
          Inicio Rápido
        </h3>
        {routines.length > 0 && (
          <span className="text-[9px] font-bold text-muted-foreground/40 bg-accent/5 px-2 py-0.5 rounded-full border border-border/5">
            Tus rutinas más usadas
          </span>
        )}
      </div>

      <div className="flex overflow-x-auto pb-4 gap-3 -mx-4 px-4 scrollbar-hide no-scrollbar md:grid md:grid-cols-4 md:pb-0 md:mx-0 md:px-0">
        {routines.map((routine) => (
          <Button
            key={routine.id}
            variant="outline"
            onClick={() => router.push(ROUTES.WORKOUT_FROM_ROUTINE(routine.id))}
            className="flex-shrink-0 min-w-[140px] md:min-w-0 h-20 rounded-[1.5rem] border-none bg-accent/5 hover:bg-primary/10 hover:text-primary transition-all flex flex-col items-center justify-center gap-1 group shadow-sm backdrop-blur-sm"
          >
            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-xs font-black truncate max-w-full px-2 italic uppercase">
              {routine.name}
            </span>
          </Button>
        ))}

        <Button
          onClick={() => router.push(ROUTES.NEW_WORKOUT)}
          className="flex-shrink-0 min-w-[140px] md:min-w-0 h-20 rounded-[1.5rem] bg-background border-2 border-dashed border-accent/20 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 group"
        >
          <div className="h-8 w-8 rounded-full bg-accent/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-xs font-black uppercase italic italic">Libre</span>
        </Button>
      </div>
    </div>
  )
}
