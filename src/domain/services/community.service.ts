/**
 * Community Service
 * Client-side service for friends, chat, and feed operations
 * Follows the same singleton pattern as other domain services
 */

import { supabase } from '@/lib/supabase/client'
import { ApiResponse, Friendship, ChatMessage, DirectMessage, ActivityFeedItem } from '@/types'

export interface ICommunityService {
  // Friends
  getFriendships(): Promise<ApiResponse<Friendship[]>>
  searchUsers(query: string): Promise<ApiResponse<{ id: string; nickname: string; name: string }[]>>
  sendFriendRequest(friendId: string): Promise<ApiResponse<void>>
  respondToRequest(friendshipId: string, status: 'accepted' | 'rejected'): Promise<ApiResponse<void>>

  // Global Chat
  getGlobalMessages(): Promise<ApiResponse<ChatMessage[]>>
  sendGlobalMessage(content: string): Promise<ApiResponse<void>>

  // Direct Messages
  getDirectMessages(otherId: string): Promise<ApiResponse<DirectMessage[]>>
  sendDirectMessage(receiverId: string, content: string): Promise<ApiResponse<void>>
  markDirectMessagesAsRead(senderId: string): Promise<ApiResponse<void>>
  getUnreadMessageCounts(): Promise<ApiResponse<Record<string, number>>>

  // Feed
  getActivityFeed(): Promise<ApiResponse<ActivityFeedItem[]>>
  createActivityEvent(type: string, payload: any): Promise<ApiResponse<void>>
}

class CommunityService implements ICommunityService {
  // ─── Friends ──────────────────────────────────────────────────────────────

  async getFriendships(): Promise<ApiResponse<Friendship[]>> {
    try {
      const res = await fetch('/api/friends')
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch friends')
      const data = await res.json()
      return { data }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async searchUsers(query: string): Promise<ApiResponse<{ id: string; nickname: string; name: string }[]>> {
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Search failed')
      const data = await res.json()
      return { data }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async sendFriendRequest(friendId: string): Promise<ApiResponse<void>> {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to send request')
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async respondToRequest(friendshipId: string, status: 'accepted' | 'rejected'): Promise<ApiResponse<void>> {
    try {
      const res = await fetch('/api/friends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, status }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to respond')
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // ─── Global Chat ──────────────────────────────────────────────────────────

  async getGlobalMessages(): Promise<ApiResponse<ChatMessage[]>> {
    try {
      const res = await fetch('/api/chat/global')
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch messages')
      const data = await res.json()
      return { data }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async sendGlobalMessage(content: string): Promise<ApiResponse<void>> {
    try {
      const res = await fetch('/api/chat/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to send message')
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // ─── Direct Messages ─────────────────────────────────────────────────────

  async getDirectMessages(otherId: string): Promise<ApiResponse<DirectMessage[]>> {
    try {
      const res = await fetch(`/api/chat/dm?with=${otherId}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch DMs')
      const data = await res.json()
      return { data }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async sendDirectMessage(receiverId: string, content: string): Promise<ApiResponse<void>> {
    try {
      const res = await fetch('/api/chat/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, content }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to send DM')
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async markDirectMessagesAsRead(senderId: string): Promise<ApiResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: 'Not authenticated' }

      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getUnreadMessageCounts(): Promise<ApiResponse<Record<string, number>>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: 'Not authenticated' }

      const { data, error } = await supabase
        .from('direct_messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      const counts: Record<string, number> = {}
      data.forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1
      })

      return { data: counts }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // ─── Activity Feed ────────────────────────────────────────────────────────

  async getActivityFeed(): Promise<ApiResponse<ActivityFeedItem[]>> {
    try {
      const res = await fetch('/api/feed')
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch feed')
      const data = await res.json()
      return { data }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async createActivityEvent(type: string, payload: any): Promise<ApiResponse<void>> {
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create event')
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // ─── Supabase Realtime ────────────────────────────────────────────────────

  subscribeToGlobalChat(callback: (msg: ChatMessage) => void) {
    return supabase
      .channel('global-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          callback(payload.new as ChatMessage)
        }
      )
      .subscribe()
  }

  subscribeToDMs(userId: string, callback: (msg: DirectMessage) => void) {
    return supabase
      .channel(`dm-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as DirectMessage)
        }
      )
      .subscribe()
  }

  subscribeToFriendRequests(userId: string, callback: (f: Friendship) => void) {
    return supabase
      .channel(`friend-requests-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `user_id_2=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Friendship)
        }
      )
      .subscribe()
  }
}

export const communityService = new CommunityService()
