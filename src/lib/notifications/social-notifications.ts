/**
 * Social Notifications Service
 * Sends push notifications for community events:
 * - Friend requests (sent, accepted)
 * - Global chat messages
 * - Direct messages
 * - Activity feed events
 */

import { pushSubscriptionRepository } from '@/domain/repositories/push-subscription.repository'
import { logger } from '@/lib/logger'
import webpush from 'web-push'

// Initialize VAPID if keys are present
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  let vapidEmail = process.env.VAPID_EMAIL || 'mailto:jonathan.ruge.77@gmail.com'
  if (!vapidEmail.startsWith('mailto:')) {
    vapidEmail = `mailto:${vapidEmail}`
  }
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
}

/**
 * Send push notification to a specific user
 */
async function sendToUser(userId: string, payload: NotificationPayload): Promise<number> {
  if (!vapidPrivateKey) {
    logger.warn('VAPID keys not configured, skipping push', 'SocialNotifications')
    return 0
  }

  try {
    const result = await pushSubscriptionRepository.findByUserId(userId)
    if (result.error || !result.data || result.data.length === 0) {
      return 0
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-96x96.png',
      tag: payload.tag || 'social',
      vibrate: [200, 100, 200],
      data: payload.data || {},
    })

    let sent = 0
    for (const sub of result.data) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          pushPayload
        )
        sent++
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await pushSubscriptionRepository.deleteByEndpoint(userId, sub.endpoint)
        } else {
          logger.error('Push send failed', error, 'SocialNotifications')
        }
      }
    }
    return sent
  } catch (error) {
    logger.error('Error sending social notification', error as Error, 'SocialNotifications')
    return 0
  }
}

// ─── Notification Functions ────────────────────────────────────────────────

/**
 * Notify user they received a friend request
 */
export async function notifyFriendRequest(targetUserId: string, senderNickname: string) {
  return sendToUser(targetUserId, {
    title: '👋 Nueva solicitud de amistad',
    body: `${senderNickname} quiere ser tu amigo`,
    tag: 'friend-request',
    data: { type: 'friend_request', url: '/social' },
  })
}

/**
 * Notify user their friend request was accepted
 */
export async function notifyFriendAccepted(targetUserId: string, accepterNickname: string) {
  return sendToUser(targetUserId, {
    title: '🎉 ¡Solicitud aceptada!',
    body: `${accepterNickname} aceptó tu solicitud de amistad`,
    tag: 'friend-accepted',
    data: { type: 'friend_accepted', url: '/social' },
  })
}

/**
 * Notify a user they received a direct message
 */
export async function notifyDirectMessage(targetUserId: string, senderNickname: string, preview: string) {
  return sendToUser(targetUserId, {
    title: `💬 ${senderNickname}`,
    body: preview.length > 80 ? preview.substring(0, 80) + '...' : preview,
    tag: `dm-${targetUserId}`,
    data: { type: 'direct_message', url: '/social' },
  })
}

/**
 * Notify a list of friends about a global chat message
 */
export async function notifyGlobalChatToFriends(friendIds: string[], senderNickname: string, preview: string) {
  const trimmed = preview.length > 60 ? preview.substring(0, 60) + '...' : preview
  let totalSent = 0
  for (const friendId of friendIds) {
    const sent = await sendToUser(friendId, {
      title: `🌐 ${senderNickname} en el chat`,
      body: trimmed,
      tag: 'global-chat',
      data: { type: 'global_chat', url: '/social' },
    })
    totalSent += sent
  }
  return totalSent
}

/**
 * Notify a user about friend activity (workout completed, PR, streak)
 */
export async function notifyFeedEvent(
  targetUserId: string,
  actorNickname: string,
  eventType: 'workout_completed' | 'personal_record' | 'streak',
  detail?: string
) {
  const messages: Record<string, { title: string; body: string }> = {
    workout_completed: {
      title: '💪 Actividad de amigo',
      body: `${actorNickname} completó un entrenamiento`,
    },
    personal_record: {
      title: '🏆 ¡Nuevo PR!',
      body: `${actorNickname} logró un nuevo récord personal${detail ? ` en ${detail}` : ''}`,
    },
    streak: {
      title: '🔥 Racha increíble',
      body: `${actorNickname} alcanzó una racha de ${detail || '?'} días`,
    },
  }

  const msg = messages[eventType] || { title: '📣 Actividad', body: `${actorNickname} hizo algo increíble` }

  return sendToUser(targetUserId, {
    ...msg,
    tag: `feed-${eventType}`,
    data: { type: 'feed_event', eventType, url: '/social' },
  })
}
