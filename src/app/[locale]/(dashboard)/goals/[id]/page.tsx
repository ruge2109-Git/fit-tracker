/**
 * Goal Detail Page
 * View details of a specific goal and manage progress
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { ArrowLeft, Trash2, Edit, Target, Calendar, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalProgress } from '@/components/goals/goal-progress'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useGoalStore } from '@/store/goal.store'
import { useAuthStore } from '@/store/auth.store'
import { formatDate } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { GoalProgressFormData } from '@/types'
import { goalService } from '@/domain/services/goal.service'
import { useSafeLoading } from '@/hooks/use-safe-async'
import { logger } from '@/lib/logger'

export default function GoalDetailPage() {
  const params = useParams()
  const router = useNavigationRouter()
  const { currentGoal, loadGoal, deleteGoal, updateGoal, addProgress, isLoading } = useGoalStore()
  const { user } = useAuthStore()
  const t = useTranslations('goals')
  const tCommon = useTranslations('common')
  const { isLoading: isSafeLoading, setLoading } = useSafeLoading()
  
  const goalId = params.id as string

  useEffect(() => {
    if (goalId) {
      loadGoal(goalId).catch((error) => {
        logger.error('Error loading goal', error as Error, 'GoalDetailPage')
      })
    }
  }, [goalId, loadGoal])

  const handleDelete = async () => {
    const confirmMessage = t('deleteGoalConfirmation') || 'Are you sure you want to delete this goal?'
    if (!window.confirm(confirmMessage)) return

    const success = await deleteGoal(goalId)
    if (success) {
      toast.success(t('goalDeleted') || 'Goal deleted')
      router.push(ROUTES.GOALS)
    } else {
      toast.error(t('errorDeletingGoal') || 'Failed to delete goal')
    }
  }


  const handleAddProgress = async (progress: GoalProgressFormData) => {
    setLoading(true)
    try {
      const success = await addProgress(goalId, progress)
      if (success) {
        toast.success(t('progressAdded') || 'Progress added successfully!')
        await loadGoal(goalId)
      } else {
        toast.error(t('errorAddingProgress') || 'Failed to add progress')
      }
    } catch (error) {
      toast.error(t('errorAddingProgress') || 'Failed to add progress')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading && !currentGoal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentGoal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">{t('goalNotFound') || 'Goal not found'}</p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => router.push(ROUTES.GOALS)}
            >
              {tCommon('back')} {t('toGoals')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercentage = goalService.calculateProgress(currentGoal)

  const getGoalTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      weight: t('types.weight'),
      volume: t('types.volume'),
      frequency: t('types.frequency'),
      strength: t('types.strength'),
      endurance: t('types.endurance'),
      custom: t('types.custom'),
    }
    return typeMap[type] || type
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back')}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.GOAL_EDIT(goalId))}
            disabled={isLoading || isSafeLoading}
          >
            <Edit className="h-4 w-4 mr-2" />
            {tCommon('edit')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || isSafeLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {tCommon('delete')}
          </Button>
        </div>
      </div>

      {/* Goal Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                {currentGoal.is_completed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Target className="h-6 w-6" />
                )}
                {currentGoal.title}
              </CardTitle>
              {currentGoal.description && (
                <p className="text-muted-foreground mt-2">{currentGoal.description}</p>
              )}
            </div>
            <Badge variant={currentGoal.is_completed ? 'default' : 'secondary'}>
              {getGoalTypeLabel(currentGoal.type)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('goalProgress')}</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {currentGoal.current_value} / {currentGoal.target_value} {currentGoal.unit}
              </span>
              <span>
                {currentGoal.target_value - currentGoal.current_value} {currentGoal.unit} {t('remaining')}
              </span>
            </div>
          </div>

          {/* Goal Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('startDate')}:</span>
              <span>{formatDate(currentGoal.start_date, 'PP')}</span>
            </div>
            {currentGoal.target_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('targetDate')}:</span>
                <span>{formatDate(currentGoal.target_date, 'PP')}</span>
              </div>
            )}
          </div>

          {currentGoal.is_completed && currentGoal.completed_at && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {t('completedOn')} {formatDate(currentGoal.completed_at, 'PP')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Management */}
      {!currentGoal.is_completed && (
        <GoalProgress
          goal={currentGoal}
          progress={currentGoal.progress || []}
          onProgressAdded={handleAddProgress}
        />
      )}

    </div>
  )
}

