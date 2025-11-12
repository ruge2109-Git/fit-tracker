/**
 * API Route: Schedule Routine Notifications
 * POST /api/push/schedule
 * This endpoint should be called by a cron job to send scheduled notifications
 * Can also be called manually to trigger notification scheduling
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pushSubscriptionRepository } from '@/domain/repositories/push-subscription.repository'
import { routineRepository } from '@/domain/repositories/routine.repository'
import webpush from 'web-push'
import { DAYS_OF_WEEK_OPTIONS } from '@/lib/constants'
import { DayOfWeek } from '@/types'
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

function getNextNotificationTime(day: DayOfWeek): Date | null {
  const dayIndex = DAYS_OF_WEEK_OPTIONS.findIndex(d => d.value === day)
  if (dayIndex === -1) return null

  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const targetDay = dayIndex === 0 ? 0 : dayIndex

  let daysUntil = targetDay - currentDay
  if (daysUntil < 0) {
    daysUntil += 7
  }
  if (daysUntil === 0 && today.getHours() >= 8) {
    daysUntil = 7
  }

  const notificationDate = new Date(today)
  notificationDate.setDate(today.getDate() + daysUntil)
  notificationDate.setHours(8, 0, 0, 0)

  return notificationDate
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
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay()

    // Only send notifications at 8 AM (allow manual testing with query param)
    const isManualTest = request.nextUrl.searchParams.get('test') === 'true'
    if (!isManualTest && currentHour !== 8) {
      return NextResponse.json(
        { message: 'Not the right time for notifications. Current hour: ' + currentHour + '. Expected: 8. Use ?test=true to test manually.', sent: 0 },
        { status: 200 }
      )
    }

    // Get all active routines with scheduled days
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select('*')
      .eq('is_active', true)
      .not('scheduled_days', 'is', null)

    if (routinesError || !routines) {
      logger.error('Failed to fetch routines', routinesError as Error, 'PushScheduleAPI')
      return NextResponse.json(
        { error: 'Failed to fetch routines' },
        { status: 500 }
      )
    }

    let totalSent = 0
    const errors: string[] = []

    // Process each routine
    for (const routine of routines) {
      if (!routine.scheduled_days || routine.scheduled_days.length === 0) {
        continue
      }

      // Check if today is a scheduled day
      const dayIndex = DAYS_OF_WEEK_OPTIONS.findIndex(d => d.value === routine.scheduled_days[0])
      const targetDay = dayIndex === 0 ? 0 : dayIndex
      
      // Check if any scheduled day matches today
      const isTodayScheduled = routine.scheduled_days.some((day: DayOfWeek) => {
        const dayIdx = DAYS_OF_WEEK_OPTIONS.findIndex(d => d.value === day)
        const tDay = dayIdx === 0 ? 0 : dayIdx
        return tDay === currentDay
      })

      if (!isTodayScheduled) {
        continue
      }

      // Get user's push subscriptions
      const subscriptionsResult = await pushSubscriptionRepository.findByUserId(routine.user_id, supabase)

      if (subscriptionsResult.error || !subscriptionsResult.data || subscriptionsResult.data.length === 0) {
        continue
      }

      const payload = JSON.stringify({
        title: 'FitTrackr - Workout Reminder',
        body: `Time for your routine: ${routine.name}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: `routine-${routine.id}`,
        vibrate: [200, 100, 200],
        data: {
          url: `/routines/${routine.id}`,
          routineId: routine.id,
        },
      })

      // Send to all user's subscriptions
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
          totalSent++
        } catch (error: any) {
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await pushSubscriptionRepository.deleteByEndpoint(routine.user_id, subscription.endpoint)
            logger.warn(`Removed invalid subscription: ${subscription.endpoint}`, 'PushScheduleAPI')
          } else {
            errors.push(error.message)
            logger.error('Failed to send push notification', error, 'PushScheduleAPI')
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        sent: totalSent,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Exception in push schedule API', error as Error, 'PushScheduleAPI')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing
export async function GET() {
  return POST(new NextRequest('http://localhost/api/push/schedule', { method: 'POST' }))
}

