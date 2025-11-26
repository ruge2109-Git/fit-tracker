/**
 * Goal Store using Zustand
 * Manages goal state and operations
 */

import { create } from 'zustand'
import { Goal, GoalWithProgress, GoalFormData, GoalProgressFormData } from '@/types'
import { goalService } from '@/domain/services/goal.service'
import { goalNotificationService } from '@/lib/notifications/goal-notification.service'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { toast } from 'sonner'

interface GoalState {
  goals: Goal[]
  activeGoals: Goal[]
  completedGoals: Goal[]
  currentGoal: GoalWithProgress | null
  isLoading: boolean
  error: string | null

  // Actions
  loadGoals: (userId: string) => Promise<void>
  loadActiveGoals: (userId: string) => Promise<void>
  loadCompletedGoals: (userId: string) => Promise<void>
  loadGoal: (id: string) => Promise<void>
  createGoal: (userId: string, data: GoalFormData) => Promise<string | null>
  updateGoal: (id: string, data: Partial<GoalFormData>) => Promise<boolean>
  deleteGoal: (id: string) => Promise<boolean>
  addProgress: (goalId: string, progress: GoalProgressFormData) => Promise<boolean>
  clearError: () => void
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  activeGoals: [],
  completedGoals: [],
  currentGoal: null,
  isLoading: false,
  error: null,

  loadGoals: async (userId) => {
    set({ isLoading: true, error: null })
    const result = await goalService.getUserGoals(userId)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ goals: result.data || [], isLoading: false })
  },

  loadActiveGoals: async (userId) => {
    set({ isLoading: true, error: null })
    const result = await goalService.getActiveGoals(userId)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ activeGoals: result.data || [], isLoading: false })
  },

  loadCompletedGoals: async (userId) => {
    set({ isLoading: true, error: null })
    const result = await goalService.getCompletedGoals(userId)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ completedGoals: result.data || [], isLoading: false })
  },

  loadGoal: async (id) => {
    set({ isLoading: true, error: null })
    const result = await goalService.getGoal(id)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ currentGoal: result.data!, isLoading: false })
  },

  createGoal: async (userId, data) => {
    set({ isLoading: true, error: null })
    const result = await goalService.createGoal(userId, data)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return null
    }

    // Refresh goals list
    await get().loadGoals(userId)
    await get().loadActiveGoals(userId)
    set({ isLoading: false })
    
    // Log create goal event
    if (result.data) {
      logAuditEvent({
        action: 'create_goal',
        entityType: 'goal',
        entityId: result.data.id,
        details: { type: data.type, target_value: data.target_value },
      })
    }
    
    return result.data!.id
  },

  updateGoal: async (id, data) => {
    set({ isLoading: true, error: null })
    const result = await goalService.updateGoal(id, data)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }

    // Update local state
    set((state) => ({
      goals: state.goals.map(g => g.id === id ? { ...g, ...data } : g),
      activeGoals: state.activeGoals.map(g => g.id === id ? { ...g, ...data } : g),
      completedGoals: state.completedGoals.map(g => g.id === id ? { ...g, ...data } : g),
      currentGoal: state.currentGoal?.id === id 
        ? { ...state.currentGoal, ...data } 
        : state.currentGoal,
      isLoading: false,
    }))
    
    // Log update goal event
    logAuditEvent({
      action: 'update_goal',
      entityType: 'goal',
      entityId: id,
      details: { changes: Object.keys(data) },
    })
    
    return true
  },

  deleteGoal: async (id) => {
    set({ isLoading: true, error: null })
    const result = await goalService.deleteGoal(id)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }

    // Remove from local state
    set((state) => ({
      goals: state.goals.filter(g => g.id !== id),
      activeGoals: state.activeGoals.filter(g => g.id !== id),
      completedGoals: state.completedGoals.filter(g => g.id !== id),
      currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
      isLoading: false,
    }))
    
    // Log delete goal event
    logAuditEvent({
      action: 'delete_goal',
      entityType: 'goal',
      entityId: id,
    })
    
    return true
  },

  addProgress: async (goalId, progress) => {
    set({ isLoading: true, error: null })
    const result = await goalService.addProgress(goalId, progress)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }

    // Update local state
    if (result.data) {
      const currentState = get()
      set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? result.data! : g),
        activeGoals: state.activeGoals.map(g => g.id === goalId ? result.data! : g),
        currentGoal: state.currentGoal?.id === goalId ? { ...state.currentGoal, ...result.data } : state.currentGoal,
        isLoading: false,
      }))

      // Check if goal was completed
      const wasCompleted = result.data.is_completed && !currentState.currentGoal?.is_completed
      if (wasCompleted) {
        // Move to completed goals
        await get().loadCompletedGoals(result.data.user_id)
        await get().loadActiveGoals(result.data.user_id)
        
        // Show toast notification
        toast.success('¡Meta completada! 🎉', {
          description: result.data.title,
          duration: 5000,
        })
        
        // Show browser notification if permission is granted (toast already shown above)
        goalNotificationService.showGoalCompletedNotification(result.data, false).catch((error) => {
          // Silently fail - notification shouldn't break progress addition
          console.error('Error showing goal completion notification:', error)
        })
      }
    } else {
      set({ isLoading: false })
    }
    
    // Log add progress event
    logAuditEvent({
      action: 'add_goal_progress',
      entityType: 'goal',
      entityId: goalId,
      details: { value: progress.value },
    })
    
    return true
  },

  clearError: () => set({ error: null }),
}))

