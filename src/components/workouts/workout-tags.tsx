/**
 * Workout Tags Component
 * Displays and manages tags for workouts
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useWorkoutTags, WorkoutTag, DEFAULT_COLORS } from '@/hooks/use-workout-tags'
import { workoutTagRepository } from '@/domain/repositories/workout-tag.repository'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface WorkoutTagsProps {
  workoutId: string
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
  className?: string
}

export function WorkoutTags({ workoutId, selectedTagIds, onTagsChange, className }: WorkoutTagsProps) {
  const t = useTranslations('common')
  const { user } = useAuthStore()
  const { tags, createTag, deleteTag, getTagById, isLoading } = useWorkoutTags()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Load saved tags for this workout from database
  const loadWorkoutTags = async () => {
    if (!user) return
    try {
      const result = await workoutTagRepository.findByWorkoutId(workoutId)
      if (result.data) {
        const tagIds = result.data.map(wt => wt.tag_id)
        onTagsChange(tagIds)
      } else if (result.error) {
        console.error('Error loading workout tags:', result.error)
      }
    } catch (error) {
      console.error('Error loading workout tags:', error)
    }
  }

  useEffect(() => {
    if (workoutId && user) {
      loadWorkoutTags()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId, user])

  // Save tags for this workout to database
  const saveWorkoutTags = async (tagIds: string[]) => {
    if (!user) return
    setIsSaving(true)
    try {
      const result = await workoutTagRepository.setWorkoutTags(workoutId, tagIds)
      if (result.error) {
        toast.error('Error al guardar etiquetas')
      }
    } catch (error) {
      console.error('Error saving workout tags:', error)
      toast.error('Error al guardar etiquetas')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    const tagId = await createTag(newTagName, newTagColor || undefined)
    if (tagId) {
      const updated = [...selectedTagIds, tagId]
      onTagsChange(updated)
      await saveWorkoutTags(updated)
      setNewTagName('')
      setNewTagColor('')
      setCreateDialogOpen(false)
    }
  }

  const handleToggleTag = async (tagId: string) => {
    const updated = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId]
    onTagsChange(updated)
    await saveWorkoutTags(updated)
  }

  const handleRemoveTag = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = selectedTagIds.filter(id => id !== tagId)
    onTagsChange(updated)
    await saveWorkoutTags(updated)
  }

  const selectedTags = selectedTagIds.map(id => getTagById(id)).filter(Boolean) as WorkoutTag[]

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color, color: 'white' }}
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => handleToggleTag(tag.id)}
          >
            <Tag className="h-3 w-3" />
            {tag.name}
            <X
              className="h-3 w-3 ml-1 hover:bg-white/20 rounded"
              onClick={(e) => handleRemoveTag(tag.id, e)}
            />
          </Badge>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              {t('addTag') || 'Add Tag'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <Label>{t('selectTags') || 'Select Tags'}</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted',
                      selectedTagIds.includes(tag.id) && 'bg-muted'
                    )}
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                    {selectedTagIds.includes(tag.id) && (
                      <X className="h-4 w-4" />
                    )}
                  </div>
                ))}
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createNewTag') || 'Create New Tag'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('createNewTag') || 'Create New Tag'}</DialogTitle>
                    <DialogDescription>
                      {t('createTagDescription') || 'Create a custom tag for your workouts'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tag-name">{t('tagName') || 'Tag Name'}</Label>
                      <Input
                        id="tag-name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder={t('tagNamePlaceholder') || 'e.g., Cardio, Strength, Recovery'}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateTag()
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('tagColor') || 'Color'}</Label>
                      <div className="flex gap-2 flex-wrap">
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              'w-8 h-8 rounded-full border-2 transition-all',
                              newTagColor === color ? 'border-foreground scale-110' : 'border-transparent'
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewTagColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        {t('cancel')}
                      </Button>
                      <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                        {t('create')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

