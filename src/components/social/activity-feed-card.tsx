/**
 * Activity Feed Card - Rediseño Total
 * Feed estilo red social moderno con tarjetas de logros visuales.
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Activity, Dumbbell, Trophy, Flame, Heart, MessageSquare } from 'lucide-react'
import { communityService } from '@/domain/services/community.service'
import { ActivityFeedItem } from '@/types'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function ActivityFeedCard() {
  const t = useTranslations('social')
  const [feed, setFeed] = useState<ActivityFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-white/5 hover:bg-primary/5 hover:border-primary/20 transition-all font-black text-[10px] uppercase italic">
                   <Heart className="h-3 w-3" /> Like
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-white/5 hover:bg-primary/5 hover:border-primary/20 transition-all font-black text-[10px] uppercase italic opacity-30 cursor-not-allowed">
                   <MessageSquare className="h-3 w-3" /> Comment
                </button>
              </div>
              
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-6 w-6 rounded-lg bg-accent border border-background flex items-center justify-center font-black text-[8px] italic">
                     U{i}
                   </div>
                 ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
