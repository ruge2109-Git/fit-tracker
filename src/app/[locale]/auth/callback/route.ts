/**
 * Auth Callback Route Handler
 * Handles OAuth callbacks from providers like Google
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Extract locale from pathname or use default
  const pathname = requestUrl.pathname
  const locale = routing.locales.find(locale => 
    pathname.startsWith(`/${locale}/`)
  ) || routing.defaultLocale

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes (with locale)
  return NextResponse.redirect(new URL(`/${locale}/dashboard`, requestUrl.origin))
}

