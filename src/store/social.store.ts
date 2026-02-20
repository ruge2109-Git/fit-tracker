/**
 * Social Store
 * Manages global social state like unread notification counts
 */

import { create } from 'zustand'
import { communityService } from '@/domain/services/community.service'

interface SocialState {
  unreadMessagesCount: number
  setUnreadMessagesCount: (count: number) => void
  fetchUnreadCount: (userId: string) => Promise<void>
}

export const useSocialStore = create<SocialState>((set) => ({
  unreadMessagesCount: 0,
  setUnreadMessagesCount: (count: number) => set({ unreadMessagesCount: count }),
  fetchUnreadCount: async (userId: string) => {
    const res = await communityService.getUnreadMessageCounts()
    if (res.data) {
      const total = Object.values(res.data).reduce((acc: number, curr: number) => acc + curr, 0)
      set({ unreadMessagesCount: total })
    }
  },
}))
