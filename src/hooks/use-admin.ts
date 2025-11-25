/**
 * useAdmin Hook
 * Check if current user is admin
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { isAdminClient } from '@/lib/auth/admin-client'
import { logger } from '@/lib/logger'

export function useAdmin() {
  const { user } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        const adminStatus = await isAdminClient()
        setIsAdmin(adminStatus)
      } catch (error) {
        logger.error(`Error checking admin status: ${error}`)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdmin()
  }, [user])

  return { isAdmin, isLoading }
}

