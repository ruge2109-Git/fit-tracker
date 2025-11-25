/**
 * Admin Notifications Service
 * Handles sending notifications (email + push) to admins
 */

import { createClient } from '@/lib/supabase/server'
import { emailService } from './email.service'
import { pushSubscriptionRepository } from '@/domain/repositories/push-subscription.repository'
import { Feedback, FeedbackType } from '@/types'
import { logger } from '@/lib/logger'
import webpush from 'web-push'

// Configure webpush
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  let vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@fittrackr.com'
  if (!vapidEmail.startsWith('mailto:')) {
    vapidEmail = `mailto:${vapidEmail}`
  }
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
}

/**
 * Get all admin users
 */
async function getAdminUsers(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('is_admin', true)

    if (error) {
      logger.error('Failed to get admin users', error as Error, 'AdminNotifications')
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Exception getting admin users', error as Error, 'AdminNotifications')
    return []
  }
}

/**
 * Send push notification to admin
 */
async function sendPushToAdmin(
  adminId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  if (!vapidPrivateKey) {
    logger.warn('VAPID keys not configured, skipping push notification', 'AdminNotifications')
    return { success: false, error: 'VAPID keys not configured' }
  }

  try {
    const subscriptionsResult = await pushSubscriptionRepository.findByUserId(adminId)

    if (subscriptionsResult.error || !subscriptionsResult.data || subscriptionsResult.data.length === 0) {
      return { success: false, error: 'No push subscriptions found' }
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'feedback',
      vibrate: [200, 100, 200],
      data: data || {},
    })

    let sentCount = 0
    for (const subscription of subscriptionsResult.data) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        )
        sentCount++
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await pushSubscriptionRepository.deleteByEndpoint(adminId, subscription.endpoint)
          logger.warn(`Removed invalid subscription: ${subscription.endpoint}`, 'AdminNotifications')
        } else {
          logger.error('Failed to send push notification', error, 'AdminNotifications')
        }
      }
    }

    return { success: sentCount > 0, sent: sentCount }
  } catch (error) {
    logger.error('Exception sending push notification', error as Error, 'AdminNotifications')
    return { success: false, error: 'Failed to send push notification' }
  }
}

/**
 * Notify all admins about new feedback
 */
export async function notifyAdminsAboutFeedback(
  feedback: Feedback,
  userEmail: string,
  userName: string | null,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const admins = await getAdminUsers(supabase)

  if (admins.length === 0) {
    logger.warn('No admin users found, skipping notifications', 'AdminNotifications')
    return
  }

  const typeLabels: Record<FeedbackType, string> = {
    [FeedbackType.BUG]: '🐛 Bug Report',
    [FeedbackType.FEATURE]: '✨ Feature Request',
    [FeedbackType.IMPROVEMENT]: '💡 Improvement',
    [FeedbackType.OTHER]: '📝 Other',
  }

  const typeLabel = typeLabels[feedback.type] || feedback.type
  const pushTitle = `New ${typeLabel}`
  const pushBody = feedback.subject

  // Send notifications to all admins
  const promises = admins.map(async (admin) => {
    const emailPromise = emailService.sendFeedbackNotification(admin.email, {
      type: feedback.type,
      subject: feedback.subject,
      message: feedback.message,
      userEmail,
      userName,
      rating: feedback.rating,
      createdAt: feedback.created_at,
    })

    const pushPromise = sendPushToAdmin(admin.id, pushTitle, pushBody, {
      feedbackId: feedback.id,
      type: feedback.type,
    })

    const [emailResult, pushResult] = await Promise.allSettled([emailPromise, pushPromise])

    if (emailResult.status === 'rejected') {
      logger.error('Failed to send email notification', emailResult.reason, 'AdminNotifications')
    }
    if (pushResult.status === 'rejected') {
      logger.error('Failed to send push notification', pushResult.reason, 'AdminNotifications')
    }

    return {
      adminId: admin.id,
      adminEmail: admin.email,
      emailSent: emailResult.status === 'fulfilled' && emailResult.value.success,
      pushSent: pushResult.status === 'fulfilled' && pushResult.value.success,
    }
  })

  const results = await Promise.all(promises)
  
  logger.info(
    `Feedback notifications sent to ${results.length} admin(s) - Feedback ID: ${feedback.id}`,
    'AdminNotifications'
  )

  return results
}

