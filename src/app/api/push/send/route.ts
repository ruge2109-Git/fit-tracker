/**
 * API Route: Send Push Notification
 * POST /api/push/send
 * This endpoint is for internal use or can be called by a cron job
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pushSubscriptionRepository } from '@/domain/repositories/push-subscription.repository'
import webpush from 'web-push'
import { logger } from '@/lib/logger'

// Configure VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:jonathan.ruge.77@gmail.com'
  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  )
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (you can add API key authentication here)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, title, body: notificationBody, icon, tag, data } = body

    if (!vapidPrivateKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      )
    }

    // Get user's push subscriptions
    const targetUserId = userId || user.id
    const subscriptionsResult = await pushSubscriptionRepository.findByUserId(targetUserId)

    if (subscriptionsResult.error || !subscriptionsResult.data || subscriptionsResult.data.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found', sent: 0 },
        { status: 404 }
      )
    }

    const payload = JSON.stringify({
      title: title || 'FitTrackr',
      body: notificationBody || 'You have a new notification',
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: tag || 'default',
      vibrate: [200, 100, 200],
      data: data || {},
    })

    let sentCount = 0
    const errors: string[] = []

    // Send to all subscriptions
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
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await pushSubscriptionRepository.deleteByEndpoint(targetUserId, subscription.endpoint)
          logger.warn(`Removed invalid subscription: ${subscription.endpoint}`, 'PushSendAPI')
        } else {
          errors.push(error.message)
          logger.error('Failed to send push notification', error, 'PushSendAPI')
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        sent: sentCount,
        total: subscriptionsResult.data.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Exception in push send API', error as Error, 'PushSendAPI')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

