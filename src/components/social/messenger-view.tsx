/**
 * Messenger View component
 * Diseño de dos paneles profesional: Lista de hilos a la izquierda, Conversación a la derecha.
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { communityService } from '@/domain/services/community.service'
import { Friendship } from '@/types'
import { GlobalChatCard } from './global-chat-card'
import { DirectChatCard } from './direct-chat-card'
import { MessageSquare, Users, Globe, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useSocialStore } from '@/store/social.store'

interface MessengerViewProps {
  initialFriendId?: string | null
  initialFriendNickname?: string | null
}

export function MessengerView({ initialFriendId, initialFriendNickname }: MessengerViewProps) {
  const t = useTranslations('social')
  const { user } = useAuthStore()
  const { fetchUnreadCount } = useSocialStore()
  const [activeChat, setActiveChat] = useState<'global' | string>(initialFriendId || '')
  const [activeNickname, setActiveNickname] = useState<string>(initialFriendNickname || '')
  const [friends, setFriends] = useState<Friendship[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(false) // Start fast
    const [friendsRes, unreadRes] = await Promise.all([
      communityService.getFriendships(),
      communityService.getUnreadMessageCounts()
    ])
    
    if (friendsRes.data) {
      setFriends(friendsRes.data.filter(f => f.status === 'accepted'))
    }
    if (unreadRes.data) {
      setUnreadCounts(unreadRes.data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (activeChat !== 'global' && activeChat !== '' && user?.id) {
      communityService.markDirectMessagesAsRead(activeChat).then(() => {
        fetchUnreadCount(user.id)
      }).catch(() => {})
      setUnreadCounts(prev => ({ ...prev, [activeChat]: 0 }))
    }
  }, [activeChat, user?.id])

  useEffect(() => {
    if (!user?.id) return
    const channel = communityService.subscribeToDMs(user.id, (newMsg) => {
      if (newMsg.sender_id !== activeChat) {
        setUnreadCounts(prev => ({
          ...prev,
          [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1
        }))
        fetchUnreadCount(user.id)
      }
    })
    return () => { channel.unsubscribe() }
  }, [user?.id, activeChat])

  const filteredFriends = friends.filter(f => 
    f.friend_nickname?.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="flex flex-col md:flex-row gap-0 h-full rounded-[2.5rem] overflow-hidden border border-white/5 bg-background shadow-2xl relative">
      
      {/* Sidebar - Threads List */}
      <div className={cn(
        "w-full md:w-72 border-r border-white/5 flex flex-col bg-accent/5",
        activeChat !== '' && "hidden md:flex"
      )}>
        <div className="p-4 space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tighter italic">Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input 
              placeholder="Buscar amigos..." 
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="h-8 bg-background/50 border-none rounded-xl pl-8 text-[11px] font-bold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4 scrollbar-none">
          {/* Global Thread */}
          <button
            onClick={() => setActiveChat('global')}
            className={cn(
              "w-full p-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98]",
              activeChat === 'global' ? "bg-primary text-primary-foreground" : "hover:bg-accent/10"
            )}
          >
            <Avatar className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/20 border-none">
                <Globe className={cn("h-5 w-5", activeChat === 'global' ? "text-white" : "text-primary")} />
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-black italic tracking-tight uppercase leading-none mb-1">Global</p>
              <p className={cn("text-[10px] font-bold opacity-60 uppercase", activeChat === 'global' ? "text-white" : "text-muted-foreground")}>The Locker Room</p>
            </div>
          </button>

          <div className="h-px bg-white/5 my-3 mx-4" />

          {/* DM Threads */}
          {filteredFriends.map(friend => {
            const friendId = friend.friend_id!
            const nickname = friend.friend_nickname!
            const unread = unreadCounts[friendId] || 0
            const isActive = activeChat === friendId

            return (
              <button
                key={friendId}
                onClick={() => {
                   setActiveChat(friendId)
                   setActiveNickname(nickname)
                }}
                className={cn(
                  "w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all relative active:scale-[0.98]",
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-accent/10"
                )}
              >
                <Avatar className="h-10 w-10 rounded-xl border-none">
                  <AvatarFallback className={cn("font-black italic text-xs", isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                    {nickname[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-black italic tracking-tight uppercase truncate leading-none mb-1">{nickname}</p>
                  <p className={cn("text-[10px] font-bold opacity-70 uppercase truncate", isActive ? "text-white" : "text-muted-foreground")}>
                    {unread > 0 ? `${unread} mensajes nuevos` : 'Click para chatear'}
                  </p>
                </div>
                {unread > 0 && (
                  <Badge className="h-5 min-w-[20px] bg-destructive border-none font-black text-[9px] flex items-center justify-center rounded-full">
                    {unread > 9 ? '+9' : unread}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-full bg-background relative">
        {activeChat === 'global' ? (
          <GlobalChatCard onBack={() => setActiveChat('')} />
        ) : activeChat ? (
          <DirectChatCard
            key={activeChat}
            friendId={activeChat}
            friendNickname={activeNickname}
            onBack={() => setActiveChat('')}
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-12 opacity-20">
            <MessageSquare className="h-20 w-20 mb-4" />
            <h3 className="text-lg font-black uppercase tracking-widest italic">Selecciona un amigo</h3>
            <p className="text-xs font-bold uppercase tracking-tight">Entrena y progresa juntos</p>
          </div>
        )}
      </div>
    </div>
  )
}
