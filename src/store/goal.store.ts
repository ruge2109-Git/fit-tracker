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
import { logger } from '@/lib/logger'

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
    const snapshot = get()
    set({ isLoading: true, error: null })

    // Optimistic update
    set((state) => ({
      goals: state.goals.map(g => g.id === id ? { ...g, ...data } : g),
      activeGoals: state.activeGoals.map(g => g.id === id ? { ...g, ...data } : g),
      completedGoals: state.completedGoals.map(g => g.id === id ? { ...g, ...data } : g),
      currentGoal: state.currentGoal?.id === id 
        ? { ...state.currentGoal, ...data } 
        : state.currentGoal,
    }))

    const result = await goalService.updateGoal(id, data)

    if (result.error) {
      set({
        goals: snapshot.goals,
        activeGoals: snapshot.activeGoals,
        completedGoals: snapshot.completedGoals,
        currentGoal: snapshot.currentGoal,
        isLoading: false,
        error: result.error,
      })
      return false
    }

    set({ isLoading: false })
    
    logAuditEvent({
      action: 'update_goal',
      entityType: 'goal',
      entityId: id,
      details: { changes: Object.keys(data) },
    })
    
    return true
  },

  deleteGoal: async (id) => {
    const snapshot = get()
    set({ isLoading: true, error: null })

    // Optimistic update
    set((state) => ({
      goals: state.goals.filter(g => g.id !== id),
      activeGoals: state.activeGoals.filter(g => g.id !== id),
      completedGoals: state.completedGoals.filter(g => g.id !== id),
      currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
    }))

    const result = await goalService.deleteGoal(id)

    if (result.error) {
      set({
        goals: snapshot.goals,
        activeGoals: snapshot.activeGoals,
        completedGoals: snapshot.completedGoals,
        currentGoal: snapshot.currentGoal,
        isLoading: false,
        error: result.error,
      })
      return false
    }

    set({ isLoading: false })
    
    logAuditEvent({
      action: 'delete_goal',
      entityType: 'goal',
      entityId: id,
    })
    
    return true
  },

  addProgress: async (goalId, progress) => {
    const snapshot = get()
    set({ isLoading: true, error: null })

    // Optimistic update — increment current_value immediately
    const optimistically = (state: GoalState) => ({
      goals: state.goals.map(g =>
        g.id === goalId ? { ...g, current_value: g.current_value + progress.value } : g
      ),
      activeGoals: state.activeGoals.map(g =>
        g.id === goalId ? { ...g, current_value: g.current_value + progress.value } : g
      ),
      completedGoals: state.completedGoals,
      currentGoal: state.currentGoal?.id === goalId
        ? { ...state.currentGoal, current_value: state.currentGoal.current_value + progress.value }
        : state.currentGoal,
    })

    set(optimistically)

    const result = await goalService.addProgress(goalId, progress)

    if (result.error) {
      set({
        goals: snapshot.goals,
        activeGoals: snapshot.activeGoals,
        completedGoals: snapshot.completedGoals,
        currentGoal: snapshot.currentGoal,
        isLoading: false,
        error: result.error,
      })
      return false
    }

    // Update local state with server response
    if (result.data) {
      set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? result.data! : g),
        activeGoals: state.activeGoals.map(g => g.id === goalId ? result.data! : g),
        currentGoal: state.currentGoal?.id === goalId ? { ...state.currentGoal, ...result.data } : state.currentGoal,
        isLoading: false,
      }))

      const wasCompleted = result.data.is_completed && !snapshot.currentGoal?.is_completed
      if (wasCompleted) {
        await get().loadCompletedGoals(result.data.user_id)
        await get().loadActiveGoals(result.data.user_id)

        toast.success('¡Meta completada! 🎉', {
          description: result.data.title,
          duration: 5000,
        })

        goalNotificationService.showGoalCompletedNotification(result.data, false).catch((error) => {
          logger.error('Error showing goal completion notification', error as Error, 'GoalStore')
        })
      }
    } else {
      set({ isLoading: false })
    }

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

