/**
 * Admin Feedback Page
 * View and manage all user feedbacks (admin only)
 */

'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { Feedback, FeedbackStatus, FeedbackType } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageSquare, Bug, Sparkles, Lightbulb, HelpCircle, Star, CheckCircle, XCircle, Clock, Trash2, Reply } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatDate } from '@/lib/utils'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'

interface FeedbackWithUser extends Feedback {
  user?: {
    id: string
    email: string
    name: string | null
  }
}

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

export default function AdminFeedbackPage() {
  const t = useTranslations('admin')
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [responseDialogOpen, setResponseDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [feedbackToRespond, setFeedbackToRespond] = useState<FeedbackWithUser | null>(null)
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [isResponding, setIsResponding] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!isAdminLoading) {
      if (!isAdmin) {
        toast.error(t('accessDenied'))
        return
      }
      loadFeedbacks()
    }
  }, [isAdmin, isAdminLoading])

  // Auto-apply filters when they change
  useEffect(() => {
    if (!isAdminLoading && isAdmin) {
      loadFeedbacks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType])

  const loadFeedbacks = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      if (filterType !== 'all') {
        params.append('type', filterType)
      }

      const response = await fetch(`/api/feedback?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load feedbacks')
      }

      setFeedbacks(result.data || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const updateFeedbackStatus = async (feedbackId: string, newStatus: FeedbackStatus) => {
    setUpdatingStatus(feedbackId)
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update feedback')
      }

      toast.success(t('statusUpdated'))
      loadFeedbacks()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('updateError'))
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleRespond = async () => {
    if (!feedbackToRespond || !responseText.trim()) {
      toast.error(t('responseRequired'))
      return
    }

    setIsResponding(true)
    try {
      const response = await fetch(`/api/feedback/${feedbackToRespond.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: responseText.trim() }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('responseError'))
      }

      toast.success(t('responseSent'))
      setResponseDialogOpen(false)
      setFeedbackToRespond(null)
      setResponseText('')
      loadFeedbacks()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('responseError'))
    } finally {
      setIsResponding(false)
    }
  }

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

  if (isAdminLoading || isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('accessDenied')}</CardTitle>
            <CardDescription>{t('adminOnly')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            {t('feedbackManagement')}
          </h1>
          <p className="text-muted-foreground">{t('manageAllFeedbacks')}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('status')}</label>
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
              <label className="text-sm font-medium">{t('type')}</label>
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
            {t('filtersAutoApply') || 'Filters are applied automatically'}
          </p>
        </CardContent>
      </Card>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('noFeedbacks')}
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
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('message')}</p>
                    <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('user')}</p>
                      <p className="font-medium">
                        {feedback.user?.name || feedback.user?.email || t('unknownUser')}
                      </p>
                      {feedback.user?.email && (
                        <p className="text-xs text-muted-foreground">{feedback.user.email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('submitted')}</p>
                      <p className="font-medium">{formatDate(feedback.created_at, 'PPpp')}</p>
                    </div>
                  </div>

                  {/* Admin Response */}
                  {feedback.response && (
                    <div className="pt-4 border-t">
                      <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">{t('yourResponse')}</p>
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

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground mr-2">{t('updateStatus')}:</span>
                      {Object.values(FeedbackStatus).map((status) => (
                        <Button
                          key={status}
                          variant={feedback.status === status ? 'default' : 'outline'}
                          size="sm"
                          className="mr-2"
                          onClick={() => updateFeedbackStatus(feedback.id, status)}
                        >
                          {t(status)}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {!feedback.response && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFeedbackToRespond(feedback)
                            setResponseDialogOpen(true)
                          }}
                        >
                          <Reply className="h-4 w-4 mr-2" />
                          {t('respond')}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setFeedbackToDelete(feedback.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('respondToFeedback')}</DialogTitle>
            <DialogDescription>
              {t('respondToFeedbackDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {feedbackToRespond && (
              <div className="space-y-2">
                <Label>{t('subject')}</Label>
                <p className="text-sm font-medium">{feedbackToRespond.subject}</p>
                <Label>{t('originalMessage')}</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {feedbackToRespond.message}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="response">{t('yourResponse')}</Label>
              <Textarea
                id="response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={t('responsePlaceholder')}
                rows={6}
                maxLength={2000}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('responseWillBeVisible')}</span>
                <span>{responseText.length} / 2000</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setResponseDialogOpen(false)
                setResponseText('')
                setFeedbackToRespond(null)
              }}
              disabled={isResponding}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleRespond} disabled={!responseText.trim() || isResponding}>
              {isResponding ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                t('sendResponse')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

