/**
 * GoalProgress Component
 * Displays and allows adding progress to a goal
 */

'use client'

import { useState } from 'react'
import { Plus, TrendingUp, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Goal, GoalProgress as GoalProgressType, GoalProgressFormData } from '@/types'
import { formatDate } from '@/lib/utils'
import { goalService } from '@/domain/services/goal.service'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface GoalProgressProps {
  goal: Goal
  progress: GoalProgressType[]
  onProgressAdded: (progress: GoalProgressFormData) => Promise<void>
}

export function GoalProgress({ goal, progress, onProgressAdded }: GoalProgressProps) {
  const t = useTranslations('goals')
  const tCommon = useTranslations('common')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<GoalProgressFormData>({
    value: 0,
    notes: '',
  })

  const progressPercentage = goalService.calculateProgress(goal)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // This will be handled by the parent component
      // We just validate and pass the data
      if (formData.value <= 0) {
        toast.error(t('invalidProgressValue'))
        return
      }

      // Call parent handler
      await onProgressAdded(formData)
      
      // Reset form
      setFormData({ value: 0, notes: '' })
      setIsDialogOpen(false)
    } catch (error) {
      toast.error(t('errorAddingProgress'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('goalProgress')}
            </CardTitle>
            <CardDescription>
              {t('currentProgress')}: {goal.current_value} / {goal.target_value} {goal.unit}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('addProgress')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addProgress')}</DialogTitle>
                <DialogDescription>{t('addProgressDescription')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="progress_value">{t('progressValue')} *</Label>
                  <Input
                    id="progress_value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.value || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progress_notes">{tCommon('notes')} ({tCommon('optional')})</Label>
                  <Textarea
                    id="progress_notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t('progressNotesPlaceholder')}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? tCommon('saving') : tCommon('save')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('progressPercentage')}</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Progress History */}
        {progress.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('progressHistory')}</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {progress.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-2 border rounded-lg text-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.value} {goal.unit}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.created_at, 'PP')}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.length === 0 && (
          <p className="text-center text-muted-foreground py-4">{t('noProgressYet')}</p>
        )}
      </CardContent>
    </Card>
  )
}

