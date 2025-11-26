/**
 * Goal Notification Service
 * Handles notifications when goals are completed
 */

import { Goal } from '@/types'
import { notificationService } from './notification.service'
import { logger } from '@/lib/logger'

class GoalNotificationService {
  /**
   * Show notification when a goal is completed
   * @param goal - The completed goal
   * @param showToast - Whether to show toast notification (default: true)
   */
  async showGoalCompletedNotification(goal: Goal, showToast: boolean = true): Promise<void> {
    try {
      // Show toast notification if requested
      if (showToast && typeof window !== 'undefined') {
        // Import toast dynamically to avoid SSR issues
        const { toast } = await import('sonner')
        toast.success('¡Meta completada! 🎉', {
          description: goal.title,
          duration: 5000,
        })
      }

      // Show browser notification if permission is granted
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          await this.showBrowserNotification(goal)
        }
      }
    } catch (error) {
      logger.error('Error showing goal completion notification', error as Error, 'GoalNotificationService')
    }
  }

  /**
   * Show browser notification for completed goal
   */
  private async showBrowserNotification(goal: Goal): Promise<void> {
    // Use translations if available, fallback to Spanish
    const title = '¡Meta Completada! 🎉'
    const body = `Has alcanzado tu meta: ${goal.title}`
    
    const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: `goal-completed-${goal.id}`,
      requireInteraction: false,
      silent: false,
      data: {
        goalId: goal.id,
        url: `/goals/${goal.id}`,
      },
    }
    
    // Add vibrate if supported (mobile)
    if ('vibrate' in navigator) {
      notificationOptions.vibrate = [200, 100, 200]
    }

    // Use Service Worker if available (better for PWA)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(title, notificationOptions)
      } catch (error) {
        // Fallback to regular Notification API
        new Notification(title, notificationOptions)
      }
    } else {
      new Notification(title, notificationOptions)
    }
  }

  /**
   * Request notification permission if not already granted
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }
}

export const goalNotificationService = new GoalNotificationService()

