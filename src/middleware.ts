/**
 * Middleware for i18n and authentication
 * Handles locale detection and route protection
 */

import createMiddleware from 'next-intl/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

// Create i18n middleware with locale detection from cookies
const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: true
})

export async function middleware(request: NextRequest) {
  // Handle i18n first
  const pathname = request.nextUrl.pathname
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Get locale from cookie if available
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  
  // If no locale in path, let i18n middleware handle it
  if (!pathnameHasLocale && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    const response = intlMiddleware(request)
    
    // Save locale to cookie if detected
    if (cookieLocale && routing.locales.includes(cookieLocale as any)) {
      response.cookies.set('NEXT_LOCALE', cookieLocale, {
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax'
      })
    }
    
    // Fix Permissions-Policy header
    fixPermissionsPolicyHeader(response)
    
    // After i18n, check authentication
    return handleAuth(request, response)
  }

  // If locale is present, check auth after i18n
  const intlResponse = intlMiddleware(request)
  
  // Extract locale from pathname and save to cookie
  const detectedLocale = routing.locales.find(locale => 
    pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  ) || cookieLocale || routing.defaultLocale
  
  if (detectedLocale && routing.locales.includes(detectedLocale as any)) {
    intlResponse.cookies.set('NEXT_LOCALE', detectedLocale, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax'
    })
  }
  
  // Fix Permissions-Policy header
  fixPermissionsPolicyHeader(intlResponse)
  
  return handleAuth(request, intlResponse)
}

/**
 * Fix Permissions-Policy header by removing unsupported 'browsing-topics' feature
 */
function fixPermissionsPolicyHeader(response: NextResponse) {
  const permissionsPolicy = response.headers.get('Permissions-Policy')
  if (permissionsPolicy && permissionsPolicy.includes('browsing-topics')) {
    // Remove browsing-topics from the header
    const cleanedPolicy = permissionsPolicy
      .split(',')
      .map(p => p.trim())
      .filter(p => !p.includes('browsing-topics'))
      .join(', ')
    
    if (cleanedPolicy) {
      response.headers.set('Permissions-Policy', cleanedPolicy)
    } else {
      response.headers.delete('Permissions-Policy')
    }
  }
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

  // Allow access to public auth pages (forgot-password, reset-password, callback)
  // Note: /auth/callback (without locale) is also allowed
  const isPublicAuthPage = pathname.includes('/auth/forgot-password') ||
    pathname.includes('/auth/reset-password') ||
    pathname.includes('/auth/callback')
  
  // Allow access to callback route without locale
  const isCallbackRoute = pathname === '/auth/callback'

  // Allow access to landing page (root locale route)
  const isLandingPage = pathname === `/${locale}` || pathname === `/${locale}/`

  // Check if it's a routine detail route (public access allowed for sharing)
  // Pattern: /[locale]/routines/[id] OR /routines/[id] (handling redirects)
  // [id] must not be 'new'
  const isRoutineDetailRoute = pathname.match(/(\/[a-zA-Z-]+)?\/routines\/(?!new$)[^/]+$/)

  // If user is not signed in and trying to access protected routes, redirect to landing page
  // But allow landing page, auth pages, callback route, and routine detail pages
  if (!user && !pathname.includes('/auth') && !isLandingPage && !isCallbackRoute && !isRoutineDetailRoute) {
    const landingUrl = new URL(`/${locale}`, request.url)
    return NextResponse.redirect(landingUrl)
  }

  // If user is signed in and trying to access auth page (except public pages), redirect to dashboard
  if (user && pathname.includes('/auth') && !isPublicAuthPage) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // If user is signed in and on landing page, redirect to dashboard
  if (user && isLandingPage) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Fix Permissions-Policy header
  fixPermissionsPolicyHeader(authResponse)

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

