/**
 * Middleware for i18n and authentication
 * Handles locale detection and route protection
 */

import createMiddleware from 'next-intl/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

// Create i18n middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // Handle i18n first
  const pathname = request.nextUrl.pathname
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If no locale in path, let i18n middleware handle it
  if (!pathnameHasLocale && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    const response = intlMiddleware(request)
    
    // After i18n, check authentication
    return handleAuth(request, response)
  }

  // If locale is present, check auth after i18n
  const intlResponse = intlMiddleware(request)
  return handleAuth(request, intlResponse)
}

async function handleAuth(request: NextRequest, response: NextResponse) {
  let authResponse = response || NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          authResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          authResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          authResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          authResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Extract locale from pathname
  const locale = routing.locales.find(locale => 
    pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  ) || routing.defaultLocale

  // If user is not signed in and trying to access protected routes, redirect to auth
  if (!user && !pathname.includes('/auth')) {
    const authUrl = new URL(`/${locale}/auth`, request.url)
    return NextResponse.redirect(authUrl)
  }

  // If user is signed in and trying to access auth page, redirect to dashboard
  if (user && pathname.includes('/auth')) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return authResponse
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}

