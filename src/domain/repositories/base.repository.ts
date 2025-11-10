/**
 * Base Repository Interface
 * Following Interface Segregation and Dependency Inversion principles
 * All repositories extend this base interface for consistency
 */

import { ApiResponse } from '@/types'
import { logger } from '@/lib/logger'

export interface IBaseRepository<T> {
  findById(id: string): Promise<ApiResponse<T>>
  findAll(): Promise<ApiResponse<T[]>>
  create(data: Partial<T>): Promise<ApiResponse<T>>
  update(id: string, data: Partial<T>): Promise<ApiResponse<T>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

/**
 * Abstract base repository implementation
 * Provides common functionality for all repositories
 */
export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  abstract findById(id: string): Promise<ApiResponse<T>>
  abstract findAll(): Promise<ApiResponse<T[]>>
  abstract create(data: Partial<T>): Promise<ApiResponse<T>>
  abstract update(id: string, data: Partial<T>): Promise<ApiResponse<T>>
  abstract delete(id: string): Promise<ApiResponse<boolean>>

  /**
   * Helper to handle Supabase errors consistently
   */
  protected handleError(error: any): ApiResponse<never> {
    logger.error(`Repository error in ${this.tableName}`, error as Error, 'BaseRepository')
    return {
      error: error.message || 'An unexpected error occurred',
    }
  }

  /**
   * Helper to return successful responses
   */
  protected success<D>(data: D): ApiResponse<D> {
    return { data }
  }
}

