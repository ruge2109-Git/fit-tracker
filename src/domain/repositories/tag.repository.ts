/**
 * Tag Repository
 * Handles database operations for workout tags
 */

import { BaseRepository } from './base.repository'
import { ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface TagFormData {
  name: string
  color: string
}

export interface ITagRepository {
  findByUserId(userId: string): Promise<ApiResponse<Tag[]>>
  create(userId: string, data: TagFormData): Promise<ApiResponse<Tag>>
  update(id: string, data: Partial<TagFormData>): Promise<ApiResponse<Tag>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class TagRepository extends BaseRepository<Tag> implements ITagRepository {
  constructor() {
    super('tags')
  }

  async findById(id: string): Promise<ApiResponse<Tag>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as Tag)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(): Promise<ApiResponse<Tag[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Tag[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(data: Partial<Tag>): Promise<ApiResponse<Tag>> {
    // This method is not used, use create(userId, data) instead
    throw new Error('Use create(userId, data) instead')
  }

  async update(id: string, data: Partial<Tag>): Promise<ApiResponse<Tag>> {
    // This method is not used, use update(id, data) with TagFormData instead
    throw new Error('Use update(id, data) with TagFormData instead')
  }

  async findByUserId(userId: string): Promise<ApiResponse<Tag[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Tag[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(userId: string, data: TagFormData): Promise<ApiResponse<Tag>> {
    try {
      const { data: tag, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: userId,
          name: data.name,
          color: data.color,
        })
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(tag as Tag)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async update(id: string, data: Partial<TagFormData>): Promise<ApiResponse<Tag>> {
    try {
      const { data: tag, error } = await supabase
        .from(this.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(tag as Tag)
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

export const tagRepository = new TagRepository()

