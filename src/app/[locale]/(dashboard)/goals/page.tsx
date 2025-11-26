/**
 * Goals Page
 * Displays all user goals with filtering
 */

'use client'

import { useEffect, useState } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Plus, Target, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GoalCard } from '@/components/goals/goal-card'
import { GoalForm } from '@/components/goals/goal-form'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { useAuthStore } from '@/store/auth.store'
import { useGoalStore } from '@/store/goal.store'
import { GoalFormData } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useSafeLoading } from '@/hooks/use-safe-async'

export default function GoalsPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const { goals, activeGoals, completedGoals, loadGoals, loadActiveGoals, loadCompletedGoals, createGoal, isLoading } = useGoalStore()
  const t = useTranslations('goals')
  const tCommon = useTranslations('common')
  const { isLoading: isSafeLoading, setLoading } = useSafeLoading()
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('active')

  useEffect(() => {
    if (user) {
      loadGoals(user.id)
      loadActiveGoals(user.id)
      loadCompletedGoals(user.id)
    }
  }, [user, loadGoals, loadActiveGoals, loadCompletedGoals])

  const handleCreateGoal = async (data: GoalFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const goalId = await createGoal(user.id, data)
      if (goalId) {
        toast.success(t('goalCreated') || 'Goal created successfully!')
        setCreateDialogOpen(false)
        // Reload goals
        await loadGoals(user.id)
        await loadActiveGoals(user.id)
      } else {
        toast.error(t('errorCreatingGoal') || 'Failed to create goal')
      }
    } catch (error) {
      toast.error(t('errorCreatingGoal') || 'Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  const displayGoals = activeTab === 'all' ? goals : activeTab === 'active' ? activeGoals : completedGoals

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('createGoal')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('createGoal')}</DialogTitle>
              <DialogDescription>{t('createGoalDescription')}</DialogDescription>
            </DialogHeader>
            <GoalForm onSubmit={handleCreateGoal} isLoading={isLoading || isSafeLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Circle className="h-4 w-4" />
            {t('active')} ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {t('completed')} ({completedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('all')} ({goals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : activeGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">{t('noActiveGoals')}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createFirstGoal')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : completedGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">{t('noCompletedGoals')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : goals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">{t('noGoals')}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createFirstGoal')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

