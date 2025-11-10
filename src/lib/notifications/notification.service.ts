/**
 * Notification Service
 * Handles browser notifications for scheduled routines
 */

import { Routine, DayOfWeek } from '@/types'
import { DAYS_OF_WEEK_OPTIONS } from '@/lib/constants'
import { logger } from '@/lib/logger'

class NotificationService {
  private permission: NotificationPermission = 'default'
  private scheduledNotifications: Map<string, number> = new Map()

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.warn('This browser does not support notifications', 'NotificationService')
      return false
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted'
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    }

    return false
  }

  async scheduleRoutineNotifications(routines: Routine[]): Promise<void> {
    // Clear existing notifications
    this.clearAllNotifications()

    if (!await this.requestPermission()) {
      return
    }

    for (const routine of routines) {
      if (!routine.is_active || !routine.scheduled_days || routine.scheduled_days.length === 0) {
        continue
      }

      for (const day of routine.scheduled_days) {
        await this.scheduleNotificationForDay(routine, day)
      }
    }
  }

  private async scheduleNotificationForDay(routine: Routine, day: DayOfWeek): Promise<void> {
    const dayIndex = DAYS_OF_WEEK_OPTIONS.findIndex(d => d.value === day)
    if (dayIndex === -1) return

    // Get next occurrence of this day
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const targetDay = dayIndex === 0 ? 0 : dayIndex // Convert to JS day format

    let daysUntil = targetDay - currentDay
    if (daysUntil < 0) {
      daysUntil += 7 // Next week
    }
    if (daysUntil === 0 && today.getHours() >= 8) {
      daysUntil = 7 // If it's today but past 8 AM, schedule for next week
    }

    const notificationDate = new Date(today)
    notificationDate.setDate(today.getDate() + daysUntil)
    notificationDate.setHours(8, 0, 0, 0) // 8 AM

    const timeUntil = notificationDate.getTime() - Date.now()

    if (timeUntil > 0 && timeUntil < 7 * 24 * 60 * 60 * 1000) { // Within 7 days
      const timeoutId = window.setTimeout(() => {
        this.showNotification(routine)
        // Schedule next week's notification
        this.scheduleNotificationForDay(routine, day)
      }, timeUntil)

      const key = `${routine.id}-${day}`
      this.scheduledNotifications.set(key, timeoutId)
    }
  }

  private showNotification(routine: Routine): void {
    if (this.permission !== 'granted') return

    new Notification('FitTrackr - Workout Reminder', {
      body: `Time for your routine: ${routine.name}`,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-96x96.svg',
      tag: `routine-${routine.id}`,
      requireInteraction: false,
    })
  }

  clearAllNotifications(): void {
    for (const timeoutId of this.scheduledNotifications.values()) {
      clearTimeout(timeoutId)
    }
    this.scheduledNotifications.clear()
  }

  clearRoutineNotifications(routineId: string): void {
    for (const [key, timeoutId] of this.scheduledNotifications.entries()) {
      if (key.startsWith(`${routineId}-`)) {
        clearTimeout(timeoutId)
        this.scheduledNotifications.delete(key)
      }
    }
  }

  async showTestNotification(): Promise<void> {
    if (await this.requestPermission()) {
      new Notification('FitTrackr', {
        body: 'Notifications are working!',
        icon: '/icons/icon-192x192.png',
      })
    }
  }
}

export const notificationService = new NotificationService()

