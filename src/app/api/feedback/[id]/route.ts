/**
 * API Route: Update/Delete Feedback
 * PATCH /api/feedback/[id] - Update feedback status or add response (admin only)
 * DELETE /api/feedback/[id] - Delete feedback (admin only, or user can delete their own pending feedback)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { feedbackRepository } from '@/domain/repositories/feedback.repository'
import { FeedbackStatus } from '@/types'
import { logger } from '@/lib/logger'
import { isAdmin } from '@/lib/auth/admin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schema for updating feedback
const updateFeedbackSchema = z.object({
  status: z.nativeEnum(FeedbackStatus).optional(),
  response: z.string().min(1).max(2000).optional(),
}).refine(
  (data) => data.status !== undefined || data.response !== undefined,
  { message: 'Either status or response must be provided' }
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validationResult = updateFeedbackSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Get current feedback to check ownership
    const currentFeedback = await feedbackRepository.findById(id, supabase)
    if (currentFeedback.error || !currentFeedback.data) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    const feedback = currentFeedback.data
    const userIsAdmin = await isAdmin(supabase)

    // Check permissions
    // - Admins can update status and add responses
    // - Users can only update status of their own pending feedbacks
    if (body.response) {
      // Only admins can respond
      if (!userIsAdmin) {
        return NextResponse.json(
          { error: 'Forbidden: Only admins can respond to feedback' },
          { status: 403 }
        )
      }
    }

    if (body.status) {
      // Users can only update their own pending feedbacks
      if (!userIsAdmin && (feedback.user_id !== user.id || feedback.status !== FeedbackStatus.PENDING)) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update status of your own pending feedbacks' },
          { status: 403 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (body.status) {
      updateData.status = body.status
    }
    if (body.response) {
      updateData.response = body.response
      updateData.responded_at = new Date().toISOString()
      updateData.responded_by = user.id
    }

    // Update feedback
    const result = await feedbackRepository.update(
      id,
      updateData,
      supabase
    )

    if (result.error) {
      logger.error(`Failed to update feedback: ${result.error}`)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    const action = body.response ? 'responded to' : 'updated'
    logger.info(`Feedback ${action}: feedbackId: ${id}, userId: ${user.id}`)

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    )
  } catch (error) {
    logger.error(`Exception in feedback PATCH API: ${error}`)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/feedback/[id]
 * Delete feedback (admin only, or user can delete their own pending feedback)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get current feedback to check ownership
    const currentFeedback = await feedbackRepository.findById(id, supabase)
    if (currentFeedback.error || !currentFeedback.data) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    const feedback = currentFeedback.data
    const userIsAdmin = await isAdmin(supabase)

    // Check permissions
    // - Admins can delete any feedback
    // - Users can only delete their own pending feedbacks
    if (!userIsAdmin) {
      if (feedback.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You can only delete your own feedbacks' },
          { status: 403 }
        )
      }
      if (feedback.status !== FeedbackStatus.PENDING) {
        return NextResponse.json(
          { error: 'Forbidden: You can only delete pending feedbacks' },
          { status: 403 }
        )
      }
    }

    // Delete feedback
    // Note: We need to use Supabase directly since repository doesn't have delete
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error(`Failed to delete feedback: ${error.message}`)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    logger.info(`Feedback deleted: feedbackId: ${id}, userId: ${user.id}`)

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    logger.error(`Exception in feedback DELETE API: ${error}`)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

