/**
 * Shared browser notification permission + Web Push subscription + backend registration.
 * Used by profile notification settings and onboarding.
 */

import { logger } from '@/lib/logger'
import { notificationService } from '@/lib/notifications/notification.service'
import { pushService } from '@/lib/notifications/push.service'

export interface NotificationPushSetupResult {
  permission: NotificationPermission
  granted: boolean
  pushSubscribed: boolean
}

/**
 * Registers the current Web Push subscription with the backend (session cookie auth).
 */
export async function subscribePushAndRegister(): Promise<boolean> {
  if (!pushService.isSupported()) return false
  try {
    const subscription = await pushService.subscribe()
    if (!subscription) return false
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      logger.warn(`Push subscribe API failed: ${JSON.stringify(err)}`, 'NotificationPushSetup')
    }
    return response.ok
  } catch (e) {
    logger.error('subscribePushAndRegister failed', e as Error, 'NotificationPushSetup')
    return false
  }
}

/**
 * Requests notification permission; if granted, waits briefly then attempts push subscribe + API registration.
 * Mirrors the flow in NotificationSettings.handleEnable (delay helps permission settle in some browsers).
 */
export async function requestNotificationPermissionAndPushSubscription(): Promise<NotificationPushSetupResult> {
  if (typeof Notification === 'undefined') {
    return { permission: 'denied', granted: false, pushSubscribed: false }
  }

  const granted = await notificationService.requestPermission()
  const permission = Notification.permission

  if (!granted) {
    return { permission, granted: false, pushSubscribed: false }
  }

  let pushSubscribed = false
  if (pushService.isSupported()) {
    await new Promise((r) => setTimeout(r, 500))
    pushSubscribed = await subscribePushAndRegister()
  }

  return { permission, granted: true, pushSubscribed }
}
