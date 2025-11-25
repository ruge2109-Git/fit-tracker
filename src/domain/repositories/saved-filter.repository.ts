/**
 * Saved Filter Repository
 * Handles database operations for saved filter presets
 */

import { BaseRepository } from './base.repository'
import { ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'

export interface SavedFilter {
  id: string
  user_id: string
  name: string
  type: 'workout' | 'exercise' | 'routine'
  filters: Record<string, any>
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface SavedFilterFormData {
  name: string
  type: 'workout' | 'exercise' | 'routine'
  filters: Record<string, any>
  is_favorite?: boolean
}

export interface ISavedFilterRepository {
  findByUserId(userId: string): Promise<ApiResponse<SavedFilter[]>>
  findByUserIdAndType(userId: string, type: 'workout' | 'exercise' | 'routine'): Promise<ApiResponse<SavedFilter[]>>
  create(userId: string, data: SavedFilterFormData): Promise<ApiResponse<SavedFilter>>
  update(id: string, data: Partial<SavedFilterFormData>): Promise<ApiResponse<SavedFilter>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class SavedFilterRepository extends BaseRepository<SavedFilter> implements ISavedFilterRepository {
  constructor() {
    super('saved_filters')
  }

  async findById(id: string): Promise<ApiResponse<SavedFilter>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as SavedFilter)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(): Promise<ApiResponse<SavedFilter[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as SavedFilter[])
    } catch (error) {
      return this.handleError(error)
    }
  }


  async findByUserId(userId: string): Promise<ApiResponse<SavedFilter[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as SavedFilter[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByUserIdAndType(userId: string, type: 'workout' | 'exercise' | 'routine'): Promise<ApiResponse<SavedFilter[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as SavedFilter[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  // Overload signatures
  async create(data: Partial<SavedFilter>): Promise<ApiResponse<SavedFilter>>
  async create(userId: string, data: SavedFilterFormData): Promise<ApiResponse<SavedFilter>>
  // Implementation
  async create(userIdOrData: string | Partial<SavedFilter>, data?: SavedFilterFormData): Promise<ApiResponse<SavedFilter>> {
    // If called with BaseRepository signature (data only), throw error
    if (typeof userIdOrData !== 'string') {
      throw new Error('Use create(userId, data) instead')
    }
    
    // Called with custom signature (userId, data)
    const userId = userIdOrData
    const formData = data!
    try {
      const { data: filter, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: userId,
          name: formData.name,
          type: formData.type,
          filters: formData.filters,
          is_favorite: formData.is_favorite || false,
        })
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(filter as SavedFilter)
    } catch (error) {
      return this.handleError(error)
    }
  }

  // Overload signatures
  async update(id: string, data: Partial<SavedFilter>): Promise<ApiResponse<SavedFilter>>
  async update(id: string, data: Partial<SavedFilterFormData>): Promise<ApiResponse<SavedFilter>>
  // Implementation
  async update(id: string, data: Partial<SavedFilter> | Partial<SavedFilterFormData>): Promise<ApiResponse<SavedFilter>> {
    try {
      // Check if this is the base repository signature (has user_id, created_at, etc.)
      if ('user_id' in data || 'created_at' in data) {
        throw new Error('Use update(id, data) with SavedFilterFormData instead')
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.filters !== undefined) updateData.filters = data.filters
      if ('is_favorite' in data && data.is_favorite !== undefined) updateData.is_favorite = data.is_favorite

      const { data: filter, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(filter as SavedFilter)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) return this.handleError(error)
      return this.success(true)
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export const savedFilterRepository = new SavedFilterRepository()

