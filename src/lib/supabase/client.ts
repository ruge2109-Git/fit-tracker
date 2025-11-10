/**
 * Supabase client configuration
 * Provides browser client with proper cookie handling for SSR
 */

import { createBrowserClient } from '@supabase/ssr'

// Browser client - for client-side operations with SSR support
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Default export - singleton instance for client components
export const supabase = createClient()

