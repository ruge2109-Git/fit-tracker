/**
 * Progress Photo Repository
 * Handles database operations for progress photos
 */

import { BaseRepository } from './base.repository'
import { ProgressPhoto, ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'

export interface IProgressPhotoRepository {
  findById(id: string): Promise<ApiResponse<ProgressPhoto>>
  findAll(): Promise<ApiResponse<ProgressPhoto[]>>
  findByUserId(userId: string): Promise<ApiResponse<ProgressPhoto[]>>
  findByType(userId: string, type: string): Promise<ApiResponse<ProgressPhoto[]>>
  findByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<ProgressPhoto[]>>
  create(data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>>
  update(id: string, data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class ProgressPhotoRepository extends BaseRepository<ProgressPhoto> implements IProgressPhotoRepository {
  constructor() {
    super('progress_photos')
  }

  override async findById(id: string): Promise<ApiResponse<ProgressPhoto>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as ProgressPhoto)
    } catch (error) {
      return this.handleError(error)
    }
  }

  override async findAll(): Promise<ApiResponse<ProgressPhoto[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('photo_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse<ProgressPhoto[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('photo_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByType(userId: string, type: string): Promise<ApiResponse<ProgressPhoto[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('photo_type', type)
        .order('photo_date', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<ProgressPhoto[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .gte('photo_date', startDate)
        .lte('photo_date', endDate)
        .order('photo_date', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  override async create(data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(result as ProgressPhoto)
    } catch (error) {
      return this.handleError(error)
    }
  }

  override async update(id: string, data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(result as ProgressPhoto)
    } catch (error) {
      return this.handleError(error)
    }
  }

  override async delete(id: string): Promise<ApiResponse<boolean>> {
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

export const progressPhotoRepository = new ProgressPhotoRepository()

