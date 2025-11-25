/**
 * API Route: Get User's Own Feedbacks
 * GET /api/feedback/my
 * Get all feedbacks submitted by the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { feedbackRepository } from '@/domain/repositories/feedback.repository'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables before creating client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      )
    }
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Get user's feedbacks
    const result = await feedbackRepository.findByUserId(user.id, supabase)

    if (result.error) {
      logger.error(`Failed to fetch user feedbacks: ${result.error}`)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    let feedbacks = result.data || []

    // Apply client-side filters (since RLS already filters by user_id)
    if (status && status !== 'all') {
      feedbacks = feedbacks.filter(f => f.status === status)
    }
    if (type && type !== 'all') {
      feedbacks = feedbacks.filter(f => f.type === type)
    }

    return NextResponse.json(
      {
        success: true,
        data: feedbacks,
        total: feedbacks.length,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error(`Exception in feedback/my GET API: ${error}`)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

