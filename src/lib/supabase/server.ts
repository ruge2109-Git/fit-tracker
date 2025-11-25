/**
 * Server-side Supabase client
 * For use in Server Components, Server Actions, and Route Handlers
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, Next.js may try to analyze routes
    // In this case, we'll create a minimal client that won't be used
    // The actual error will occur at runtime when the route is called
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      // Return a client with placeholder values during build
      // This allows the build to complete, but the client won't work at runtime
      // The actual validation will happen when the route is called
      try {
        const cookieStore = await cookies()
        return createServerClient(
          supabaseUrl || '',
          supabaseAnonKey || '',
          {
            cookies: {
              get() { return undefined },
              set() {},
              remove() {},
            },
          }
        )
      } catch {
        // If cookies() fails during build, create minimal client
        return createServerClient(
          supabaseUrl || '',
          supabaseAnonKey || '',
          {
            cookies: {
              get() { return undefined },
              set() {},
              remove() {},
            },
          }
        )
      }
    }
    
    throw new Error(
      'Missing Supabase environment variables. ' +
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

