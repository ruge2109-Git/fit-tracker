/**
 * New Goal Page
 * Create a new goal
 */

'use client'

import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalForm } from '@/components/goals/goal-form'
import { useAuthStore } from '@/store/auth.store'
import { useGoalStore } from '@/store/goal.store'
import { GoalFormData } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useSafeLoading } from '@/hooks/use-safe-async'

export default function NewGoalPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const { createGoal, loadGoals, loadActiveGoals, isLoading } = useGoalStore()
  const t = useTranslations('goals')
  const tCommon = useTranslations('common')
  const { isLoading: isSafeLoading, setLoading } = useSafeLoading()

  const handleCreateGoal = async (data: GoalFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const goalId = await createGoal(user.id, data)
      if (goalId) {
        toast.success(t('goalCreated') || 'Goal created successfully!')
        // Reload goals
        await loadGoals(user.id)
        await loadActiveGoals(user.id)
        router.push(ROUTES.GOALS)
      } else {
        toast.error(t('errorCreatingGoal') || 'Failed to create goal')
      }
    } catch (error) {
      toast.error(t('errorCreatingGoal') || 'Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('createGoal')}</h1>
          <p className="text-muted-foreground">{t('createGoalDescription')}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('goalDetails') || 'Goal Details'}</CardTitle>
          <CardDescription>{t('fillGoalInformation') || 'Fill in the information below to create a new goal'}</CardDescription>
        </CardHeader>
        <CardContent>
          <GoalForm onSubmit={handleCreateGoal} isLoading={isLoading || isSafeLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

