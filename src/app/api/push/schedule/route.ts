/**
 * API Route: Schedule Routine Notifications
 * POST /api/push/schedule
 * This endpoint should be called by a cron job to send scheduled notifications
 * Can also be called manually to trigger notification scheduling
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
  // Ensure VAPID email is in correct format (mailto:)
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

    // Use service role client to bypass RLS for cron job
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      logger.error('SUPABASE_SERVICE_ROLE_KEY not configured', new Error('Missing service role key'), 'PushScheduleAPI')
      return NextResponse.json(
        { error: 'Service role key not configured. This endpoint requires SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      )
    }

    // Create admin client that bypasses RLS
    const supabase = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentDay = now.getDay()

    // Only send notifications at 6:55 PM Colombia time (23:55 UTC) (allow manual testing with query param)
    const isManualTest = request.nextUrl.searchParams.get('test') === 'true'
    const expectedHour = 23 // 11:55 PM UTC = 6:55 PM Colombia (UTC-5)
    const expectedMinute = 55
    
    if (!isManualTest && (currentHour !== expectedHour || currentMinute !== expectedMinute)) {
      return NextResponse.json(
        { 
          message: `Not the right time for notifications. Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')} UTC (${(currentHour - 5 + 24) % 24}:${currentMinute.toString().padStart(2, '0')} Colombia). Expected: ${expectedHour}:${expectedMinute.toString().padStart(2, '0')} UTC (6:55 PM Colombia). Use ?test=true to test manually.`, 
          sent: 0 
        },
        { status: 200 }
      )
    }

    // Get all active routines with scheduled days (using admin client to bypass RLS)
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select('*')
      .eq('is_active', true)
      .not('scheduled_days', 'is', null)

    if (routinesError || !routines) {
      logger.error('Failed to fetch routines', routinesError as Error, 'PushScheduleAPI')
      return NextResponse.json(
        { error: 'Failed to fetch routines', details: routinesError?.message },
        { status: 500 }
      )
    }

    let totalSent = 0
    const errors: string[] = []
    const diagnostics: any = {
      totalRoutines: routines.length,
      routinesProcessed: 0,
      routinesWithTodayScheduled: 0,
      routinesWithSubscriptions: 0,
      subscriptionsFound: 0,
    }

    // Process each routine
    for (const routine of routines) {
      diagnostics.routinesProcessed++
      
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

      diagnostics.routinesWithTodayScheduled++

      // Get user's push subscriptions (using admin client)
      const subscriptionsResult = await pushSubscriptionRepository.findByUserId(routine.user_id, supabase)

      if (subscriptionsResult.error || !subscriptionsResult.data || subscriptionsResult.data.length === 0) {
        continue
      }

      diagnostics.routinesWithSubscriptions++
      diagnostics.subscriptionsFound += subscriptionsResult.data.length

      const payload = JSON.stringify({
        title: 'FitTrackr - Workout Reminder',
        body: `Time for your routine: ${routine.name}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: `routine-${routine.id}`,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
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
            await pushSubscriptionRepository.deleteByEndpoint(routine.user_id, subscription.endpoint, supabase)
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
        diagnostics: isManualTest ? diagnostics : undefined,
        errors: errors.length > 0 ? errors : undefined,
        message: totalSent === 0 
          ? 'No notifications sent. Check: 1) Active routines with scheduled days for today, 2) Push subscriptions exist, 3) VAPID keys configured'
          : `Successfully sent ${totalSent} notification(s)`,
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

