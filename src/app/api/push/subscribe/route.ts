/**
 * API Route: Subscribe to Push Notifications
 * POST /api/push/subscribe
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pushSubscriptionRepository } from '@/domain/repositories/push-subscription.repository'
import { PushSubscriptionData } from '@/types'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const subscriptionData: PushSubscriptionData = body

    if (!subscriptionData.endpoint || !subscriptionData.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    const result = await pushSubscriptionRepository.createSubscription(user.id, subscriptionData, supabase)

    if (result.error) {
      logger.error('Failed to save push subscription', new Error(result.error), 'PushSubscribeAPI')
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Exception in push subscribe API', error as Error, 'PushSubscribeAPI')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

