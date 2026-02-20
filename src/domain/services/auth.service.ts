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

      // Wait a moment for the trigger to create the public.users row, then fetch
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      return {
        data: {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || name,
          created_at: data.user.created_at,
          is_public: profile?.is_public ?? false,
          nickname: profile?.nickname || undefined,
          is_admin: profile?.is_admin ?? false,
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

      // Fetch full profile from public.users (includes is_public, nickname, etc.)
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      return {
        data: {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || data.user.user_metadata.name || '',
          created_at: data.user.created_at,
          is_public: profile?.is_public ?? false,
          nickname: profile?.nickname || undefined,
          is_admin: profile?.is_admin ?? false,
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

      // Fetch full profile from public.users (includes is_public, nickname, etc.)
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      return {
        data: {
          id: user.id,
          email: user.email!,
          name: profile?.name || user.user_metadata.name || '',
          created_at: user.created_at,
          is_public: profile?.is_public ?? false,
          nickname: profile?.nickname || undefined,
          is_admin: profile?.is_admin ?? false,
        },
      }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async signInWithGoogle(): Promise<ApiResponse<void>> {
    try {
      // Use callback URL without locale to simplify Supabase configuration
      // The callback route will handle locale detection and redirect appropriately
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectUrl = `${baseUrl}/auth/callback`
      
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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectUrl = `${baseUrl}/${locale}/auth/reset-password`
      
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

