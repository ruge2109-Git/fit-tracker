/**
 * API Route: Unsubscribe from Push Notifications
 * POST /api/push/unsubscribe
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pushSubscriptionRepository } from '@/domain/repositories/push-subscription.repository'
import { auditService } from '@/domain/services/audit.service'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    const result = await pushSubscriptionRepository.deleteByEndpoint(user.id, endpoint, supabase)

    if (result.error) {
      logger.error('Failed to delete push subscription', new Error(result.error), 'PushUnsubscribeAPI')
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Audit log
    await auditService.logAction({
      userId: user.id,
      action: 'push_unsubscribe',
      entityType: 'notifications',
      details: { endpoint: endpoint.substring(0, 50) },
    }, supabase)

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Exception in push unsubscribe API', error as Error, 'PushUnsubscribeAPI')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

