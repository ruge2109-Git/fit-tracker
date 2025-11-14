import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pushSubscriptionRepository } from '@/domain/repositories/push-subscription.repository'
import webpush from 'web-push'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  let vapidEmail = process.env.VAPID_EMAIL || 'mailto:jonathan.ruge.77@gmail.com'
  if (!vapidEmail.startsWith('mailto:')) {
    vapidEmail = `mailto:${vapidEmail}`
  }
  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  )
}

export async function POST(request: NextRequest) {
  try {
    if (!vapidPrivateKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()
    const { userId } = body

    let targetUserId = userId
    
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'User ID required or user must be authenticated' },
          { status: 401 }
        )
      }
      targetUserId = user.id
    }

    const subscriptionsResult = await pushSubscriptionRepository.findByUserId(targetUserId, supabase)

    if (subscriptionsResult.error || !subscriptionsResult.data || subscriptionsResult.data.length === 0) {
      return NextResponse.json(
        { 
          error: 'No push subscriptions found',
          userId: targetUserId,
          message: 'Make sure you have enabled push notifications in the app settings'
        },
        { status: 404 }
      )
    }

    const payload = JSON.stringify({
      title: 'FitTrackr - Test Notification',
      body: 'This is a test push notification!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'test-notification',
      vibrate: [200, 100, 200],
      data: {
        url: '/dashboard',
      },
    })

    let sentCount = 0
    const errors: string[] = []

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
          await pushSubscriptionRepository.deleteByEndpoint(targetUserId, subscription.endpoint, supabase)
          logger.warn(`Removed invalid subscription: ${subscription.endpoint}`, 'PushTestAPI')
        } else {
          errors.push(error.message || String(error))
          logger.error('Failed to send push notification', error, 'PushTestAPI')
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        sent: sentCount,
        total: subscriptionsResult.data.length,
        userId: targetUserId,
        errors: errors.length > 0 ? errors : undefined,
        message: sentCount > 0 
          ? `Successfully sent ${sentCount} test notification(s)`
          : 'Failed to send notifications. Check errors for details.',
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Exception in push test API', error as Error, 'PushTestAPI')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  const request = new NextRequest('http://localhost/api/push/test', { method: 'POST' })
  return POST(request)
}

