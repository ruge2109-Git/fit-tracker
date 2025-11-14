/**
 * WorkoutCard Component
 * Displays workout summary in a card format
 * Following Single Responsibility Principle
 */

import Link from 'next/link'
import { Calendar, Clock, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Workout } from '@/types'
import { formatDate, formatDuration } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

interface WorkoutCardProps {
  workout: Workout
  setsCount?: number
}

export function WorkoutCard({ workout, setsCount = 0 }: WorkoutCardProps) {
  return (
    <Link href={ROUTES.WORKOUT_DETAIL(workout.id)}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {workout.routine_name || 'Workout'}
          </CardTitle>
          <CardDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(workout.date, 'PP')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(workout.duration)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workout.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {workout.notes}
            </p>
          )}
          <p className="text-sm font-medium">
            {setsCount} {setsCount === 1 ? 'set' : 'sets'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

