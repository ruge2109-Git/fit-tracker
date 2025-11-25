/**
 * Admin Helper Functions (Client-side)
 * Utilities to check admin permissions on the client
 * 
 * NOTE: This file should ONLY be imported in Client Components
 */

'use client'

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

/**
 * Check if the current user is an admin (client-side)
 * @returns Promise<boolean> - True if user is admin
 */
export async function isAdminClient(): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Check if user has admin flag in users table
    const { data, error } = await supabase
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

