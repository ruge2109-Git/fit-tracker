/**
 * Admin Helper Functions
 * Utilities to check admin permissions
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Check if the current user is an admin (server-side)
 * @param supabaseClient - Optional Supabase client (server-side)
 * @returns Promise<boolean> - True if user is admin
 */
export async function isAdmin(supabaseClient?: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  try {
    const client = supabaseClient || await createClient()
    const { data: { user }, error: authError } = await client.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Check if user has admin flag in users table
    const { data, error } = await client
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      return false
    }

    return data.is_admin === true
  } catch (error) {
    logger.error(`Error checking admin status: ${error}`)
    return false
  }
}

/**
 * Get admin status for a specific user ID (server-side)
 * @param userId - User ID to check
 * @param supabaseClient - Optional Supabase client (server-side)
 * @returns Promise<boolean> - True if user is admin
 */
export async function isUserAdmin(
  userId: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
  try {
    const client = supabaseClient || await createClient()
    
    const { data, error } = await client
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return false
    }

    return data.is_admin === true
  } catch (error) {
    logger.error(`Error checking admin status: ${error}`)
    return false
  }
}

