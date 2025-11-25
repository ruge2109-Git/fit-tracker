/**
 * Feedback Page
 * Allows users to submit feedback about the application
 */

'use client'

'use client'

import { useEffect, useState } from 'react'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { MessageSquare, Heart, List, Bug, Sparkles, Lightbulb, HelpCircle, Star, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth.store'
import { Feedback, FeedbackStatus, FeedbackType } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const feedbackTypeIcons = {
  [FeedbackType.BUG]: Bug,
  [FeedbackType.FEATURE]: Sparkles,
  [FeedbackType.IMPROVEMENT]: Lightbulb,
  [FeedbackType.OTHER]: HelpCircle,
}

const statusIcons = {
  [FeedbackStatus.PENDING]: Clock,
  [FeedbackStatus.REVIEWED]: CheckCircle,
  [FeedbackStatus.RESOLVED]: CheckCircle,
  [FeedbackStatus.DISMISSED]: XCircle,
}

export default function FeedbackPage() {
  const t = useTranslations('feedback')
  const { user } = useAuthStore()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadFeedbacks = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      if (filterType !== 'all') {
        params.append('type', filterType)
      }

      const response = await fetch(`/api/feedback/my?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('loadError'))
      }

      setFeedbacks(result.data || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-apply filters when they change
  useEffect(() => {
    if (user && filterStatus !== 'all' || filterType !== 'all') {
      loadFeedbacks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType])

  const handleDelete = async () => {
    if (!feedbackToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/feedback/${feedbackToDelete}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('deleteError'))
      }

      toast.success(t('deleteSuccess'))
      setDeleteDialogOpen(false)
      setFeedbackToDelete(null)
      loadFeedbacks()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('deleteError'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
        </div>
        <p className="text-muted-foreground">{t('pageDescription')}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="submit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="submit">{t('submitFeedback')}</TabsTrigger>
          <TabsTrigger value="my" onClick={loadFeedbacks}>
            <List className="h-4 w-4 mr-2" />
            {t('myFeedbacks')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="submit" className="space-y-6">
          {/* Feedback Form */}
          <FeedbackForm />

          {/* Thank You Message */}
          <div className="text-center space-y-2 p-6 bg-muted/50 rounded-lg border">
            <Heart className="h-6 w-6 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">{t('thankYouMessage')}</p>
          </div>
        </TabsContent>

        <TabsContent value="my" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('filters')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('status')}</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allStatuses')}</SelectItem>
                      <SelectItem value={FeedbackStatus.PENDING}>{t('pending')}</SelectItem>
                      <SelectItem value={FeedbackStatus.REVIEWED}>{t('reviewed')}</SelectItem>
                      <SelectItem value={FeedbackStatus.RESOLVED}>{t('resolved')}</SelectItem>
                      <SelectItem value={FeedbackStatus.DISMISSED}>{t('dismissed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('type')}</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allTypes')}</SelectItem>
                      <SelectItem value={FeedbackType.BUG}>{t('types.bug')}</SelectItem>
                      <SelectItem value={FeedbackType.FEATURE}>{t('types.feature')}</SelectItem>
                      <SelectItem value={FeedbackType.IMPROVEMENT}>{t('types.improvement')}</SelectItem>
                      <SelectItem value={FeedbackType.OTHER}>{t('types.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t('filtersAutoApply')}
              </p>
            </CardContent>
          </Card>

          {/* Feedbacks List */}
          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {t('noFeedbacksYet')}
                  </CardContent>
                </Card>
              ) : (
                feedbacks.map((feedback) => {
                  const TypeIcon = feedbackTypeIcons[feedback.type] || MessageSquare
                  const StatusIcon = statusIcons[feedback.status] || Clock

                  return (
                    <Card key={feedback.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <TypeIcon className="h-5 w-5 mt-1 text-primary" />
                            <div className="flex-1">
                              <CardTitle className="text-lg">{feedback.subject}</CardTitle>
                              <CardDescription className="mt-1">
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <Badge variant="outline">{t(`types.${feedback.type}`)}</Badge>
                                  <Badge
                                    variant={
                                      feedback.status === FeedbackStatus.RESOLVED
                                        ? 'default'
                                        : feedback.status === FeedbackStatus.PENDING
                                        ? 'secondary'
                                        : 'outline'
                                    }
                                  >
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {t(feedback.status)}
                                  </Badge>
                                  {feedback.rating && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      {feedback.rating}/5
                                    </Badge>
                                  )}
                                </div>
                              </CardDescription>
                            </div>
                          </div>
                          {feedback.status === FeedbackStatus.PENDING && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFeedbackToDelete(feedback.id)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('message')}</p>
                          <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t('submitted')}</p>
                            <p className="font-medium">{formatDate(feedback.created_at, 'PPpp')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('status')}</p>
                            <p className="font-medium capitalize">{t(feedback.status)}</p>
                          </div>
                        </div>

                        {/* Admin Response */}
                        {feedback.response && (
                          <div className="pt-4 border-t">
                            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium">{t('adminResponse')}</p>
                                {feedback.responded_at && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(feedback.responded_at, 'PPpp')}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{feedback.response}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteFeedback')}</DialogTitle>
            <DialogDescription>
              {t('deleteFeedbackConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                t('delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

