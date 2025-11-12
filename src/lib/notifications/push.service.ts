/**
 * Push Notification Service
 * Handles Web Push API subscriptions and sending notifications
 */

import { PushSubscriptionData } from '@/types'
import { logger } from '@/lib/logger'

class PushService {
  private vapidPublicKey: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  /**
   * Check if user has granted notification permission
   */
  async hasPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false
    return Notification.permission === 'granted'
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.warn('Notifications not supported', 'PushService')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      logger.warn('Notification permission denied', 'PushService')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  /**
   * Register service worker for push notifications
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Workers not supported', 'PushService')
      return null
    }

    try {
      // Register the push-specific service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/',
      })

      logger.info('Service Worker registered for push', 'PushService')
      return registration
    } catch (error) {
      logger.error('Failed to register service worker', error as Error, 'PushService')
      return null
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported()) {
      logger.warn('Push notifications not supported', 'PushService')
      return null
    }

    if (!this.vapidPublicKey) {
      logger.error('VAPID public key not configured', new Error('Missing VAPID key'), 'PushService')
      return null
    }

    const hasPermission = await this.hasPermission()
    if (!hasPermission) {
      const granted = await this.requestPermission()
      if (!granted) {
        logger.warn('Notification permission not granted', 'PushService')
        return null
      }
    }

    try {
      const registration = await this.registerServiceWorker()
      if (!registration) {
        return null
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      })

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      }

      logger.info('Push subscription created', 'PushService')
      return subscriptionData
    } catch (error) {
      logger.error('Failed to subscribe to push notifications', error as Error, 'PushService')
      return null
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        logger.info('Push subscription removed', 'PushService')
        return true
      }

      return false
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications', error as Error, 'PushService')
      return false
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscriptionData | null> {
    if (!('serviceWorker' in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        return null
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      }
    } catch (error) {
      logger.error('Failed to get push subscription', error as Error, 'PushService')
      return null
    }
  }

  /**
   * Convert VAPID key from base64 URL to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray as BufferSource
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

export const pushService = new PushService()

