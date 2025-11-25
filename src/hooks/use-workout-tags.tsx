/**
 * Workout Tags Hook
 * Manages custom tags/categories for workouts
 * Now using database instead of localStorage
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { tagRepository, Tag as DBTag } from '@/domain/repositories/tag.repository'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export interface WorkoutTag {
  id: string
  name: string
  color: string
  createdAt: string
}

export const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

export function useWorkoutTags() {
  const { user } = useAuthStore()
  const [tags, setTags] = useState<WorkoutTag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load tags from database
  useEffect(() => {
    if (user) {
      loadTags()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const loadTags = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const result = await tagRepository.findByUserId(user.id)
      if (result.data) {
        setTags(result.data.map(convertFromDB))
      } else if (result.error) {
        logger.error('Error loading tags', new Error(result.error), 'useWorkoutTags')
        toast.error('Error al cargar etiquetas')
      }
    } catch (error) {
      logger.error('Error loading tags', error as Error, 'useWorkoutTags')
    } finally {
      setIsLoading(false)
    }
  }

  // Convert DB format to hook format
  const convertFromDB = (dbTag: DBTag): WorkoutTag => ({
    id: dbTag.id,
    name: dbTag.name,
    color: dbTag.color,
    createdAt: dbTag.created_at,
  })

  // Create a new tag
  const createTag = useCallback(async (name: string, color?: string) => {
    if (!user) {
      toast.error('Debes estar autenticado para crear etiquetas')
      return null
    }

    try {
      const result = await tagRepository.create(user.id, {
        name: name.trim(),
        color: color || DEFAULT_COLORS[tags.length % DEFAULT_COLORS.length],
      })

      if (result.data) {
        const newTag = convertFromDB(result.data)
        setTags(prev => [...prev, newTag])
        toast.success('Etiqueta creada exitosamente')
        return newTag.id
      } else if (result.error) {
        toast.error(result.error)
        return null
      }
      return null
    } catch (error) {
      logger.error('Error creating tag', error as Error, 'useWorkoutTags')
      toast.error('Error al crear la etiqueta')
      return null
    }
  }, [user, tags.length])

  // Update a tag
  const updateTag = useCallback(async (id: string, updates: Partial<WorkoutTag>) => {
    if (!user) return

    try {
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.color !== undefined) updateData.color = updates.color

      const result = await tagRepository.update(id, updateData)
      if (result.data) {
        const updated = convertFromDB(result.data)
        setTags(prev => prev.map(t => t.id === id ? updated : t))
        toast.success('Etiqueta actualizada')
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      logger.error('Error updating tag', error as Error, 'useWorkoutTags')
      toast.error('Error al actualizar la etiqueta')
    }
  }, [user])

  // Delete a tag
  const deleteTag = useCallback(async (id: string) => {
    if (!user) return

    try {
      const result = await tagRepository.delete(id)
      if (result.data) {
        setTags(prev => prev.filter(t => t.id !== id))
        toast.success('Etiqueta eliminada')
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      logger.error('Error deleting tag', error as Error, 'useWorkoutTags')
      toast.error('Error al eliminar la etiqueta')
    }
  }, [user])

  // Get tag by ID
  const getTagById = useCallback((id: string) => {
    return tags.find(t => t.id === id)
  }, [tags])

  return {
    tags,
    isLoading,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    defaultColors: DEFAULT_COLORS,
    refresh: loadTags,
  }
}

