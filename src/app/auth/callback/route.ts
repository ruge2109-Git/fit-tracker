/**
 * Auth Callback Route Handler (without locale)
 * Handles OAuth callbacks from providers like Google
 * This route doesn't include locale to simplify Supabase configuration
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { logger } from '@/lib/logger'
import { auditService } from '@/domain/services/audit.service'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      logger.error('Error exchanging code for session', error, 'AuthCallback')
      return NextResponse.redirect(new URL(`/${routing.defaultLocale}/auth`, requestUrl.origin))
    }
  }

  // Get user to check if they have a preferred locale
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Log OAuth login event
  if (user) {
    const ipAddress = auditService.getClientIP(request.headers)
    const userAgent = auditService.getClientUserAgent(request.headers)
    
    await auditService.logAction({
      userId: user.id,
      action: 'login',
      entityType: 'auth',
      details: { method: 'google_oauth' },
      ipAddress,
      userAgent,
    })
  }
  
  // Use default locale for redirect
  // The app will handle locale detection in the dashboard
  const locale = routing.defaultLocale

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(`/${locale}/dashboard`, requestUrl.origin))
}

