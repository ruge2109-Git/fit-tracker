/**
 * WorkoutCard Component
 * Displays workout summary in a card format
 * Following Single Responsibility Principle
 */

'use client'

import Link from 'next/link'
import { memo } from 'react'
import { Calendar, Clock, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Workout } from '@/types'
import { formatDate, formatDuration } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'

interface WorkoutCardProps {
  workout: Workout
  setsCount?: number
}

export const WorkoutCard = memo(function WorkoutCard({ workout, setsCount = 0 }: WorkoutCardProps) {
  const t = useTranslations('common')
  const tWorkouts = useTranslations('workouts')
  
  return (
    <Link 
      href={ROUTES.WORKOUT_DETAIL(workout.id)}
      aria-label={`${t('viewDetails') || 'View details'} - ${workout.routine_name || t('workout')} - ${formatDate(workout.date, 'PP')}`}
      className="group block h-full"
    >
      <Card className="h-full rounded-2xl border-none bg-accent/5 shadow-sm hover:shadow-md hover:shadow-primary/5 hover:bg-accent/10 transition-all duration-200 overflow-hidden relative border border-transparent hover:border-accent/10">
        <CardHeader className="pt-5 px-5 pb-2">
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.15em] text-primary/60">
                     <span>{tWorkouts('workout') || 'WORKOUT'}</span>
                     {workout.duration > 0 && <span>{formatDuration(workout.duration)}</span>}
                </div>
                <CardTitle className="text-base font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                    {workout.routine_name || t('workout')}
                </CardTitle>
            </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {workout.notes && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
              {workout.notes}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5 text-muted-foreground/40" />
                    <span className="text-[9px] font-bold text-muted-foreground/60">
                        {formatDate(workout.date, 'MMM d')}
                    </span>
                </div>
                {setsCount > 0 && (
                     <div className="flex items-center gap-1">
                        <Dumbbell className="h-2.5 w-2.5 text-muted-foreground/40" />
                        <span className="text-[9px] font-bold text-muted-foreground/60">
                            {setsCount} {tWorkouts('sets')}
                        </span>
                    </div>
                )}
             </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})

