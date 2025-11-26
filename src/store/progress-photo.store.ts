/**
 * Progress Photo Store using Zustand
 * Manages progress photo state and operations
 */

import { create } from 'zustand'
import { ProgressPhoto, ProgressPhotoFormData } from '@/types'
import { progressPhotoService } from '@/domain/services/progress-photo.service'
import { logAuditEvent } from '@/lib/audit/audit-helper'

interface ProgressPhotoState {
  photos: ProgressPhoto[]
  isLoading: boolean
  error: string | null
  loadPhotos: (userId: string) => Promise<void>
  loadPhotosByType: (userId: string, type: string) => Promise<ProgressPhoto[]>
  createPhoto: (userId: string, data: ProgressPhotoFormData) => Promise<string | null>
  updatePhoto: (id: string, data: Partial<ProgressPhoto>) => Promise<boolean>
  deletePhoto: (id: string) => Promise<boolean>
  clearError: () => void
}

export const useProgressPhotoStore = create<ProgressPhotoState>((set, get) => ({
  photos: [],
  isLoading: false,
  error: null,

  loadPhotos: async (userId) => {
    set({ isLoading: true, error: null })
    const result = await progressPhotoService.getUserPhotos(userId)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ photos: result.data || [], isLoading: false })
  },

  loadPhotosByType: async (userId, type) => {
    const result = await progressPhotoService.getPhotosByType(userId, type)
    return result.data || []
  },

  createPhoto: async (userId, data) => {
    set({ isLoading: true, error: null })
    const result = await progressPhotoService.createPhoto(userId, data)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return null
    }

    // Refresh photos list
    await get().loadPhotos(userId)
    set({ isLoading: false })
    
    // Log create photo event
    if (result.data) {
      logAuditEvent({
        action: 'create_progress_photo',
        entityType: 'progress_photo',
        entityId: result.data.id,
        details: { type: data.photo_type, date: data.photo_date },
      })
    }
    
    return result.data!.id
  },

  updatePhoto: async (id, data) => {
    set({ isLoading: true, error: null })
    const result = await progressPhotoService.updatePhoto(id, data)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }

    // Update local state
    set((state) => ({
      photos: state.photos.map(p => p.id === id ? { ...p, ...data } : p),
      isLoading: false,
    }))
    
    // Log update photo event
    logAuditEvent({
      action: 'update_progress_photo',
      entityType: 'progress_photo',
      entityId: id,
      details: { changes: Object.keys(data) },
    })
    
    return true
  },

  deletePhoto: async (id) => {
    set({ isLoading: true, error: null })
    const result = await progressPhotoService.deletePhoto(id)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }

    // Update local state
    set((state) => ({
      photos: state.photos.filter(p => p.id !== id),
      isLoading: false,
    }))
    
    // Log delete photo event
    logAuditEvent({
      action: 'delete_progress_photo',
      entityType: 'progress_photo',
      entityId: id,
    })
    
    return true
  },

  clearError: () => set({ error: null }),
}))

