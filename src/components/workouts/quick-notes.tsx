/**
 * Quick Notes Component
 * Allows quick editing of workout notes inline
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface QuickNotesProps {
  notes: string | null | undefined
  onSave: (notes: string) => Promise<void>
  className?: string
  maxLength?: number
}

export function QuickNotes({ notes, onSave, className, maxLength = 500 }: QuickNotesProps) {
  const t = useTranslations('common')
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      )
    }
  }, [isEditing])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editedNotes)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedNotes(notes || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  if (isEditing) {
    return (
      <div className={cn('space-y-2', className)}>
        <Textarea
          ref={textareaRef}
          value={editedNotes}
          onChange={(e) => setEditedNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('notes') || 'Notes...'}
          maxLength={maxLength}
          className="min-h-[80px] resize-none"
          disabled={isSaving}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {editedNotes.length}/{maxLength}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-1" />
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Check className="h-4 w-4 mr-1" />
              {t('save')}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('pressEnterToSave') || 'Press Ctrl+Enter to save, Esc to cancel'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('group relative', className)}>
      {notes ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {notes}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {t('noNotes') || 'No notes. Click to add...'}
        </p>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">{t('edit')}</span>
      </Button>
    </div>
  )
}

