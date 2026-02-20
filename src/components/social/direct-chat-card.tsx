/**
 * Direct Message Chat
 * Estilo Messenger con burbujas premium y tiempo real optimizado
 */

'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, Loader2, MoreVertical, Phone, Video } from 'lucide-react'
import { communityService } from '@/domain/services/community.service'
import { DirectMessage } from '@/types'
import { useAuthStore } from '@/store/auth.store'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface DirectChatCardProps {
  friendId: string
  friendNickname: string
  onBack: () => void
}

export function DirectChatCard({ friendId, friendNickname, onBack }: DirectChatCardProps) {
  const t = useTranslations('social')
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    const res = await communityService.getDirectMessages(friendId)
    if (res.data) setMessages(res.data)
    setIsLoading(false)
  }, [friendId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    if (!user?.id) return
    const channel = communityService.subscribeToDMs(user.id, (newMsg) => {
      if (newMsg.sender_id === friendId) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        communityService.markDirectMessagesAsRead(friendId).catch(() => {})
      }
    })
    return () => { channel.unsubscribe() }
  }, [user?.id, friendId])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isSending) return
    const content = input.trim()
    setInput('')
    setIsSending(true)
    
    // Optimistic Update
    const optimisticMsg: DirectMessage = {
      id: Math.random().toString(),
      sender_id: user?.id || '',
      receiver_id: friendId,
      content,
      created_at: new Date().toISOString(),
      is_read: false
    }
    setMessages(prev => [...prev, optimisticMsg])

    const res = await communityService.sendDirectMessage(friendId, content)
    if (res.error) {
       // Rollback or show error
    }
    setIsSending(false)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className="flex flex-col h-full rounded-[2rem] border-none shadow-2xl bg-background/80 backdrop-blur-xl overflow-hidden border border-white/5">
      {/* Messenger Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-accent/5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10 border-2 border-primary/20 bg-background rounded-2xl">
            <AvatarFallback className="bg-primary/10 text-primary font-black italic">
              {friendNickname[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-tight italic">
              {friendNickname}
            </span>
            <span className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              {t('online') || 'En línea'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Actions removed as requested - Clean PWA UI */}
        </div>
      </div>

      {/* Messages area with bubbles */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gradient-to-b from-transparent to-accent/5"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-30 select-none">
            <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mb-4">
               <Send className="h-8 w-8" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest">{t('startConversation') || 'Dile hola'}</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender_id === user?.id
            const isLastOfGroup = i === messages.length - 1 || messages[i + 1].sender_id !== msg.sender_id

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%] transition-all",
                  isOwn ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "px-3.5 py-2 text-sm font-medium shadow-sm transition-all",
                  isOwn 
                    ? "bg-primary text-primary-foreground rounded-[1.25rem] rounded-br-[0.25rem]" 
                    : "bg-accent/10 border border-white/5 text-foreground rounded-[1.25rem] rounded-bl-[0.25rem]"
                )}>
                  {msg.content}
                </div>
                {isLastOfGroup && (
                  <span className="text-[9px] font-bold text-muted-foreground/50 mt-1 px-1">
                    {formatTime(msg.created_at)}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Input area */}
      <div className="p-4 bg-background/50 border-t border-white/5">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            placeholder={t('typeMessage') || 'Escribe un mensaje...'}
            value={input}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            onChange={(e) => setInput(e.target.value)}
            className="rounded-full h-12 bg-accent/5 border-none font-bold text-sm px-6 focus-visible:ring-primary/30"
            disabled={isSending}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="rounded-full h-12 w-12 p-0 shrink-0 shadow-lg shadow-primary/20 transition-transform active:scale-90"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
