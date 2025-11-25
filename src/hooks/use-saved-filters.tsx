/**
 * Saved Filters Hook
 * Manages saved filter presets for workouts, exercises, and routines
 * Now using database instead of localStorage
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { savedFilterRepository, SavedFilter as DBSavedFilter } from '@/domain/repositories/saved-filter.repository'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

export interface SavedFilter {
  id: string
  name: string
  type: 'workout' | 'exercise' | 'routine'
  filters: Record<string, any>
  createdAt: string
  isFavorite?: boolean
}

export function useSavedFilters() {
  const { user } = useAuthStore()
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load saved filters from database
  useEffect(() => {
    if (user) {
      loadFilters()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const loadFilters = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const result = await savedFilterRepository.findByUserId(user.id)
      if (result.data) {
        setSavedFilters(result.data.map(convertFromDB))
      } else if (result.error) {
        console.error('Error loading saved filters:', result.error)
        toast.error('Error al cargar filtros guardados')
      }
    } catch (error) {
      console.error('Error loading saved filters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Convert DB format to hook format
  const convertFromDB = (dbFilter: DBSavedFilter): SavedFilter => ({
    id: dbFilter.id,
    name: dbFilter.name,
    type: dbFilter.type,
    filters: dbFilter.filters,
    createdAt: dbFilter.created_at,
    isFavorite: dbFilter.is_favorite,
  })

  // Save a new filter preset
  const saveFilter = useCallback(async (filter: Omit<SavedFilter, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error('Debes estar autenticado para guardar filtros')
      return null
    }

    try {
      const result = await savedFilterRepository.create(user.id, {
        name: filter.name,
        type: filter.type,
        filters: filter.filters,
        is_favorite: filter.isFavorite || false,
      })

      if (result.data) {
        const newFilter = convertFromDB(result.data)
        setSavedFilters(prev => [...prev, newFilter])
        toast.success('Filtro guardado exitosamente')
        return newFilter.id
      } else if (result.error) {
        toast.error(result.error)
        return null
      }
      return null
    } catch (error) {
      console.error('Error saving filter:', error)
      toast.error('Error al guardar el filtro')
      return null
    }
  }, [user])

  // Update a saved filter
  const updateFilter = useCallback(async (id: string, updates: Partial<SavedFilter>) => {
    if (!user) return

    try {
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.filters !== undefined) updateData.filters = updates.filters
      if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite

      const result = await savedFilterRepository.update(id, updateData)
      if (result.data) {
        const updated = convertFromDB(result.data)
        setSavedFilters(prev => prev.map(f => f.id === id ? updated : f))
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error updating filter:', error)
      toast.error('Error al actualizar el filtro')
    }
  }, [user])

  // Delete a saved filter
  const deleteFilter = useCallback(async (id: string) => {
    if (!user) return

    try {
      const result = await savedFilterRepository.delete(id)
      if (result.data) {
        setSavedFilters(prev => prev.filter(f => f.id !== id))
        toast.success('Filtro eliminado')
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error deleting filter:', error)
      toast.error('Error al eliminar el filtro')
    }
  }, [user])

  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string) => {
    const currentFilter = savedFilters.find(f => f.id === id)
    if (currentFilter) {
      await updateFilter(id, { isFavorite: !currentFilter.isFavorite })
    }
  }, [savedFilters, updateFilter])

  // Get filters by type
  const getFiltersByType = useCallback((type: 'workout' | 'exercise' | 'routine') => {
    return savedFilters.filter(f => f.type === type)
  }, [savedFilters])

  // Get favorite filters
  const getFavoriteFilters = useCallback(() => {
    return savedFilters.filter(f => f.isFavorite)
  }, [savedFilters])

  return {
    savedFilters,
    isLoading,
    saveFilter,
    updateFilter,
    deleteFilter,
    toggleFavorite,
    getFiltersByType,
    getFavoriteFilters,
    refresh: loadFilters,
  }
}

