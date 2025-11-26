/**
 * Progress Photo Service
 * Business logic layer for progress photo operations
 * Handles file uploads to Supabase Storage
 */

import { progressPhotoRepository } from '../repositories/progress-photo.repository'
import { ProgressPhoto, ProgressPhotoFormData, ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'

export interface IProgressPhotoService {
  getPhoto(id: string): Promise<ApiResponse<ProgressPhoto>>
  getUserPhotos(userId: string): Promise<ApiResponse<ProgressPhoto[]>>
  getPhotosByType(userId: string, type: string): Promise<ApiResponse<ProgressPhoto[]>>
  getPhotosByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<ProgressPhoto[]>>
  createPhoto(userId: string, data: ProgressPhotoFormData): Promise<ApiResponse<ProgressPhoto>>
  updatePhoto(id: string, data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>>
  deletePhoto(id: string): Promise<ApiResponse<boolean>>
}

class ProgressPhotoService implements IProgressPhotoService {
  private readonly STORAGE_BUCKET = 'progress-photos'
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  /**
   * Upload photo to Supabase Storage
   */
  private async uploadPhoto(userId: string, file: File): Promise<string> {
    // Validate file
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit')
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed')
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`)
    }

    // Store the path in the database
    // We'll generate signed URLs in the frontend when displaying images
    // This allows us to refresh URLs when they expire
    return data.path
  }

  /**
   * Delete photo from Supabase Storage
   */
  private async deletePhotoFromStorage(photoUrl: string): Promise<void> {
    try {
      // photoUrl is the path stored in the database (format: userId/timestamp-random.ext)
      // If it's a full URL, extract the path
      let filePath = photoUrl
      if (photoUrl.includes('/storage/v1/object/')) {
        // Extract path from full URL
        const urlParts = photoUrl.split('/storage/v1/object/')
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split('/')
          filePath = pathParts.slice(1).join('/') // Remove bucket name
        }
      }

      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([filePath])

      if (error) {
        console.warn(`Failed to delete photo from storage: ${error.message}`)
        // Don't throw - we still want to delete the database record
      }
    } catch (error) {
      console.warn(`Error deleting photo from storage:`, error)
      // Don't throw - we still want to delete the database record
    }
  }

  async getPhoto(id: string): Promise<ApiResponse<ProgressPhoto>> {
    return await progressPhotoRepository.findById(id)
  }

  async getUserPhotos(userId: string): Promise<ApiResponse<ProgressPhoto[]>> {
    return await progressPhotoRepository.findByUserId(userId)
  }

  async getPhotosByType(userId: string, type: string): Promise<ApiResponse<ProgressPhoto[]>> {
    return await progressPhotoRepository.findByType(userId, type)
  }

  async getPhotosByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<ProgressPhoto[]>> {
    return await progressPhotoRepository.findByDateRange(userId, startDate, endDate)
  }

  async createPhoto(userId: string, data: ProgressPhotoFormData): Promise<ApiResponse<ProgressPhoto>> {
    try {
      // Upload photo to storage
      const photoUrl = await this.uploadPhoto(userId, data.photo)

      // Create database record
      const normalizedData: Partial<ProgressPhoto> = {
        user_id: userId,
        photo_url: photoUrl,
        photo_type: data.photo_type,
        notes: data.notes && data.notes.trim() !== '' ? data.notes : undefined,
        photo_date: data.photo_date || new Date().toISOString().split('T')[0],
      }

      return await progressPhotoRepository.create(normalizedData)
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create photo',
      }
    }
  }

  async updatePhoto(id: string, data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>> {
    // Normalize optional fields
    const normalizedData: Partial<ProgressPhoto> = { ...data }
    
    if ('notes' in normalizedData && normalizedData.notes === '') {
      normalizedData.notes = undefined
    }

    return await progressPhotoRepository.update(id, normalizedData)
  }

  async deletePhoto(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Get photo to delete file from storage
      const photoResult = await progressPhotoRepository.findById(id)
      if (photoResult.data) {
        await this.deletePhotoFromStorage(photoResult.data.photo_url)
      }

      // Delete database record
      return await progressPhotoRepository.delete(id)
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to delete photo',
      }
    }
  }
}

export const progressPhotoService = new ProgressPhotoService()

