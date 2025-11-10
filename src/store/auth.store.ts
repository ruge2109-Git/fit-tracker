/**
 * Auth Store using Zustand
 * Manages authentication state
 * Following Observer Pattern and Single Responsibility Principle
 */

import { create } from 'zustand'
import { User } from '@/types'
import { authService } from '@/domain/services/auth.service'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
  loadUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isLoading: false }),

  signIn: async (email, password) => {
    set({ isLoading: true, error: null })
    const result = await authService.signIn(email, password)
    
    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }
    
    set({ user: result.data!, isLoading: false })
    return true
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null })
    const result = await authService.signUp(email, password, name)
    
    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }
    
    set({ user: result.data!, isLoading: false })
    return true
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null })
    const result = await authService.signInWithGoogle()
    
    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }
    
    // OAuth redirects to callback, so we don't set user here
    // The callback will handle the redirect
    return true
  },

  signOut: async () => {
    set({ isLoading: true })
    await authService.signOut()
    set({ user: null, isLoading: false })
  },

  loadUser: async () => {
    set({ isLoading: true })
    const result = await authService.getCurrentUser()
    
    if (result.error) {
      set({ user: null, isLoading: false })
      return
    }
    
    set({ user: result.data, isLoading: false })
  },

  clearError: () => set({ error: null }),
}))

