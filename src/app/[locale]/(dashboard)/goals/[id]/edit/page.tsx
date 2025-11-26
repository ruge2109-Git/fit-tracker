/**
 * Edit Goal Page
 * Edit an existing goal
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalForm } from '@/components/goals/goal-form'
import { useGoalStore } from '@/store/goal.store'
import { GoalFormData, GoalWithProgress } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useSafeLoading } from '@/hooks/use-safe-async'
import { logger } from '@/lib/logger'

export default function EditGoalPage() {
  const params = useParams()
  const router = useNavigationRouter()
  const goalId = params.id as string
  const { loadGoal, updateGoal, isLoading, currentGoal, error } = useGoalStore()
  const t = useTranslations('goals')
  const tCommon = useTranslations('common')
  const { isLoading: isSafeLoading, setLoading } = useSafeLoading()

  useEffect(() => {
    loadGoalData()
  }, [goalId])

  const loadGoalData = async () => {
    try {
      await loadGoal(goalId)
      if (error) {
        toast.error(t('failedToLoad') || 'Failed to load goal')
        router.push(ROUTES.GOALS)
      }
    } catch (error) {
      logger.error('Error loading goal', error as Error, 'EditGoalPage')
      toast.error(t('failedToLoad') || 'Failed to load goal')
      router.push(ROUTES.GOALS)
    }
  }

  const handleUpdate = async (data: GoalFormData) => {
    setLoading(true)
    try {
      const success = await updateGoal(goalId, data)
      if (success) {
        toast.success(t('goalUpdated') || 'Goal updated successfully!')
        router.push(ROUTES.GOAL_DETAIL(goalId))
      } else {
        toast.error(t('errorUpdatingGoal') || 'Failed to update goal')
      }
    } catch (error) {
      toast.error(t('errorUpdatingGoal') || 'Failed to update goal')
    } finally {
      setLoading(false)
    }
  }

  if (!currentGoal || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.GOAL_DETAIL(goalId))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('editGoal')}</h1>
          <p className="text-muted-foreground">{currentGoal.title}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('goalDetails') || 'Goal Details'}</CardTitle>
          <CardDescription>{t('editGoalDescription') || 'Update the information below'}</CardDescription>
        </CardHeader>
        <CardContent>
          <GoalForm
            onSubmit={handleUpdate}
            defaultValues={{
              title: currentGoal.title,
              description: currentGoal.description,
              type: currentGoal.type,
              target_value: currentGoal.target_value,
              unit: currentGoal.unit,
              start_date: currentGoal.start_date,
              target_date: currentGoal.target_date,
            }}
            isLoading={isLoading || isSafeLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

