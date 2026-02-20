/**
 * Audit Log API Route
 * Handles audit log creation from client-side
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditService } from '@/domain/services/audit.service'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let body: any
    
    // sendBeacon sends as text/plain, so handle both
    if (contentType.includes('application/json')) {
      body = await request.json()
    } else {
      const text = await request.text()
      try {
        body = JSON.parse(text)
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
      }
    }
    
    const { action, entityType, entityId, details } = body

    if (!action || !entityType) {
      return NextResponse.json(
        { error: 'Missing required fields: action, entityType' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ipAddress = auditService.getClientIP(request.headers)
    const userAgent = auditService.getClientUserAgent(request.headers)

    // Log the action using server-side Supabase client
    await auditService.logAction({
      userId: user.id,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    }, supabase)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error creating audit log', error as Error, 'AuditAPI')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

