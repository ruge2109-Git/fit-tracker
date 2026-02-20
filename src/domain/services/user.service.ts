/**
 * User Service
 * Handles user profile operations in the public schema
 */

import { supabase } from '@/lib/supabase/client'
import { User, ApiResponse } from '@/types'

export interface IUserService {
  updateProfile(userId: string, updates: Partial<User>): Promise<ApiResponse<User>>
  getProfile(userId: string): Promise<ApiResponse<User>>
}

class UserService implements IUserService {
  async updateProfile(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getProfile(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { error: error.message }
    }
  }
}

export const userService = new UserService()
