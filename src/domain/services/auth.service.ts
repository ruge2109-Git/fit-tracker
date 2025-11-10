/**
 * Authentication Service
 * Handles user authentication operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/lib/supabase/client'
import { User, ApiResponse } from '@/types'

export interface IAuthService {
  signUp(email: string, password: string, name: string): Promise<ApiResponse<User>>
  signIn(email: string, password: string): Promise<ApiResponse<User>>
  signOut(): Promise<ApiResponse<boolean>>
  getCurrentUser(): Promise<ApiResponse<User | null>>
  signInWithGoogle(): Promise<ApiResponse<void>>
  resetPasswordRequest(email: string): Promise<ApiResponse<void>>
  resetPassword(newPassword: string): Promise<ApiResponse<void>>
}

class AuthService implements IAuthService {
  async signUp(email: string, password: string, name: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) throw error
      if (!data.user) throw new Error('No user returned')

      return {
        data: {
          id: data.user.id,
          email: data.user.email!,
          name: name,
          created_at: data.user.created_at,
        },
      }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async signIn(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      if (!data.user) throw new Error('No user returned')

      return {
        data: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata.name || '',
          created_at: data.user.created_at,
        },
      }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async signOut(): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { data: true }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) throw error
      if (!user) return { data: null }

      return {
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata.name || '',
          created_at: user.created_at,
        },
      }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async signInWithGoogle(): Promise<ApiResponse<void>> {
    try {
      // Get current locale from URL or use default
      const pathname = window.location.pathname
      const locale = pathname.split('/')[1] || 'en'
      const redirectUrl = `${window.location.origin}/${locale}/auth/callback`
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) throw error
      return { data: undefined }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async resetPasswordRequest(email: string): Promise<ApiResponse<void>> {
    try {
      // Get current locale from URL or use default
      const pathname = window.location.pathname
      const locale = pathname.split('/')[1] || 'en'
      const redirectUrl = `${window.location.origin}/${locale}/auth/reset-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error
      return { data: undefined }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async resetPassword(newPassword: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
      return { data: undefined }
    } catch (error: any) {
      return { error: error.message }
    }
  }
}

export const authService = new AuthService()

