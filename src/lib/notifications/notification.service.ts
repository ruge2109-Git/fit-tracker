/**
 * Notification Service
 * Handles browser notifications for scheduled routines
 * Uses localStorage to persist notifications when app is closed
 * Integrates with Push Notifications for better reliability
 */

import { Routine, DayOfWeek } from '@/types'
import { DAYS_OF_WEEK_OPTIONS } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { pushService } from './push.service'

interface ScheduledNotification {
  routineId: string
  routineName: string
  day: DayOfWeek
  timestamp: number
  key: string
}

const STORAGE_KEY = 'scheduled-notifications'
const CHECK_INTERVAL = 60 * 1000 // Check every minute

class NotificationService {
  private permission: NotificationPermission = 'default'
  private scheduledNotifications: Map<string, number> = new Map()
  private checkInterval: number | null = null

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

    // Try to subscribe to push notifications if supported
    if (pushService.isSupported()) {
      const subscription = await pushService.subscribe()
      if (subscription) {
        // Save subscription to backend
        try {
          const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          })
          if (response.ok) {
            logger.info('Push subscription saved to backend', 'NotificationService')
          }
        } catch (error) {
          logger.error('Failed to save push subscription', error as Error, 'NotificationService')
        }
      }
    }

    const scheduled: ScheduledNotification[] = []

    for (const routine of routines) {
      if (!routine.is_active || !routine.scheduled_days || routine.scheduled_days.length === 0) {
        continue
      }

      for (const day of routine.scheduled_days) {
        const notification = await this.scheduleNotificationForDay(routine, day)
        if (notification) {
          scheduled.push(notification)
        }
      }
    }

    // Save to localStorage for persistence (fallback)
    this.saveScheduledNotifications(scheduled)

    // Start checking for due notifications (fallback for when push is not available)
    this.startNotificationChecker()
  }

  private async scheduleNotificationForDay(routine: Routine, day: DayOfWeek): Promise<ScheduledNotification | null> {
    const dayIndex = DAYS_OF_WEEK_OPTIONS.findIndex(d => d.value === day)
    if (dayIndex === -1) return null

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
      const key = `${routine.id}-${day}`
      const timestamp = notificationDate.getTime()

      // Schedule immediate notification if page is open
      const timeoutId = window.setTimeout(() => {
        this.showNotification(routine)
        // Schedule next week's notification
        this.scheduleNotificationForDay(routine, day)
      }, timeUntil)

      this.scheduledNotifications.set(key, timeoutId)

      return {
        routineId: routine.id,
        routineName: routine.name,
        day,
        timestamp,
        key,
      }
    }

    return null
  }

  private saveScheduledNotifications(notifications: ScheduledNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch (error) {
      logger.error('Failed to save scheduled notifications', error as Error, 'NotificationService')
    }
  }

  private loadScheduledNotifications(): ScheduledNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as ScheduledNotification[]
      }
    } catch (error) {
      logger.error('Failed to load scheduled notifications', error as Error, 'NotificationService')
    }
    return []
  }

  private startNotificationChecker(): void {
    // Clear existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    // Check immediately
    this.checkScheduledNotifications()

    // Then check periodically
    this.checkInterval = window.setInterval(() => {
      this.checkScheduledNotifications()
    }, CHECK_INTERVAL)
  }

  private checkScheduledNotifications(): void {
    if (this.permission !== 'granted') return

    const scheduled = this.loadScheduledNotifications()
    const now = Date.now()
    const toRemove: string[] = []
    const toReschedule: ScheduledNotification[] = []

    for (const notification of scheduled) {
      // Check if notification is due (within 1 minute window)
      const timeUntil = notification.timestamp - now
      
      if (timeUntil <= CHECK_INTERVAL && timeUntil >= -CHECK_INTERVAL) {
        // Notification is due
        this.showNotification({
          id: notification.routineId,
          name: notification.routineName,
        } as Routine)

        // Schedule next week's notification
        const nextWeek = new Date(notification.timestamp)
        nextWeek.setDate(nextWeek.getDate() + 7)
        
        toReschedule.push({
          ...notification,
          timestamp: nextWeek.getTime(),
        })

        toRemove.push(notification.key)
      } else if (timeUntil < -CHECK_INTERVAL) {
        // Notification is past due, remove it
        toRemove.push(notification.key)
      }
    }

    // Update stored notifications
    if (toRemove.length > 0 || toReschedule.length > 0) {
      const updated = scheduled
        .filter(n => !toRemove.includes(n.key))
        .concat(toReschedule)
      
      this.saveScheduledNotifications(updated)
    }
  }

  clearAllNotifications(): void {
    // Clear timeouts
    for (const timeoutId of this.scheduledNotifications.values()) {
      clearTimeout(timeoutId)
    }
    this.scheduledNotifications.clear()

    // Clear stored notifications
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      logger.error('Failed to clear scheduled notifications', error as Error, 'NotificationService')
    }

    // Clear interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  clearRoutineNotifications(routineId: string): void {
    // Clear timeouts
    for (const [key, timeoutId] of this.scheduledNotifications.entries()) {
      if (key.startsWith(`${routineId}-`)) {
        clearTimeout(timeoutId)
        this.scheduledNotifications.delete(key)
      }
    }

    // Clear from storage
    const scheduled = this.loadScheduledNotifications()
    const updated = scheduled.filter(n => !n.key.startsWith(`${routineId}-`))
    this.saveScheduledNotifications(updated)
  }

  async showTestNotification(): Promise<void> {
    if (!await this.requestPermission()) {
      logger.warn('Notification permission not granted', 'NotificationService')
      return
    }

    const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
      body: 'Notifications are working!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'test-notification',
      requireInteraction: false,
      vibrate: this.isMobile() ? [200, 100, 200] : undefined,
      silent: false,
    }

    // Try to use Service Worker first (better for PWA)
    if ('serviceWorker' in navigator) {
      try {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready
        
        // Check if service worker is active
        if (!registration.active) {
          logger.warn('Service Worker is not active, waiting...', 'NotificationService')
          // Wait a bit more for service worker to activate
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        if (!registration.active) {
          logger.warn('Service Worker still not active after wait, using fallback', 'NotificationService')
        } else {
          logger.info('Showing notification via Service Worker', 'NotificationService')
          await registration.showNotification('FitTrackr', notificationOptions)
          logger.info('Test notification shown successfully via Service Worker', 'NotificationService')
          
          // Give it a moment to ensure it's displayed
          await new Promise(resolve => setTimeout(resolve, 100))
          return
        }
      } catch (error) {
        logger.error('Failed to show notification via Service Worker', error as Error, 'NotificationService')
        // Continue to fallback
      }
    }

    // Fallback to regular Notification API
    try {
      logger.info('Using Notification API fallback', 'NotificationService')
      const notification = new Notification('FitTrackr', notificationOptions)
      logger.info('Test notification created via Notification API', 'NotificationService')
      
      // Handle notification events
      notification.onshow = () => {
        logger.info('Test notification displayed', 'NotificationService')
      }
      
      notification.onclick = () => {
        logger.info('Test notification clicked', 'NotificationService')
        notification.close()
      }
      
      notification.onerror = (event) => {
        logger.error('Test notification error', new Error('Notification error event'), 'NotificationService')
      }
      
      notification.onclose = () => {
        logger.info('Test notification closed by user', 'NotificationService')
      }
    } catch (error) {
      logger.error('Failed to show test notification', error as Error, 'NotificationService')
      throw error
    }
  }

  // Check if running on mobile device
  private isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Check if running on iOS
  private isIOS(): boolean {
    if (typeof window === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  }

  // Check if app is installed as PWA
  private isPWAInstalled(): boolean {
    if (typeof window === 'undefined') return false
    // Check if running in standalone mode (installed PWA)
    return (window.matchMedia('(display-mode: standalone)').matches) ||
           ((window.navigator as any).standalone === true) ||
           document.referrer.includes('android-app://')
  }

  // Initialize on page load to check for missed notifications
  initialize(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission
      if (this.permission === 'granted') {
        this.startNotificationChecker()
        
        // For mobile devices, also listen to visibility changes
        if (this.isMobile()) {
          this.setupMobileListeners()
        }
      }
    }
  }

  private setupMobileListeners(): void {
    // Listen to page visibility changes (when app goes to background/foreground)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // App came to foreground, check for missed notifications
        this.checkScheduledNotifications()
      }
    })

    // Listen to page focus (when user switches back to the app)
    window.addEventListener('focus', () => {
      this.checkScheduledNotifications()
    })

    // For iOS, also listen to page show event (when app is reopened)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        // Page was loaded from cache (back/forward navigation)
        this.checkScheduledNotifications()
      }
    })
  }

  // Enhanced notification showing for mobile
  private showNotification(routine: Routine): void {
    if (this.permission !== 'granted') return

    const notificationOptions = {
      body: `Time for your routine: ${routine.name}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: `routine-${routine.id}`,
      requireInteraction: false,
      // Add vibration for mobile devices
      vibrate: this.isMobile() ? [200, 100, 200] : undefined,
      // Add sound (if supported)
      silent: false,
    }

    // Use Service Worker if available (better for mobile/PWA)
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('FitTrackr - Workout Reminder', notificationOptions)
      }).catch(() => {
        // Fallback to regular Notification API
        this.showRegularNotification(routine, notificationOptions)
      })
    } else {
      this.showRegularNotification(routine, notificationOptions)
    }
  }

  private showRegularNotification(routine: Routine, options?: NotificationOptions): void {
    const defaultOptions = {
      body: `Time for your routine: ${routine.name}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: `routine-${routine.id}`,
      requireInteraction: false,
      ...options,
    }

    new Notification('FitTrackr - Workout Reminder', defaultOptions)
  }
}

export const notificationService = new NotificationService()

// Initialize when module loads
if (typeof window !== 'undefined') {
  notificationService.initialize()
}

