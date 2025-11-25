/**
 * Inline Edit Component
 * Allows editing text fields inline without navigating to edit page
 */

'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Check, X, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InlineEditProps {
  value: string
  onSave: (value: string) => void | Promise<void>
  onCancel?: () => void
  placeholder?: string
  className?: string
  inputClassName?: string
  displayClassName?: string
  type?: 'text' | 'number' | 'date' | 'textarea'
  min?: number
  max?: number
  disabled?: boolean
  validate?: (value: string) => boolean | string
  formatDisplay?: (value: string) => string
}

export function InlineEdit({
  value,
  onSave,
  onCancel,
  placeholder,
  className,
  inputClassName,
  displayClassName,
  type = 'text',
  min,
  max,
  disabled = false,
  validate,
  formatDisplay,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing) {
      if (type === 'textarea') {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      } else {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
  }, [isEditing, type])

  const handleStartEdit = () => {
    if (disabled) return
    setEditValue(value)
    setError(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditValue(value)
    setError(null)
    setIsEditing(false)
    onCancel?.()
  }

  const handleSave = async () => {
    if (disabled || isSaving) return

    // Validation
    if (validate) {
      const validationResult = validate(editValue)
      if (validationResult !== true) {
        setError(typeof validationResult === 'string' ? validationResult : 'Invalid value')
        return
      }
    }

    // Type-specific validation
    if (type === 'number') {
      const numValue = parseFloat(editValue)
      if (isNaN(numValue)) {
        setError('Must be a valid number')
        return
      }
      if (min !== undefined && numValue < min) {
        setError(`Must be at least ${min}`)
        return
      }
      if (max !== undefined && numValue > max) {
        setError(`Must be at most ${max}`)
        return
      }
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && type !== 'textarea') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const displayValue = formatDisplay ? formatDisplay(value) : value

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {type === 'textarea' ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex-1 min-h-[80px] px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
              inputClassName,
              error && 'border-destructive'
            )}
            placeholder={placeholder}
            disabled={isSaving}
          />
        ) : (
          <Input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn('flex-1', inputClassName, error && 'border-destructive')}
            placeholder={placeholder}
            min={min}
            max={max}
            disabled={isSaving}
          />
        )}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        {error && (
          <span className="text-xs text-destructive absolute top-full mt-1">{error}</span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 group cursor-pointer',
        className,
        disabled && 'cursor-not-allowed opacity-50'
      )}
      onClick={handleStartEdit}
    >
      <span className={cn('flex-1', displayClassName)}>
        {displayValue || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
      {!disabled && (
        <Edit2 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  )
}

