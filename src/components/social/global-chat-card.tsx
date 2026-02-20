/**
 * Global Chat Card
 * Estilo Messenger para la sala común con tiempo real garantizado
 */

'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Loader2, Globe, ArrowLeft } from 'lucide-react'
import { communityService } from '@/domain/services/community.service'
import { ChatMessage } from '@/types'
import { useAuthStore } from '@/store/auth.store'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface GlobalChatCardProps {
  onBack?: () => void
}

export function GlobalChatCard({ onBack }: GlobalChatCardProps) {
  const t = useTranslations('social')
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    const res = await communityService.getGlobalMessages()
    if (res.data) {
      setMessages(res.data.reverse())
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    const channel = communityService.subscribeToGlobalChat((newMsg) => {
      // Prevent duplicate messages from current user (handled by optimistic update)
      if (newMsg.user_id === user?.id) return

      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev
        const enrichedMsg = { 
          ...newMsg, 
          nickname: newMsg.nickname || 'Atleta' 
        }
        return [...prev, enrichedMsg]
      })
    })
    return () => { channel.unsubscribe() }
  }, [user?.id])

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
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: user?.id || '',
      content,
      created_at: new Date().toISOString(),
      nickname: user?.nickname || user?.name || 'Yo'
    }
    setMessages(prev => [...prev, optimisticMsg])

    await communityService.sendGlobalMessage(content)
    setIsSending(false)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className="flex flex-col h-full rounded-[2rem] border-none shadow-2xl bg-background/80 backdrop-blur-xl overflow-hidden border border-white/5">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-accent/5">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full">
               <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center border-2 border-primary/20 shrink-0">
              <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-tight italic">Chat Global</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Comunidad Arena</span>
          </div>
        </div>
      </div>

      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.user_id === user?.id
            const isLastOfGroup = i === messages.length - 1 || messages[i + 1].user_id !== msg.user_id

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  isOwn ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {!isOwn && (
                  <span className="text-[10px] font-black uppercase italic text-primary/60 mb-0.5 px-2">
                    {msg.nickname}
                  </span>
                )}
                <div className={cn(
                  "px-3.5 py-2 text-sm font-medium shadow-sm",
                  isOwn 
                    ? "bg-primary text-primary-foreground rounded-[1.25rem] rounded-br-[0.25rem]" 
                    : "bg-accent/10 border border-white/5 text-foreground rounded-[1.25rem] rounded-bl-[0.25rem]"
                )}>
                  {msg.content}
                </div>
                {isLastOfGroup && (
                  <span className="text-[9px] font-bold text-muted-foreground/40 mt-1 px-1">
                    {formatTime(msg.created_at)}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="p-4 bg-background/50 border-t border-white/5">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            placeholder={t('typeMessage') || 'Escribe un mensaje...'}
            value={input}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            onChange={(e) => setInput(e.target.value)}
            className="rounded-full h-12 bg-accent/5 border-none font-bold text-sm px-6"
            disabled={isSending}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="rounded-full h-12 w-12 p-0 shrink-0 shadow-lg shadow-primary/20"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
