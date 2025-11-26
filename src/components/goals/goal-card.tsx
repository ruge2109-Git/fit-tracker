/**
 * GoalCard Component
 * Displays goal summary in a card format
 */

'use client'

import Link from 'next/link'
import { memo } from 'react'
import { Target, Calendar, CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Goal, GoalType } from '@/types'
import { formatDate } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { goalService } from '@/domain/services/goal.service'
import { cn } from '@/lib/utils'

interface GoalCardProps {
  goal: Goal
}

export const GoalCard = memo(function GoalCard({ goal }: GoalCardProps) {
  const t = useTranslations('goals')
  const tCommon = useTranslations('common')
  
  const progress = goalService.calculateProgress(goal)
  const isCompleted = goal.is_completed

  const getGoalTypeLabel = (type: GoalType) => {
    const typeMap: Record<GoalType, string> = {
      [GoalType.WEIGHT]: t('types.weight'),
      [GoalType.VOLUME]: t('types.volume'),
      [GoalType.FREQUENCY]: t('types.frequency'),
      [GoalType.STRENGTH]: t('types.strength'),
      [GoalType.ENDURANCE]: t('types.endurance'),
      [GoalType.CUSTOM]: t('types.custom'),
    }
    return typeMap[type] || type
  }

  return (
    <Link 
      href={ROUTES.GOAL_DETAIL(goal.id)}
      aria-label={`${tCommon('viewDetails') || 'View details'} - ${goal.title}`}
    >
      <Card className={cn(
        "hover:shadow-lg transition-shadow cursor-pointer",
        isCompleted && "opacity-75"
      )} role="article">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Target className="h-5 w-5" />
                )}
                {goal.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {goal.description || t('noDescription')}
              </CardDescription>
            </div>
            <Badge variant={isCompleted ? "default" : "secondary"}>
              {getGoalTypeLabel(goal.type)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {goal.current_value} / {goal.target_value} {goal.unit}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Goal Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {goal.target_date ? (
                <>
                  {t('targetDate')}: {formatDate(goal.target_date, 'PP')}
                </>
              ) : (
                t('noTargetDate')
              )}
            </span>
          </div>

          {isCompleted && goal.completed_at && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {t('completedOn')} {formatDate(goal.completed_at, 'PP')}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
})

