/**
 * Activity Feed Card - Rediseño Total
 * Feed estilo red social moderno con tarjetas de logros visuales.
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Activity, Dumbbell, Trophy, Flame, Heart, MessageSquare, Send } from 'lucide-react'
import { communityService } from '@/domain/services/community.service'
import { ActivityFeedItem, ActivityFeedComment } from '@/types'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function ActivityFeedCard() {
  const t = useTranslations('social')
  const [feed, setFeed] = useState<ActivityFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [comments, setComments] = useState<Record<string, ActivityFeedComment[]>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [commentInput, setCommentInput] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadFeed = useCallback(async () => {
    const res = await communityService.getActivityFeed()
    if (res.data) setFeed(res.data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadFeed()
    const interval = setInterval(loadFeed, 30000)
    return () => clearInterval(interval)
  }, [loadFeed])

  const toggleLike = async (postId: string) => {
    // Optimistic update
    setFeed(prev => prev.map(item => {
      if (item.id === postId) {
        const isLiked = !item.is_liked_by_me
        return {
          ...item,
          is_liked_by_me: isLiked,
          likes_count: (item.likes_count || 0) + (isLiked ? 1 : -1)
        }
      }
      return item
    }))

    // Server update
    await communityService.toggleLike(postId)
  }

  const toggleComments = async (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }))
    if (!comments[postId]) {
      const res = await communityService.getFeedComments(postId)
      if (res.data) setComments(prev => ({ ...prev, [postId]: res.data! }))
    }
  }

  const handleCommentSubmit = async (postId: string, e: React.FormEvent) => {
    e.preventDefault()
    const content = commentInput[postId]
    if (!content || !content.trim() || isSubmitting) return

    setIsSubmitting(true)
    const res = await communityService.addFeedComment(postId, content)
    if (res.data) {
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data!]
      }))
      setCommentInput(prev => ({ ...prev, [postId]: '' }))
      // optimistically update the feed item count
      setFeed(prev => prev.map(item => {
        if (item.id === postId) {
          return { ...item, comments_count: (item.comments_count || 0) + 1 }
        }
        return item
      }))
    }
    setIsSubmitting(false)
  }

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return t('justNow') || 'Ahora'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-accent/5 rounded-[2rem]" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {feed.length === 0 ? (
        <div className="py-20 text-center opacity-20">
          <Activity className="h-16 w-16 mx-auto mb-4" />
          <p className="font-black uppercase tracking-widest italic">Nada nuevo por aquí...</p>
        </div>
      ) : (
        feed.map((item, index) => (
          <div
            key={item.id}
            className="group bg-background border border-white/5 rounded-[2rem] overflow-hidden shadow-xl transition-all hover:border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Header: User Info */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20 rounded-2xl">
                  <AvatarFallback className="bg-primary/5 text-primary font-black italic text-sm">
                    {item.nickname?.[0] || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-black uppercase italic tracking-tight text-sm leading-none">{item.nickname || 'Atleta'}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{formatTimeAgo(item.created_at)}</p>
                </div>
              </div>
              <div className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center",
                item.type === 'pr_achieved' ? "bg-amber-500/10 text-amber-500" :
                item.type === 'streak' ? "bg-orange-500/10 text-orange-500" :
                "bg-primary/10 text-primary"
              )}>
                {item.type === 'pr_achieved' ? <Trophy className="h-4 w-4" /> :
                 item.type === 'streak' ? <Flame className="h-4 w-4" /> :
                 <Dumbbell className="h-4 w-4" />}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6">
               <h3 className="text-xl font-black italic uppercase tracking-tighter leading-tight">
                  {item.type === 'workout_completed' && (
                    <>Completó <span className="text-primary">{item.payload?.routine_name || 'entrenamiento'}</span></>
                  )}
                  {item.type === 'pr_achieved' && (
                    <>Nuevo Personal Record en <span className="text-amber-500">{item.payload?.exercise}</span></>
                  )}
                  {item.type === 'streak' && (
                    <>Alcanzó una racha de <span className="text-orange-500">{item.payload?.days} Días</span></>
                  )}
               </h3>
               
               {item.payload?.volume && (
                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Dumbbell className="h-3 w-3" />
                    Volumen Total: <span className="text-foreground">{Number(item.payload.volume).toLocaleString()} kg</span>
                 </p>
               )}
               
               {item.type === 'pr_achieved' && (
                 <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
                    <p className="text-[10px] font-black uppercase text-amber-500 opacity-60 mb-1">Nueva Marca Personal</p>
                    <p className="text-3xl font-black italic text-amber-500 leading-none">{item.payload?.weight} kg</p>
                 </div>
               )}
            </div>

            {/* Footer: Reactions */}
            <div className="px-4 py-3 bg-accent/5 flex items-center justify-between border-t border-white/5">
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleLike(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all",
                    item.is_liked_by_me 
                      ? "bg-red-500/10 border-red-500/30 text-red-500" 
                      : "bg-background border-white/5 hover:bg-primary/5 hover:border-primary/20 text-foreground"
                  )}
                >
                   <Heart className={cn("h-4 w-4", item.is_liked_by_me && "fill-current")} />
                   {item.likes_count ? <span className="text-[10px] font-black">{item.likes_count}</span> : null}
                </button>
                <button 
                  onClick={() => toggleComments(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-white/5 hover:bg-primary/5 hover:border-primary/20 transition-all font-black text-foreground"
                >
                   <MessageSquare className="h-4 w-4" />
                   {item.comments_count ? <span className="text-[10px] font-black">{item.comments_count}</span> : null}
                </button>
              </div>
              {item.like_users && item.like_users.length > 0 && (
                <div className="flex -space-x-2">
                  {item.like_users.slice(0, 3).map((u, i) => (
                    <div 
                      key={u.id || i} 
                      className="h-6 w-6 rounded-lg bg-accent border border-background flex items-center justify-center font-black text-[8px] italic text-primary"
                      title={u.nickname || 'Atleta'}
                    >
                      {u.nickname ? u.nickname.substring(0, 2).toUpperCase() : 'AT'}
                    </div>
                  ))}
                  {item.like_users.length > 3 && (
                    <div className="h-6 w-6 rounded-lg bg-background border border-accent flex items-center justify-center font-black text-[8px] italic text-muted-foreground">
                      +{item.like_users.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comments Section */}
            {expandedComments[item.id] && (
              <div className="bg-background/50 border-t border-white/5 px-4 py-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto scrollbar-none pr-2">
                  {!comments[item.id] ? (
                    <div className="text-[10px] font-black uppercase text-center opacity-30 italic py-2">Cargando...</div>
                  ) : comments[item.id].length === 0 ? (
                    <div className="text-[10px] font-black uppercase text-center opacity-30 italic py-2">Sé el primero en comentar</div>
                  ) : (
                    comments[item.id].map(comment => (
                      <div key={comment.id} className="flex gap-2 animate-in slide-in-from-left-2 duration-300">
                        <Avatar className="h-6 w-6 rounded-lg mt-0.5 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-[8px] font-black text-primary">
                            {comment.nickname?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-accent/10 rounded-2xl rounded-tl-sm px-3 py-2">
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span className="text-[10px] font-black uppercase italic tracking-tight">{comment.nickname || 'Atleta'}</span>
                            <span className="text-[8px] font-bold text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                          </div>
                          <p className="text-xs text-foreground/80 leading-snug">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={(e) => handleCommentSubmit(item.id, e)} className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput[item.id] || ''}
                    onChange={(e) => setCommentInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Escribe un comentario..."
                    className="flex-1 bg-accent/10 border border-white/5 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/30 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!commentInput[item.id]?.trim() || isSubmitting}
                    className="h-[34px] w-[34px] shrink-0 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send className="h-3 w-3 -ml-0.5" />
                  </button>
                </form>
              </div>
            )}

          </div>
        ))
      )}
    </div>
  )
}
