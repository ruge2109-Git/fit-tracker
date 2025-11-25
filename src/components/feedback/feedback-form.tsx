/**
 * Feedback Form Component
 * Allows users to submit feedback about the application
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageSquare, Send, Star, Bug, Lightbulb, Sparkles, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FeedbackType, FeedbackFormData } from '@/types'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

const feedbackTypeIcons = {
  [FeedbackType.BUG]: Bug,
  [FeedbackType.FEATURE]: Sparkles,
  [FeedbackType.IMPROVEMENT]: Lightbulb,
  [FeedbackType.OTHER]: HelpCircle,
}

interface FeedbackFormProps {
  onSuccess?: () => void
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const t = useTranslations('feedback')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const feedbackSchema = z.object({
    type: z.nativeEnum(FeedbackType),
    subject: z.string().min(1, t('validation.subjectRequired')).max(200, t('validation.subjectMaxLength')),
    message: z.string().min(10, t('validation.messageMinLength')).max(2000, t('validation.messageMaxLength')),
    rating: z.number().min(1).max(5).optional(),
  })

  type FeedbackFormValues = z.infer<typeof feedbackSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: FeedbackType.IMPROVEMENT,
      subject: '',
      message: '',
      rating: undefined,
    },
  })

  const selectedType = watch('type')
  const selectedRating = watch('rating')

  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('submitError'))
      }

      toast.success(t('submitSuccess'))
      reset()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const TypeIcon = feedbackTypeIcons[selectedType] || MessageSquare

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="type">{t('type')}</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue('type', value as FeedbackType)}
            >
              <SelectTrigger id="type">
                <div className="flex items-center gap-2">
                  <TypeIcon className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FeedbackType.BUG}>
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    {t('types.bug')}
                  </div>
                </SelectItem>
                <SelectItem value={FeedbackType.FEATURE}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t('types.feature')}
                  </div>
                </SelectItem>
                <SelectItem value={FeedbackType.IMPROVEMENT}>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    {t('types.improvement')}
                  </div>
                </SelectItem>
                <SelectItem value={FeedbackType.OTHER}>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    {t('types.other')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">{t('subject')}</Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder={t('subjectPlaceholder')}
              maxLength={200}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">{t('message')}</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder={t('messagePlaceholder')}
              rows={6}
              maxLength={2000}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.message?.message}</span>
              <span>{watch('message')?.length || 0} / 2000</span>
            </div>
          </div>

          {/* Rating (Optional) */}
          <div className="space-y-2">
            <Label>{t('rating')} ({t('optional')})</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setValue('rating', selectedRating === rating ? undefined : rating)}
                  className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      selectedRating && rating <= selectedRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
            </div>
            {selectedRating && (
              <p className="text-sm text-muted-foreground">
                {t('ratingSelected', { rating: selectedRating })}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {t('submitting')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('submit')}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {t('privacyNote')}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

