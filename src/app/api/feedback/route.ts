/**
 * API Route: Feedback
 * POST /api/feedback - Submit feedback (authenticated users)
 * GET /api/feedback - Get all feedbacks (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { feedbackRepository } from '@/domain/repositories/feedback.repository'
import { FeedbackFormData, FeedbackStatus, FeedbackType } from '@/types'
import { logger } from '@/lib/logger'
import { isAdmin } from '@/lib/auth/admin'
import { notifyAdminsAboutFeedback } from '@/lib/notifications/admin-notifications'
import { auditService } from '@/domain/services/audit.service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schema
const feedbackSchema = z.object({
  type: z.nativeEnum(FeedbackType),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
  rating: z.number().min(1).max(5).optional(),
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // Validate input
    const validationResult = feedbackSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const feedbackData: FeedbackFormData = validationResult.data

    // Create feedback
    const result = await feedbackRepository.create(
      {
        user_id: user.id,
        type: feedbackData.type,
        subject: feedbackData.subject,
        message: feedbackData.message,
        rating: feedbackData.rating,
        status: FeedbackStatus.PENDING,
      },
      supabase
    )

    if (result.error) {
      logger.error(`Failed to create feedback: ${result.error}`)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    logger.info(`Feedback submitted: userId: ${user.id}, type: ${feedbackData.type}`)

    // Get user info for notifications
    const { data: userData } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', user.id)
      .single()

    // Notify admins about new feedback (don't wait for it to complete)
    if (result.data) {
      notifyAdminsAboutFeedback(
        result.data,
        userData?.email || user.email || 'unknown@example.com',
        userData?.name || null,
        supabase
      ).catch((error) => {
        // Log error but don't fail the request
        logger.error('Failed to notify admins about feedback', error as Error, 'FeedbackAPI')
      })
    }

    // Audit log
    await auditService.logAction({
      userId: user.id,
      action: 'submit_feedback',
      entityType: 'feedback',
      entityId: result.data?.id,
      details: { type: feedbackData.type, subject: feedbackData.subject, rating: feedbackData.rating },
    }, supabase)

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    )
  } catch (error) {
    logger.error(`Exception in feedback API: ${error}`)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/feedback
 * Get all feedbacks (admin only)
 */
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

    // Check if user is admin
    const userIsAdmin = await isAdmin(supabase)
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query - First get feedbacks
    // Apply filters BEFORE range/order
    let query = supabase
      .from('feedback')
      .select('*')

    // Apply filters BEFORE ordering and range
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('type', type)
    }

    // Apply ordering and range AFTER filters
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: feedbacks, error } = await query

    if (error) {
      logger.error(`Failed to fetch feedbacks: ${error.message}`)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Get user information for each feedback
    const feedbacksWithUsers = await Promise.all(
      (feedbacks || []).map(async (feedback) => {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('id', feedback.user_id)
          .single()

        return {
          ...feedback,
          user: userData || null,
        }
      })
    )

    // Get total count for pagination
    let countQuery = supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })

    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (type) {
      countQuery = countQuery.eq('type', type)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json(
      {
        success: true,
        data: feedbacksWithUsers,
        pagination: {
          total: totalCount || 0,
          limit,
          offset,
          hasMore: (totalCount || 0) > offset + limit,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error(`Exception in feedback GET API: ${error}`)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

