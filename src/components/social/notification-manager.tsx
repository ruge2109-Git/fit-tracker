/**
 * Notification Manager
 * Handles global real-time subscriptions for social notifications
 */

'use client'

import { useEffect } from 'react'
import { communityService } from '@/domain/services/community.service'
import { useSocialStore } from '@/store/social.store'
import { useAuthStore } from '@/store/auth.store'
import { usePathname } from '@/i18n/routing'
import { ROUTES } from '@/lib/constants'

export function NotificationManager() {
  const { user } = useAuthStore()
  const { fetchUnreadCount, setUnreadMessagesCount, unreadMessagesCount } = useSocialStore()
  const pathname = usePathname()

  useEffect(() => {
    if (!user?.id) return

    // Initial fetch
    fetchUnreadCount(user.id)

    // Subscribe to new DMs
    const channel = communityService.subscribeToDMs(user.id, (newMsg) => {
      // If we are NOT on the social page, or NOT in the specific chat, increment
      // (Simplified: always increment if on different page)
      if (!pathname.includes(ROUTES.SOCIAL)) {
        setUnreadMessagesCount(unreadMessagesCount + 1)
        
        // Browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nuevo mensaje en Arena', {
            body: 'Has recibido un nuevo mensaje directo.',
            icon: '/favicon.ico'
          })
        }
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id, fetchUnreadCount, setUnreadMessagesCount, unreadMessagesCount, pathname])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return null
}
